
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
use crate::commands::fs::*;
use crate::commands::chat::*;
use crate::commands::skills::*;
use crate::commands::utils::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ToolConfig {
    pub working_directory: Option<String>,
    #[serde(rename = "llmApiKey")]
    pub llm_api_key: Option<String>,
    #[serde(rename = "llmBaseUrl")]
    pub llm_base_url: Option<String>,
    #[serde(rename = "llmModel")]
    pub llm_model: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CommandPreset {
    pub id: String,
    pub name: String,
    pub command: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub proxy_type: Option<String>,
    pub proxy_address: Option<String>,
    pub theme: Option<String>,
    pub language: Option<String>,
    pub active_tools: Option<Vec<String>>,
    pub primary_color: Option<String>,
    pub opacity: Option<f32>,
    pub font_family: Option<String>,
    pub text_color: Option<String>,
    // Terminal settings
    pub terminal_font_family: Option<String>,
    pub terminal_font_size: Option<u32>,
    pub terminal_background: Option<String>,
    pub terminal_foreground: Option<String>,
    pub terminal_cursor_style: Option<String>,
    pub terminal_shell: Option<String>,
    pub current_directory: Option<String>,
    pub active_tool_id: Option<String>,
    pub env_status: Option<EnvironmentStatus>,
    pub tool_statuses: Option<std::collections::HashMap<String, ToolStatus>>,
    pub tool_configs: Option<std::collections::HashMap<String, ToolConfig>>,
    pub command_presets: Option<Vec<CommandPreset>>,
    pub chat_sidebar_width: Option<u32>,
    pub resource_sidebar_width: Option<u32>,
    pub active_chat_tool_id: Option<String>,
    pub global_instructions: Option<String>,
    pub local_ai_base_url: Option<String>,
    pub local_ai_provider: Option<String>,
    pub ide_path: Option<String>,
    pub chat_providers: Option<Vec<String>>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            proxy_type: Some("none".to_string()),
            proxy_address: None,
            theme: Some("light".to_string()),
            language: Some("en".to_string()),
            active_tools: None,
            primary_color: Some("#1677ff".to_string()),
            opacity: Some(1.0),
            font_family: Some("Segoe UI".to_string()),
            text_color: None,
            terminal_font_family: Some("Cascadia Code".to_string()),
            terminal_font_size: Some(14),
            terminal_background: Some("#1e1e1e".to_string()),
            terminal_foreground: Some("#d4d4d4".to_string()),
            terminal_cursor_style: Some("block".to_string()),
            terminal_shell: if cfg!(target_os = "windows") {
                let git_bash = std::path::Path::new("C:\\Program Files\\Git\\bin\\bash.exe");
                if git_bash.exists() {
                     Some("bash.exe".to_string())
                } else {
                     Some("powershell.exe".to_string())
                }
            } else {
                Some("bash".to_string())
            },
            current_directory: None,
            active_tool_id: None,
            env_status: None,
            tool_statuses: None,
            tool_configs: Some(std::collections::HashMap::new()),
            global_instructions: None,
            local_ai_base_url: Some("http://localhost:11434".to_string()),
            local_ai_provider: Some("ollama".to_string()),
            ide_path: None,
            command_presets: None,
            chat_sidebar_width: Some(260),
            resource_sidebar_width: Some(280),
            active_chat_tool_id: None,
            chat_providers: None,
        }
    }
}

pub fn get_config_path(_app: &AppHandle) -> PathBuf {
    let mut path = std::env::current_exe().expect("failed to get current exe path");
    path.pop(); // Remove exe name
    path.push("app");
    path.push("config");

    // Ensure directory exists
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }

    path.join("config.json")
}

#[tauri::command]
pub fn get_app_config(app: AppHandle) -> AppConfig {
    let config_path = get_config_path(&app);
    if config_path.exists() {
        let content = fs::read_to_string(config_path).unwrap_or_default();
        // Use serde_json to parse. If it fails or is partial, we should merge with default
        let loaded_config: Option<AppConfig> = serde_json::from_str(&content).ok();

        if let Some(config) = loaded_config {
            // Ensure essential fields are not None if they shouldn't be (merging logic)
            // For now, simpler: if loaded successfully, return it. logic for active_tool_id is Option<String> so None is valid.
            config
        } else {
            // Failed to parse, return default
            AppConfig::default()
        }
    } else {
        AppConfig::default()
    }
}

#[tauri::command]
pub fn save_app_config(app: AppHandle, config: AppConfig) -> Result<(), String> {
    let config_path = get_config_path(&app);
    let dir = config_path.parent().unwrap();
    if !dir.exists() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_config_file(path: String) -> Result<String, String> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Could not determine home directory".to_string())?;

    // Expand ~ manually if present at the start of the path
    let expanded_path = if path.starts_with("~") {
        path.replacen("~", &home, 1)
    } else {
        path
    };

    let p = PathBuf::from(expanded_path);
    if !p.exists() {
        return Ok("".to_string()); // Return empty string if file doesn't exist yet
    }

    fs::read_to_string(p).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_config_file(path: String, content: String) -> Result<(), String> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Could not determine home directory".to_string())?;

    // Expand ~ manually
    let expanded_path = if path.starts_with("~") {
        path.replacen("~", &home, 1)
    } else {
        path
    };

    let p = PathBuf::from(expanded_path);

    // Ensure parent directory exists
    if let Some(parent) = p.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    fs::write(p, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_system_fonts() -> Vec<String> {
    #[cfg(target_os = "windows")]
    {
        let output = create_background_command("powershell")
            .args(&[
                "/C",
                "Add-Type -AssemblyName System.Drawing; [System.Drawing.FontFamily]::Families.Name",
            ])
            .output();

        if let Ok(out) = output {
            // Decode and split by newlines
            let stdout = String::from_utf8_lossy(&out.stdout);
            stdout
                .lines()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect()
        } else {
            Vec::new()
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        // Use fc-list for macOS/Linux
        // Assumes fontconfig is installed, which is standard on most desktop Linux
        // For macOS, it might not be installed by default, but system_profiler is an option.
        // Let's try fc-list first as it's cleaner output, fallback to system_profiler on mac if needed.
        
        // Command: fc-list : family
        let output = std::process::Command::new("fc-list")
            .arg(":")
            .arg("family")
            .output();

        if let Ok(out) = output {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let mut fonts: Vec<String> = stdout
                .lines()
                .flat_map(|line| {
                    line.split(',')
                        .map(|font| font.trim().to_string())
                        .collect::<Vec<String>>()
                })
                .filter(|s| !s.is_empty())
                .collect();
            
            fonts.sort();
            fonts.dedup();
            fonts
        } else {
            // Fallback for macOS if fc-list is missing
            #[cfg(target_os = "macos")]
            {
               let output_mac = std::process::Command::new("system_profiler")
                    .arg("SPFontsDataType")
                    .arg("-json")
                    .output();

                if let Ok(out) = output_mac {
                     // Parsing JSON in Rust without serde_json dependency here might be verbose.
                     // Simple grep approach? Or just return common fonts.
                     // Let's return a safe list if fc-list fails.
                     vec![
                        "Arial".to_string(),
                        "Helvetica".to_string(),
                        "Courier New".to_string(),
                        "Times New Roman".to_string(),
                        "Verdana".to_string(), 
                        "Monaco".to_string(),
                        "Menlo".to_string()
                     ]
                } else {
                    Vec::new()
                }
            }
            #[cfg(not(target_os = "macos"))]
            {
                Vec::new()
            }
        }
    }
}

