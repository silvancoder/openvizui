
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
use crate::commands::chat::*;
use crate::commands::utils::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct McpInfo {
    path: String,
    name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct McpToolInfo {
    name: String,
    description: Option<String>,
}

#[tauri::command]
pub fn list_installed_skills(target: String) -> Vec<McpInfo> {
    let mut mcps = Vec::new();
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .unwrap_or_default();

    let base_path = match target.to_lowercase().as_str() {
        "claude" => PathBuf::from(&home).join(".claude").join("skills"),
        "gemini" | "google" => PathBuf::from(&home).join(".gemini").join("skills"),
        "opencode" => PathBuf::from(&home)
            .join(".config")
            .join("opencode")
            .join("skills"),
        "qoder" => PathBuf::from(&home).join(".qoder").join("skills"),
        "codebuddy" => PathBuf::from(&home).join(".codebuddy").join("skills"),
        "copilot" => PathBuf::from(&home).join(".copilot").join("skills"),
        "codex" => PathBuf::from(&home).join(".codex").join("skills"),
        _ => PathBuf::from(&home).join(".agents").join("skills"),
    };

    if base_path.exists() {
        if let Ok(entries) = fs::read_dir(&base_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                        mcps.push(McpInfo {
                            path: path.to_string_lossy().to_string(),
                            name: name.to_string(),
                        });
                    }
                }
            }
        }
    }

    mcps
}

#[tauri::command]
pub fn install_skills(
    _app: AppHandle,
    url: String,
    name: Option<String>,
    target: String,
) -> Result<String, String> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Could not determine home directory".to_string())?;

    let target_base = match target.to_lowercase().as_str() {
        "claude" => PathBuf::from(&home).join(".claude").join("skills"),
        "gemini" | "google" => PathBuf::from(&home).join(".gemini").join("skills"),
        "opencode" => PathBuf::from(&home)
            .join(".config")
            .join("opencode")
            .join("skills"),
        "qoder" => PathBuf::from(&home).join(".qoder").join("skills"),
        "codebuddy" => PathBuf::from(&home).join(".codebuddy").join("skills"),
        "copilot" => PathBuf::from(&home).join(".copilot").join("skills"),
        "codex" => PathBuf::from(&home).join(".codex").join("skills"),
        _ => PathBuf::from(&home).join(".agents").join("skills"),
    };

    if !target_base.exists() {
        fs::create_dir_all(&target_base).map_err(|e| e.to_string())?;
    }

    let folder_name = if let Some(n) = name {
        n
    } else {
        // Extract owner and repo from URL to create a unique folder name: owner-repo
        let parts: Vec<&str> = url.trim_end_matches(".git").split('/').collect();
        if parts.len() >= 2 {
            let repo = parts[parts.len() - 1];
            let owner = parts[parts.len() - 2];
            format!("{}-{}", owner, repo)
        } else {
            url.split('/')
                .last()
                .unwrap_or("mcp_skill")
                .trim_end_matches(".git")
                .to_string()
        }
    };

    let target_path = target_base.join(&folder_name);

    if target_path.exists() {
        return Err(format!(
            "skills '{}' is already installed at {:?}",
            folder_name, target_path
        ));
    }

    println!("Cloning Skill to: {:?}", target_path);

    // Use git clone
    let output = Command::new("git")
        .args(&["clone", &url, target_path.to_str().unwrap()])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(format!("Installed {} successfully", folder_name))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub fn uninstall_skills(path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    if path_buf.exists() {
        fs::remove_dir_all(path_buf).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Path does not exist".to_string())
    }
}

#[tauri::command]
pub async fn inspect_mcp_server(
    command: String,
    args: Vec<String>,
    env: Option<std::collections::HashMap<String, String>>,
) -> Result<Vec<McpToolInfo>, String> {
    use std::io::BufRead;
    
    let mut cmd = if cfg!(target_os = "windows") && command == "npx" {
        let mut c = Command::new("cmd");
        c.args(&["/C", "npx"]);
        c.args(&args);
        c
    } else {
        let mut c = Command::new(&command);
        c.args(&args);
        c
    };

    if let Some(e) = env {
        for (k, v) in e {
            cmd.env(k, v);
        }
    }

    cmd.stdout(std::process::Stdio::piped());
    cmd.stdin(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::piped());

    #[cfg(windows)]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

    let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn MCP server: {}", e))?;
    
    let mut stdin = child.stdin.take().ok_or("Failed to open stdin")?;
    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let mut reader = std::io::BufReader::new(stdout);

    // 1. Initialize
    let init_req = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "capabilities": {},
            "clientInfo": {"name": "OpenVizUI", "version": "1.0.5"},
            "protocolVersion": "2026-03-12"
        }
    });
    
    let mut init_str = init_req.to_string();
    init_str.push('\n');
    stdin.write_all(init_str.as_bytes()).map_err(|e| e.to_string())?;
    stdin.flush().map_err(|e| e.to_string())?;

    // Read response (ignoring notification or logs until we get a result)
    let mut line = String::new();
    let mut initialized = false;
    for _ in 0..20 { // Try first 20 lines
        line.clear();
        if reader.read_line(&mut line).is_err() { break; }
        if line.trim().is_empty() { continue; }
        
        if let Ok(resp) = serde_json::from_str::<serde_json::Value>(&line) {
            if resp["id"] == 1 {
                initialized = true;
                break;
            }
        }
    }

    if !initialized {
        let _ = child.kill();
        return Err("Failed to receive initialize response from MCP server".to_string());
    }

    // 2. List Tools
    let list_req = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {}
    });
    
    let mut list_str = list_req.to_string();
    list_str.push('\n');
    stdin.write_all(list_str.as_bytes()).map_err(|e| e.to_string())?;
    stdin.flush().map_err(|e| e.to_string())?;

    let mut tools = Vec::new();
    let mut got_tools = false;
    for _ in 0..20 {
        line.clear();
        if reader.read_line(&mut line).is_err() { break; }
        if line.trim().is_empty() { continue; }
        
        if let Ok(resp) = serde_json::from_str::<serde_json::Value>(&line) {
            if resp["id"] == 2 {
                if let Some(result) = resp.get("result") {
                    if let Some(tools_arr) = result.get("tools").and_then(|t| t.as_array()) {
                        for t in tools_arr {
                            tools.push(McpToolInfo {
                                name: t["name"].as_str().unwrap_or("unknown").to_string(),
                                description: t["description"].as_str().map(|s| s.to_string()),
                            });
                        }
                        got_tools = true;
                        break;
                    }
                }
            }
        }
    }

    let _ = child.kill();
    
    if !got_tools {
        return Err("Failed to receive tools/list response from MCP server".to_string());
    }

    Ok(tools)
}

