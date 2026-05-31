
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

use crate::commands::env::*;
use crate::commands::config::*;
use crate::commands::fs::*;
use crate::commands::chat::*;
use crate::commands::skills::*;
use crate::commands::utils::*;

pub struct PtySession {
    writer: Box<dyn Write + Send>,
    master: Box<dyn MasterPty + Send>,
    child: Box<dyn Child + Send>,
}

impl Drop for PtySession {
    fn drop(&mut self) {
        let _ = self.child.kill();
    }
}

pub struct AppPty {
    pub sessions: Arc<Mutex<HashMap<String, PtySession>>>,
}

impl Default for AppPty {
    fn default() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

pub fn create_background_command(program: &str) -> Command {
    #[allow(unused_mut)]
    let mut cmd = Command::new(program);
    #[cfg(windows)]
    cmd.creation_flags(0x08000000); // ash::windows::process::CREATE_NO_WINDOW
    cmd
}

#[tauri::command]
pub fn pty_open(app: AppHandle, state: State<'_, AppPty>, id: String, cols: u16, rows: u16) -> Result<(), String> {
    let pty_system = NativePtySystem::default();

    let pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let config = get_app_config(app.clone());
    let cmd_line = config.terminal_shell.clone().unwrap_or_else(|| {
        if cfg!(target_os = "windows") {
            // Try to find Git Bash first
            let git_bash = std::path::Path::new("C:\\Program Files\\Git\\bin\\bash.exe");
            if git_bash.exists() {
                "bash.exe".to_string()
            } else {
                "powershell.exe".to_string()
            }
        } else {
            "bash".to_string()
        }
    });

    let mut cmd = if cmd_line == "wsl" {
        CommandBuilder::new("wsl.exe")
    } else {
        // Special handling for Git Bash (bash.exe) which might not be in PATH
        let resolved_cmd = if cmd_line == "bash.exe" {
            let default_path = std::path::Path::new("C:\\Program Files\\Git\\bin\\bash.exe");
            if default_path.exists() {
                default_path.to_str().unwrap().to_string()
            } else {
                 // If bash.exe is requested but not found at standard location, 
                 // and we are on windows, fallback to powershell if "bash" isn't in path?
                 // For now, let's just trust the user or the default logic above
                 if cfg!(target_os = "windows") && !which::which("bash").is_ok() {
                    "powershell.exe".to_string()
                 } else {
                    cmd_line
                 }
            }
        } else {
            cmd_line
        };

        let mut builder = CommandBuilder::new(&resolved_cmd);
        if resolved_cmd.to_lowercase().contains("powershell") {
            builder.args(&["-NoLogo"]);
        }
        // If it's bash, launch as login shell to load profile
        if resolved_cmd.ends_with("bash.exe") {
            builder.args(&["--login", "-i"]);
        }
        builder
    };

    // Suppress auto-update popups for common CLI tools
    cmd.env("CHECK_UPDATE", "0");
    cmd.env("NO_UPDATE_CHECK", "1");
    cmd.env("ADBLOCK", "1");
    cmd.env("DISABLE_UPDATE_CHECKER", "true");
    cmd.env("NPM_CONFIG_UPDATE_NOTIFIER", "false");

    if let Some(cwd) = config.current_directory {
        if !cwd.is_empty() {
            if std::path::Path::new(&cwd).exists() {
                cmd.cwd(cwd);
            } else {
                println!("Warning: Saved directory does not exist: {}", cwd);
            }
        }
    }

    // Proxy Injection for Terminal
    if let (Some(proxy_type), Some(address)) = (
        config.proxy_type.as_deref(),
        config.proxy_address.as_deref(),
    ) {
        if !address.is_empty() && proxy_type != "none" {
            let proxy_scheme = if proxy_type == "socks5" {
                "socks5://"
            } else {
                "http://"
            };
            let proxy_url = if address.contains("://") {
                address.to_string()
            } else {
                format!("{}{}", proxy_scheme, address)
            };

            println!("Injecting Proxy to Terminal: {}", proxy_url);

            // Set standard proxy environment variables
            cmd.env("HTTP_PROXY", &proxy_url);
            cmd.env("HTTPS_PROXY", &proxy_url);
            cmd.env("ALL_PROXY", &proxy_url);

            // For good measure, lowercase too
            cmd.env("http_proxy", &proxy_url);
            cmd.env("https_proxy", &proxy_url);
            cmd.env("all_proxy", &proxy_url);
        }
    }

    let child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn shell: {}", e))?;
    println!("Shell spawned successfully: {:?}", child);

    // Release slave immediately to allow shell to close it when it exits
    drop(pair.slave);

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    // Store session
    let session = PtySession {
        writer,
        master: pair.master,
        child,
    };
    
    state.sessions.lock().unwrap().insert(id.clone(), session);

    // Spawn thread to read from PTY
    let incoming_id = id.clone();
    thread::spawn(move || {
        let mut buf = [0u8; 1024];
        loop {
            match reader.read(&mut buf) {
                Ok(n) if n > 0 => {
                    let data = &buf[..n];
                    let payload = serde_json::json!({
                        "id": incoming_id,
                        "data": data
                    });
                    let _ = app.emit("pty-data", payload);
                }
                _ => break,
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub fn pty_close(state: State<'_, AppPty>, id: String) -> Result<(), String> {
    if let Some(mut session) = state.sessions.lock().unwrap().remove(&id) {
        let _ = session.child.kill();
    }
    Ok(())
}

#[tauri::command]
pub fn pty_write(state: State<'_, AppPty>, id: String, data: String) -> Result<(), String> {
    if let Some(session) = state.sessions.lock().unwrap().get_mut(&id) {
        write!(session.writer, "{}", data).map_err(|e| e.to_string())?;
        session.writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("PTY session not found".to_string())
    }
}

#[tauri::command]
pub fn pty_resize(state: State<'_, AppPty>, id: String, cols: u16, rows: u16) -> Result<(), String> {
    if let Some(session) = state.sessions.lock().unwrap().get_mut(&id) {
        session.master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn pty_exists(state: State<'_, AppPty>, id: String) -> bool {
    state.sessions.lock().unwrap().contains_key(&id)
}

