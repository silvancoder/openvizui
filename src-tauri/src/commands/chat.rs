
#![allow(unused_imports)]
#![allow(dead_code)]

use futures_util::StreamExt;
use portable_pty::{Child, CommandBuilder, MasterPty, NativePtySystem, PtySize, PtySystem};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use std::cmp::min;
use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter, Manager, State};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use crate::commands::pty::*;
use crate::commands::env::*;
use crate::commands::config::*;
use crate::commands::fs::*;
use crate::commands::skills::*;
use crate::commands::utils::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelEntry {
    id: Option<String>,
    name: Option<String>,
    object: Option<String>,
    created: Option<u64>,
    owned_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatSessionConfig {
    #[serde(rename = "chatType")]
    pub chat_type: String, // "normal", "code", "deep"
    #[serde(rename = "mcpEnabled")]
    pub mcp_enabled: bool,
    #[serde(rename = "skillsEnabled")]
    pub skills_enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelsResponse {
    data: Option<Vec<ModelEntry>>,
    models: Option<Vec<ModelEntry>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatSession {
    pub id: String,
    pub title: String,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "updatedAt")]
    pub updated_at: u64,
    #[serde(rename = "toolId")]
    pub tool_id: String,
    pub config: ChatSessionConfig,
    pub messages: Vec<ChatMessage>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub id: String,
    #[serde(rename = "type")]
    pub msg_type: String, // "user" or "assistant"
    pub content: String,
    pub timestamp: u64,
}

pub fn get_sessions_path(app: &AppHandle) -> std::path::PathBuf {
    let app_dir = app.path().app_config_dir().unwrap();
    app_dir.join("sessions.json")
}

#[tauri::command]
pub fn get_chat_sessions(app: AppHandle) -> Result<Vec<ChatSession>, String> {
    let sessions_path = get_sessions_path(&app);
    if !sessions_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(sessions_path).map_err(|e| e.to_string())?;
    let sessions: Vec<ChatSession> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(sessions)
}

#[tauri::command]
pub fn save_chat_sessions(app: AppHandle, sessions: Vec<ChatSession>) -> Result<(), String> {
    let sessions_path = get_sessions_path(&app);
    let dir = sessions_path.parent().unwrap();
    if !dir.exists() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(&sessions).map_err(|e| e.to_string())?;
    fs::write(sessions_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn fetch_remote_models(
    app: AppHandle,
    base_url: String,
    api_key: String,
    api_type: Option<String>,
) -> Result<Vec<String>, String> {
    // Ensure base_url ends with /v1 or /v1/, adjust if necessary
    // Actually, usually users provide "https://api.openai.com/v1"
    // We want to fetch "{base_url}/models".
    // If base_url ends with slash, remove it first
    let clean_base = base_url.trim_end_matches('/');
    let url = format!("{}/models", clean_base);

    println!("Fetching models from: {}", url);

    let client = get_proxy_client(&app)?;

    // Determine authentication header based on api_type
    let mut request = client.get(&url);

    match api_type.as_deref() {
        Some("anthropic") => {
            // Anthropic uses x-api-key header
            request = request.header("x-api-key", &api_key);
            request = request.header("anthropic-version", "2023-06-01");
        }
        Some("google") => {
            // Google AI Studio uses x-goog-api-key
            request = request.header("x-goog-api-key", &api_key);
        }
        _ => {
            // Default to OpenAI-style Bearer token
            request = request.header("Authorization", format!("Bearer {}", api_key));
        }
    }

    let res = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("API Error: {}", res.status()));
    }

    let body = res
        .text()
        .await
        .map_err(|e| format!("Failed to read body: {}", e))?;
    // println!("Models response: {}", body); // Debug

    let response: ModelsResponse =
        serde_json::from_str(&body).map_err(|e| format!("Failed to parse JSON: {}", e))?;

    let mut model_ids = Vec::new();

    if let Some(data) = response.data {
        for m in data {
            if let Some(id) = m.id {
                model_ids.push(id);
            }
        }
    }

    if let Some(models) = response.models {
        for m in models {
            if let Some(name) = m.name {
                // Google names are usually like "models/gemini-1.5-pro"
                // We might want to strip the prefix or keep it. 
                // Gemini CLI usually just wants the name.
                let clean_name = name.trim_start_matches("models/").to_string();
                model_ids.push(clean_name);
            }
        }
    }

    Ok(model_ids)
}

#[tauri::command]
pub fn get_models(provider: String) -> Result<Vec<String>, String> {
    let output = if cfg!(target_os = "windows") {
        let mut args = vec!["/C", "opencode", "models"];
        if !provider.is_empty() {
            args.push(&provider);
        }
        Command::new("cmd").args(args).output()
    } else {
        let mut args = vec!["models"];
        if !provider.is_empty() {
            args.push(&provider);
        }
        Command::new("opencode").args(args).output()
    };

    match output {
        Ok(o) => {
            if o.status.success() {
                let stdout = String::from_utf8_lossy(&o.stdout);
                let models: Vec<String> = stdout
                    .lines()
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect();
                Ok(models)
            } else {
                let stderr = String::from_utf8_lossy(&o.stderr);
                Err(format!("Command failed: {}", stderr))
            }
        }
        Err(e) => Err(format!("Failed to execute command: {}", e)),
    }
}

