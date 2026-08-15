use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use std::collections::VecDeque;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrintJob {
    pub order_number: String,
    pub customer_name: String,
    pub file_name: String,
    pub download_url: String,
    pub copies: u32,
    pub status: String,
    pub retry_count: u32,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentLog {
    pub level: String,
    pub message: String,
    pub timestamp: String,
}

pub struct SpoolQueue {
    pub jobs: Mutex<VecDeque<PrintJob>>,
    pub logs: Mutex<Vec<AgentLog>>,
    pub is_online: Mutex<bool>,
}

impl SpoolQueue {
    pub fn new() -> Self {
        Self {
            jobs: Mutex::new(VecDeque::new()),
            logs: Mutex::new(Vec::new()),
            is_online: Mutex::new(true),
        }
    }

    pub fn add_log(&self, level: &str, message: &str) {
        let mut logs = self.logs.lock().unwrap();
        let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        logs.push(AgentLog {
            level: level.to_string(),
            message: message.to_string(),
            timestamp,
        });
        println!("[{}] [{}] {}", timestamp, level, message);
    }

    pub fn push_job(&self, job: PrintJob) {
        let mut queue = self.jobs.lock().unwrap();
        self.add_log("INFO", &format!("Queued print job for Order #{}", job.order_number));
        queue.push_back(job);
    }

    pub fn get_jobs(&self) -> Vec<PrintJob> {
        let queue = self.jobs.lock().unwrap();
        queue.iter().cloned().collect()
    }

    pub fn get_logs(&self) -> Vec<AgentLog> {
        let logs = self.logs.lock().unwrap();
        logs.iter().cloned().collect()
    }
}
