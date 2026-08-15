#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod printer;
mod queue;
mod client;

use queue::{SpoolQueue, PrintJob, AgentLog};
use printer::{detect_system_printers, DiscoveredPrinter, send_to_hardware_spooler};
use client::{ApiClient, HeartbeatPayload, JobStatusPayload};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::time;

pub struct AppState {
    pub shop_id: Mutex<Option<String>>,
    pub agent_token: Mutex<Option<String>>,
    pub selected_printer: Mutex<Option<String>>,
    pub server_url: Mutex<String>,
    pub queue: Arc<SpoolQueue>,
}

#[tauri::command]
fn pair_agent(
    shop_id: String,
    token: String,
    server_url: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    if token.is_empty() || shop_id.is_empty() {
        return Err("Pairing token and Shop ID cannot be empty.".to_string());
    }

    *state.shop_id.lock().unwrap() = Some(shop_id.clone());
    *state.agent_token.lock().unwrap() = Some(token.clone());
    *state.server_url.lock().unwrap() = server_url;

    state.queue.add_log(
        "SUCCESS",
        &format!("Successfully paired with Shop Hub {} using token.", shop_id),
    );

    Ok("SUCCESS".to_string())
}

#[tauri::command]
fn get_printers() -> Vec<DiscoveredPrinter> {
    detect_system_printers()
}

#[tauri::command]
fn select_printer(printer_name: String, state: tauri::State<'_, AppState>) {
    *state.selected_printer.lock().unwrap() = Some(printer_name.clone());
    state.queue.add_log("INFO", &format!("Default printer set to: {}", printer_name));
}

#[tauri::command]
fn get_queue_jobs(state: tauri::State<'_, AppState>) -> Vec<PrintJob> {
    state.queue.get_jobs()
}

#[tauri::command]
fn get_logs_stream(state: tauri::State<'_, AppState>) -> Vec<AgentLog> {
    state.queue.get_logs()
}

#[tauri::command]
fn trigger_manual_job(
    order_number: String,
    customer_name: String,
    file_name: String,
    download_url: String,
    copies: u32,
    state: tauri::State<'_, AppState>,
) {
    let job = PrintJob {
        order_number,
        customer_name,
        file_name,
        download_url,
        copies,
        status: "Pending".to_string(),
        retry_count: 0,
        timestamp: chrono::Local::now().format("%H:%M:%S").to_string(),
    };
    state.queue.push_job(job);
}

// Background thread loop for processing print queue tasks and sending heartbeats
fn start_daemon_loops(state: Arc<AppState>) {
    // 1. Heartbeat Loop
    let heartbeat_state = state.clone();
    tokio::spawn(async move {
        let client = ApiClient::new("http://localhost:3000"); // Standard localhost redirect fallback
        loop {
            time::sleep(Duration::from_secs(10)).await;

            let shop_id_opt = heartbeat_state.shop_id.lock().unwrap().clone();
            let token_opt = heartbeat_state.agent_token.lock().unwrap().clone();

            if let (Some(shop_id), Some(token)) = (shop_id_opt, token_opt) {
                let printer_name = heartbeat_state.selected_printer.lock().unwrap().clone()
                    .unwrap_or_else(|| "Canon imageRUNNER ADVANCE C5535i".to_string());
                
                let mut p_status = "online".to_string();
                let mut p_paper = 85;
                let mut p_toner = 90;

                let system_printers = detect_system_printers();
                if let Some(p) = system_printers.iter().find(|x| x.name == printer_name) {
                    p_status = p.status.clone();
                    p_paper = p.paper_level;
                    p_toner = p.toner_level;
                }

                let payload = HeartbeatPayload {
                    shop_id,
                    agent_token: token,
                    status: "active".to_string(),
                    printer_status: p_status,
                    paper_tray_level: p_paper,
                    toner_level: p_toner,
                    queue_length: heartbeat_state.queue.get_jobs().len(),
                };

                let res = client.send_heartbeat(payload).await;
                if let Err(e) = res {
                    heartbeat_state.queue.add_log("WARNING", &format!("Heartbeat error: {}", e));
                    *heartbeat_state.queue.is_online.lock().unwrap() = false;
                } else {
                    *heartbeat_state.queue.is_online.lock().unwrap() = true;
                }
            }
        }
    });

    // 2. Print Queue Processing Spooler Thread
    let spooler_state = state.clone();
    tokio::spawn(async move {
        let client = ApiClient::new("http://localhost:3000");
        loop {
            time::sleep(Duration::from_millis(500)).await;

            let mut queue_jobs = spooler_state.queue.jobs.lock().unwrap();
            if let Some(mut current_job) = queue_jobs.pop_front() {
                drop(queue_jobs); // Release lock while downloading & spooling

                spooler_state.queue.add_log(
                    "INFO",
                    &format!("Spooler: Downloading document PDF for Order #{}", current_job.order_number),
                );

                // Simulate secure document download
                time::sleep(Duration::from_secs(1)).await;

                let printer_name = spooler_state.selected_printer.lock().unwrap().clone()
                    .unwrap_or_else(|| "Canon imageRUNNER ADVANCE C5535i".to_string());

                spooler_state.queue.add_log(
                    "INFO",
                    &format!("Spooler: Printing cover sheet & document PDF to {}", printer_name),
                );

                // Notify Server: Printing Started
                let token = spooler_state.agent_token.lock().unwrap().clone().unwrap_or_default();
                let _ = client.report_job_status(&token, JobStatusPayload {
                    order_number: current_job.order_number.clone(),
                    status: "printing_started".to_string(),
                    error_message: None,
                }).await;

                // Spool execution
                let spool_res = send_to_hardware_spooler(&printer_name, &current_job.file_name);
                
                if spool_res.is_ok() {
                    spooler_state.queue.add_log(
                        "SUCCESS",
                        &format!("Spooler: Spooling completed for Order #{}", current_job.order_number),
                    );
                    
                    // Notify Server: Printing Completed
                    let _ = client.report_job_status(&token, JobStatusPayload {
                        order_number: current_job.order_number.clone(),
                        status: "printing_completed".to_string(),
                        error_message: None,
                    }).await;
                } else {
                    spooler_state.queue.add_log(
                        "ERROR",
                        &format!("Spooler: Spooling failed for Order #{}", current_job.order_number),
                    );

                    // Offline retry or fail notification
                    if current_job.retry_count < 3 {
                        current_job.retry_count += 1;
                        spooler_state.queue.add_log(
                            "WARNING",
                            &format!("Spooler: Queueing for retry #{} in 10s", current_job.retry_count),
                        );
                        time::sleep(Duration::from_secs(10)).await;
                        spooler_state.queue.push_job(current_job);
                    } else {
                        let _ = client.report_job_status(&token, JobStatusPayload {
                            order_number: current_job.order_number.clone(),
                            status: "printing_failed".to_string(),
                            error_message: Some("Spooling failed after 3 retries.".to_string()),
                        }).await;
                    }
                }
            }
        }
    });
}

fn main() {
    let state = Arc::new(AppState {
        shop_id: Mutex::new(None),
        agent_token: Mutex::new(None),
        selected_printer: Mutex::new(None),
        server_url: Mutex::new("http://localhost:3000".to_string()),
        queue: Arc::new(SpoolQueue::new()),
    });

    start_daemon_loops(state.clone());

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            pair_agent,
            get_printers,
            select_printer,
            get_queue_jobs,
            get_logs_stream,
            trigger_manual_job
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
