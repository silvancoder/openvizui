/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src-tauri\src\lib.rs
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

use futures_util::StreamExt;
use portable_pty::{Child, CommandBuilder, MasterPty, NativePtySystem, PtySize, PtySystem};
use serde::{Deserialize, Serialize};
use std::cmp::min;
use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter, State}; // For streaming response body

#[cfg(windows)]
use std::os::windows::process::CommandExt;

fn create_background_command(program: &str) -> Command {
    let mut cmd = Command::new(program);
    #[cfg(windows)]
    cmd.creation_flags(0x08000000); // ash::windows::process::CREATE_NO_WINDOW
    cmd
}
struct AppPty {
    writer: Arc<Mutex<Option<Box<dyn Write + Send>>>>,
    master: Arc<Mutex<Option<Box<dyn MasterPty + Send>>>>,
    child: Arc<Mutex<Option<Box<dyn Child + Send>>>>,
}

impl Default for AppPty {
    fn default() -> Self {
        Self {
            writer: Arc::new(Mutex::new(None)),
            master: Arc::new(Mutex::new(None)),
            child: Arc::new(Mutex::new(None)),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EnvironmentStatus {
    node_version: Option<String>,
    npm_version: Option<String>,
    git_version: Option<String>,
    python_version: Option<String>,
    go_version: Option<String>,
    java_version: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ToolStatus {
    id: String,
    installed: bool,
    version: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ModelEntry {
    id: Option<String>,
    name: Option<String>,
    object: Option<String>,
    created: Option<u64>,
    owned_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ModelsResponse {
    data: Option<Vec<ModelEntry>>,
    models: Option<Vec<ModelEntry>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ToolConfig {
    pub working_directory: Option<String>,
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
                Some("powershell.exe".to_string())
            } else {
                Some("bash".to_string())
            },
            current_directory: None,
            active_tool_id: None,
            env_status: None,
            tool_statuses: None,
            tool_configs: Some(std::collections::HashMap::new()),
        }
    }
}

fn get_config_path(_app: &AppHandle) -> PathBuf {
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

fn get_version(program: &str, args: &[&str]) -> Option<String> {
    #[cfg(target_os = "windows")]
    let program = if program == "npm" { "npm.cmd" } else { program };

    create_background_command(program)
        .args(args)
        .output()
        .ok()
        .and_then(|output| {
            if output.status.success() || !output.stderr.is_empty() {
                // Combine stdout and stderr because some tools (like java) output version to stderr
                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                let combined = format!("{}{}", stdout, stderr);

                // Return only the first non-empty line
                combined
                    .lines()
                    .map(|l| l.trim())
                    .find(|l| !l.is_empty())
                    .map(|s| s.to_string())
            } else {
                None
            }
        })
}

#[tauri::command]
fn check_executable(program: String, args: Vec<String>) -> Option<String> {
    get_version(
        &program,
        &args.iter().map(|s| s.as_str()).collect::<Vec<&str>>(),
    )
}

#[tauri::command]
fn check_environment() -> EnvironmentStatus {
    EnvironmentStatus {
        node_version: get_version("node", &["-v"]),
        npm_version: get_version("npm", &["-v"]),
        git_version: get_version("git", &["--version"]),
        python_version: get_version("python", &["--version"])
            .or_else(|| get_version("python3", &["--version"])),
        go_version: get_version("go", &["version"]),
        java_version: get_version("java", &["-version"]),
    }
}

#[tauri::command]
fn launch_tool(tool_id: String) -> Result<String, String> {
    launch_tool_with_args(tool_id, None)
}

#[tauri::command]
fn launch_tool_with_args(tool_id: String, args: Option<Vec<String>>) -> Result<String, String> {
    let program = match tool_id.as_str() {
        "claude" => "claude",
        "google" => "gemini",
        "opencode" => "opencode",
        "qoder" => "qodercli",
        "codebuddy" => "codebuddy",
        "copilot" => "copilot",
        "codex" => "codex",
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
        final_args.extend(full_args);
        Command::new("x-terminal-emulator")
            .args(&["-e"])
            .args(&final_args)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(format!("Launched {} with args {:?}", tool_id, full_args))
}

#[tauri::command]
fn install_tool(tool_id: String) -> Result<String, String> {
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
async fn update_tool(tool_id: String) -> Result<String, String> {
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
fn uninstall_tool(tool_id: String) -> Result<String, String> {
    let uninstall_cmd = match tool_id.as_str() {
        "claude" => "npm uninstall -g @anthropic-ai/claude-code",
        "google" => "npm uninstall -g @google/gemini-cli",
        "opencode" => "npm uninstall -g opencode-ai",
        "qoder" => "npm uninstall -g @qoder-ai/qodercli",
        "codebuddy" => "npm uninstall -g @tencent-ai/codebuddy-code",
        "copilot" => "npm uninstall -g @github/copilot",
        "codex" => "npm uninstall -g @openai/codex",
        _ => return Err("Uninstall not supported for this tool".to_string()),
    };

    let output = create_background_command("powershell")
        .args(&["/C", uninstall_cmd])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("Uninstallation successful".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn check_tool_status(tool_id: String) -> ToolStatus {
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

#[tauri::command]
fn get_app_config(app: AppHandle) -> AppConfig {
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
fn save_app_config(app: AppHandle, config: AppConfig) -> Result<(), String> {
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
fn pty_open(app: AppHandle, state: State<'_, AppPty>, cols: u16, rows: u16) -> Result<(), String> {
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
    let cmd_line = config.terminal_shell.unwrap_or_else(|| {
        if cfg!(target_os = "windows") {
            "powershell.exe".to_string()
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
                cmd_line
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

    // Store writer, master and child
    *state.writer.lock().unwrap() = Some(writer);
    *state.master.lock().unwrap() = Some(pair.master);
    *state.child.lock().unwrap() = Some(child);

    // Spawn thread to read from PTY
    thread::spawn(move || {
        let mut buf = [0u8; 1024];
        loop {
            match reader.read(&mut buf) {
                Ok(n) if n > 0 => {
                    let data = &buf[..n];
                    let _ = app.emit("pty-data", data.to_vec());
                }
                _ => break,
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn pty_close(state: State<'_, AppPty>) -> Result<(), String> {
    if let Some(mut child) = state.child.lock().unwrap().take() {
        let _ = child.kill();
    }
    *state.writer.lock().unwrap() = None;
    *state.master.lock().unwrap() = None;
    Ok(())
}

#[tauri::command]
fn pty_write(state: State<'_, AppPty>, data: String) -> Result<(), String> {
    if let Some(writer) = state.writer.lock().unwrap().as_mut() {
        write!(writer, "{}", data).map_err(|e| e.to_string())?;
        writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("PTY writer not initialized".to_string())
    }
}

#[tauri::command]
fn pty_resize(state: State<'_, AppPty>, cols: u16, rows: u16) -> Result<(), String> {
    if let Some(master) = state.master.lock().unwrap().as_mut() {
        master
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
fn pty_exists(state: State<'_, AppPty>) -> bool {
    state.child.lock().unwrap().is_some()
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    opener::open(url).map_err(|e| e.to_string())
}

#[tauri::command]
async fn download_file(app: AppHandle, url: String, filename: String) -> Result<String, String> {
    // 1. Determine download path: <AppDir>/download
    let mut download_path = std::env::current_exe().map_err(|e| e.to_string())?;
    download_path.pop(); // remove exe
    download_path.push("download");

    // Create dir if not exists
    if !download_path.exists() {
        fs::create_dir_all(&download_path).map_err(|e| e.to_string())?;
    }

    let target_path = download_path.join(&filename);
    let target_path_str = target_path.to_string_lossy().to_string();

    println!("Starting download: {} -> {}", url, target_path_str);

    // 2. Start Request
    let client = get_proxy_client(&app)?;
    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to connect: {}", e))?;

    let total_size = res.content_length().unwrap_or(0);

    // 3. Stream content
    let mut file =
        std::fs::File::create(&target_path).map_err(|e| format!("Failed to create file: {}", e))?;
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| format!("Error while downloading chunk: {}", e))?;
        file.write_all(&chunk)
            .map_err(|e| format!("Error while writing to file: {}", e))?;

        let new = min(downloaded + (chunk.len() as u64), total_size);
        downloaded = new;

        // Emit progress
        if total_size > 0 {
            let percent = (downloaded as f64 / total_size as f64) * 100.0;
            // Emit event: "download-progress" { filename: "foo.zip", percent: 50.5, current: 1024, total: 2048 }
            let _ = app.emit(
                "download-progress",
                serde_json::json!({
                    "filename": filename,
                    "percent": percent,
                    "current": downloaded,
                    "total": total_size
                }),
            );
        }
    }

    println!("Download complete: {}", target_path_str);
    Ok(target_path_str)
}

#[tauri::command]
fn extract_file(path: String) -> Result<String, String> {
    let archive_path = PathBuf::from(&path);
    if !archive_path.exists() {
        return Err("File not found".to_string());
    }

    let mut target_dir = archive_path.clone();
    target_dir.pop(); // download dir

    // Create a subfolder with same name as file stem
    let stem = archive_path
        .file_stem()
        .ok_or("Invalid filename")?
        .to_string_lossy();
    target_dir.push(&*stem);

    if !target_dir.exists() {
        fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
    }

    let file =
        fs::File::open(&archive_path).map_err(|e| format!("Failed to open archive: {}", e))?;

    if path.ends_with(".zip") {
        zip_extract::extract(file, &target_dir, true)
            .map_err(|e| format!("ZIP extraction failed: {}", e))?;
    } else if path.ends_with(".tar.gz") || path.ends_with(".tgz") {
        let tar_gz = flate2::read::GzDecoder::new(file);
        let mut archive = tar::Archive::new(tar_gz);
        archive
            .unpack(&target_dir)
            .map_err(|e| format!("TAR extraction failed: {}", e))?;
    } else {
        return Err("Unsupported archive format. Only .zip and .tar.gz supported.".to_string());
    }

    Ok(target_dir.to_string_lossy().to_string())
}

#[tauri::command]
async fn fetch_remote_models(
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

fn get_proxy_client(app: &AppHandle) -> Result<reqwest::Client, String> {
    let config = get_app_config(app.clone());
    let mut builder = reqwest::Client::builder();

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
            // Check if address already contains scheme
            let proxy_url = if address.contains("://") {
                address.to_string()
            } else {
                format!("{}{}", proxy_scheme, address)
            };

            println!("Configuring Proxy: {}", proxy_url);
            match reqwest::Proxy::all(&proxy_url) {
                Ok(proxy) => {
                    builder = builder.proxy(proxy);
                }
                Err(e) => {
                    println!("Failed to create proxy: {}", e);
                    // Decide if we should return error or fallback.
                    // To be safe and let user know configuration is wrong, returning error is better.
                    return Err(format!("Invalid proxy configuration: {}", e));
                }
            }
        }
    }

    builder
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))
}

#[tauri::command]
fn get_system_fonts() -> Vec<String> {
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
        // TODO: Implement for macOS/Linux using fc-list
        Vec::new()
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct McpInfo {
    path: String,
    name: String,
}

#[tauri::command]
fn list_installed_skills(target: String) -> Vec<McpInfo> {
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
fn install_skills(
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
fn get_config_file(path: String) -> Result<String, String> {
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
fn save_config_file(path: String, content: String) -> Result<(), String> {
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
fn uninstall_skills(path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    if path_buf.exists() {
        fs::remove_dir_all(path_buf).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Path does not exist".to_string())
    }
}

#[tauri::command]
fn get_models(provider: String) -> Result<Vec<String>, String> {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            check_environment,
            check_tool_status,
            launch_tool,
            launch_tool_with_args,
            install_tool,
            uninstall_tool,
            update_tool,
            check_executable,
            get_app_config,
            save_app_config,
            open_url,
            pty_open,
            pty_write,
            pty_resize,
            pty_close,
            pty_exists,
            download_file,
            extract_file,
            fetch_remote_models,
            get_system_fonts,
            list_installed_skills,
            install_skills,
            uninstall_skills,
            get_config_file,
            save_config_file,
            get_models
        ])
        .manage(AppPty::default())
        .setup(|app| {
            app.handle().plugin(tauri_plugin_dialog::init())?;
            app.handle().plugin(tauri_plugin_fs::init())?;
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
