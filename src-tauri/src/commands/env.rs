
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
use crate::commands::config::*;
use crate::commands::fs::*;
use crate::commands::chat::*;
use crate::commands::skills::*;
use crate::commands::utils::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EnvironmentStatus {
    node_version: Option<String>,
    npm_version: Option<String>,
    git_version: Option<String>,
    python_version: Option<String>,
    go_version: Option<String>,
    java_version: Option<String>,
    // AI Tools
    gh_version: Option<String>,
    claude_version: Option<String>,
    opencode_version: Option<String>,
    qoder_version: Option<String>,
    codebuddy_version: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ToolStatus {
    id: String,
    installed: bool,
    version: Option<String>,
}

#[tauri::command]
pub fn check_executable(program: String, args: Vec<String>) -> Option<String> {
    get_version(
        &program,
        &args.iter().map(|s| s.as_str()).collect::<Vec<&str>>(),
    )
}

#[tauri::command]
pub fn check_environment() -> EnvironmentStatus {
    EnvironmentStatus {
        node_version: get_version("node", &["-v"]),
        npm_version: get_version("npm", &["-v"]),
        git_version: get_version("git", &["--version"]),
        python_version: get_version("python", &["--version"])
            .or_else(|| get_version("python3", &["--version"])),
        go_version: get_version("go", &["version"]),
        java_version: get_version("java", &["-version"]),
        gh_version: get_version("gh", &["--version"]),
        claude_version: get_version("claude", &["--version"]),
        opencode_version: get_version("opencode", &["--version"]),
        qoder_version: get_version("qoder", &["--version"]),
        codebuddy_version: get_version("codebuddy", &["--version"]),
    }
}

#[tauri::command]
pub fn launch_tool(tool_id: String) -> Result<String, String> {
    launch_tool_with_args(tool_id, None)
}

#[tauri::command]
pub fn launch_tool_with_args(tool_id: String, args: Option<Vec<String>>) -> Result<String, String> {
    let program = match tool_id.as_str() {
        "claude" => "claude",
        "google" => "gemini",
        "opencode" => "opencode",
        "qoder" => "qodercli",
        "codebuddy" => "codebuddy",
        "copilot" => "copilot",
        "codex" => "codex",
        "open_in_ide" => {
            if let Some(ref a) = args {
                if a.len() >= 2 {
                    let ide_path = &a[0];
                    let file_path = &a[1];
                    Command::new(ide_path)
                        .arg(file_path)
                        .spawn()
                        .map_err(|e| e.to_string())?;
                    return Ok(format!("Opened {} in IDE", file_path));
                }
            }
            return Err("Invalid arguments for open_in_ide".to_string());
        }
        _ => return Err("Unknown tool".to_string()),
    };

    let mut full_args = Vec::new();
    if let Some(a) = args {
        full_args.extend(a);
    }

    // Launch in a new terminal window
    #[cfg(target_os = "windows")]
    {
        // Use 'sh' (Git Bash) instead of powershell as requested by user
        let mut full_cmd = program.to_string();
        for arg in &full_args {
            full_cmd.push_str(" ");
            full_cmd.push_str(arg);
        }
        
        // Use 'cmd /C start sh -c ...' to open a new bash window
        // We add '|| read -p "Press Enter to close..." ' to keep it open if it fails or finishes fast
        let bash_cmd = format!("{} || read -n 1 -p 'Press any key to close...'", full_cmd);
        
        Command::new("cmd")
            .args(&["/C", "start", "sh", "-c", &bash_cmd])
            .spawn()
            .map_err(|e| format!("Failed to launch Git Bash (sh): {}. Please ensure Git Bash is in your PATH.", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        let mut final_cmd = program.to_string();
        for arg in &full_args {
            final_cmd.push_str(" ");
            final_cmd.push_str(arg);
        }
        Command::new("open")
            .args(&["-a", "Terminal", &final_cmd])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        let mut final_args = vec![program.to_string()];
        final_args.extend(full_args.clone());
        Command::new("x-terminal-emulator")
            .args(&["-e"])
            .args(&final_args)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(format!("Launched {} with args {:?}", tool_id, full_args))
}

#[tauri::command]
pub async fn install_tool(tool_id: String) -> Result<String, String> {
    let install_package = match tool_id.as_str() {
        "claude" => "@anthropic-ai/claude-code",
        "google" => "@google/gemini-cli",
        "opencode" => "opencode-ai",
        "qoder" => "@qoder-ai/qodercli",
        "codebuddy" => "@tencent-ai/codebuddy-code",
        "copilot" => "@github/copilot",
        "codex" => "@openai/codex",
        _ => return Err("Installation not supported for this tool yet".to_string()),
    };

    // This is a simplified install command execution
    // Ideally we stream output to frontend, here we just wait
    // Note: This blocks the thread, should use async command in real app
    // Determine the npm program and arguments based on OS
    let (program, args) = if cfg!(target_os = "windows") {
        ("npm.cmd", vec!["install", "-g", install_package])
    } else {
        ("npm", vec!["install", "-g", install_package])
    };

    println!("Executing install command: {} {:?}", program, args);

    let output = create_background_command(program)
        .args(&args)
        .output()
        .map_err(|e| {
            let err_msg = e.to_string();
            println!("Install command failed to launch: {}", err_msg);
            err_msg
        })?;

    if output.status.success() {
        println!("npm install finished. Verifying {}...", tool_id);
        // Verify installation by checking status
        let status = check_tool_status(tool_id.clone());
        if status.installed {
            println!(
                "Verification successful: {} is installed (v{:?}).",
                tool_id, status.version
            );
            Ok("Installation successful".to_string())
        } else {
            println!("Verification failed: {} not found after install.", tool_id);
            Err(format!(
                "Installation appeared successful but tool {} was not found. Please check PATH.",
                tool_id
            ))
        }
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        println!("Installation of {} failed. Stderr: {}", tool_id, stderr);
        Err(stderr)
    }
}

#[tauri::command]
pub async fn update_tool(tool_id: String) -> Result<String, String> {
    let package = match tool_id.as_str() {
        "claude" => "@anthropic-ai/claude-code@latest",
        "google" => "@google/gemini-cli@latest",
        "opencode" => "opencode-ai@latest",
        "qoder" => "@qoder-ai/qodercli@latest",
        "codebuddy" => "@tencent-ai/codebuddy-code@latest",
        "copilot" => "@github/copilot@latest",
        "codex" => "@openai/codex@latest",
        _ => return Err("Update not supported for this tool".to_string()),
    };

    let (program, args) = if cfg!(target_os = "windows") {
        ("npm.cmd", vec!["install", "-g", package])
    } else {
        ("npm", vec!["install", "-g", package])
    };

    let output = create_background_command(program)
        .args(&args)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("Update successful".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn uninstall_tool(tool_id: String) -> Result<String, String> {
    let package = match tool_id.as_str() {
        "claude" => "@anthropic-ai/claude-code",
        "google" => "@google/gemini-cli",
        "opencode" => "opencode-ai",
        "qoder" => "@qoder-ai/qodercli",
        "codebuddy" => "@tencent-ai/codebuddy-code",
        "copilot" => "@github/copilot",
        "codex" => "@openai/codex",
        _ => return Err("Uninstall not supported for this tool".to_string()),
    };

    let (program, args) = if cfg!(target_os = "windows") {
        ("npm.cmd", vec!["uninstall", "-g", package])
    } else {
        ("npm", vec!["uninstall", "-g", package])
    };

    let output = create_background_command(program)
        .args(&args)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("Uninstallation successful".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub fn check_tool_status(tool_id: String) -> ToolStatus {
    let (program, args) = match tool_id.as_str() {
        "claude" => {
            if cfg!(target_os = "windows") {
                ("claude.cmd", vec!["--version"])
            } else {
                ("claude", vec!["--version"])
            }
        }
        "google" => {
            if cfg!(target_os = "windows") {
                ("gemini.cmd", vec!["--version"])
            } else {
                ("gemini", vec!["--version"])
            }
        }
        "opencode" => {
            if cfg!(target_os = "windows") {
                ("opencode.cmd", vec!["--version"])
            } else {
                ("opencode", vec!["--version"])
            }
        }
        "qoder" => {
            if cfg!(target_os = "windows") {
                ("qodercli.cmd", vec!["--version"])
            } else {
                ("qodercli", vec!["--version"])
            }
        }
        "codebuddy" => {
            if cfg!(target_os = "windows") {
                ("codebuddy.cmd", vec!["--version"])
            } else {
                ("codebuddy", vec!["--version"])
            }
        }
        "copilot" => {
            if cfg!(target_os = "windows") {
                ("copilot.cmd", vec!["--version"])
            } else {
                ("copilot", vec!["--version"])
            }
        }
        "codex" => {
            if cfg!(target_os = "windows") {
                ("codex.cmd", vec!["--version"])
            } else {
                ("codex", vec!["--version"])
            }
        }
        _ => {
            return ToolStatus {
                id: tool_id,
                installed: false,
                version: None,
            }
        }
    };

    let version = get_version(program, &args);

    ToolStatus {
        id: tool_id,
        installed: version.is_some(),
        version,
    }
}

