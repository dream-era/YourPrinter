use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct HeartbeatPayload {
    pub shop_id: String,
    pub agent_token: String,
    pub status: String,
    pub printer_status: String,
    pub paper_tray_level: u8,
    pub toner_level: u8,
    pub queue_length: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobStatusPayload {
    pub order_number: String,
    pub status: String,
    pub error_message: Option<String>,
}

pub struct ApiClient {
    base_url: String,
}

impl ApiClient {
    pub fn new(base_url: &str) -> Self {
        Self {
            base_url: base_url.to_string(),
        }
    }

    pub async fn send_heartbeat(&self, payload: HeartbeatPayload) -> Result<(), String> {
        let client = reqwest::Client::new();
        let url = format!("{}/api/autoprint/heartbeat", self.base_url);
        
        let response = client.post(&url)
            .header("x-autoprint-agent-token", &payload.agent_token)
            .json(&payload)
            .send()
            .await;

        match response {
            Ok(res) if res.status().is_success() => Ok(()),
            Ok(res) => Err(format!("Server returned HTTP status {}", res.status())),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn report_job_status(&self, agent_token: &str, payload: JobStatusPayload) -> Result<(), String> {
        let client = reqwest::Client::new();
        let url = format!("{}/api/autoprint/job-status", self.base_url);

        let response = client.post(&url)
            .header("x-autoprint-agent-token", agent_token)
            .json(&payload)
            .send()
            .await;

        match response {
            Ok(res) if res.status().is_success() => Ok(()),
            Ok(res) => Err(format!("Server returned HTTP status {}", res.status())),
            Err(e) => Err(e.to_string()),
        }
    }
}
