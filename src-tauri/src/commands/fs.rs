
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
use crate::commands::chat::*;
use crate::commands::skills::*;
use crate::commands::utils::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResult {
    file: String,
    line: Option<u32>,
    content: Option<String>,
}

#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    opener::open(url).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn download_file(app: AppHandle, url: String, filename: String) -> Result<String, String> {
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
pub fn extract_file(path: String) -> Result<String, String> {
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
pub fn search_files(query: String, path: String, content_search: bool) -> Result<Vec<SearchResult>, String> {
    let mut results = Vec::new();
    let search_path = std::path::Path::new(&path);

    if !search_path.exists() {
        return Err("Path does not exist".to_string());
    }

    // MVP: Recursive search implementation using walkdir would be better, but we'll use a simple recursive function due to dependency constraints for now
    // or rely on 'git grep' if available, but pure Rust is safer for portability if git isn't there.
    // For this environment, we'll try to use `git grep` if content_search is true, or `find` logic if false.
    // Actually, let's use a simple recursive walker using std::fs for filenames, and standard file reading for content.
    
    // Helper function for recursive search
    fn visit_dirs(dir: &std::path::Path, query: &str, content: bool, results: &mut Vec<SearchResult>) -> std::io::Result<()> {
        if dir.is_dir() {
            for entry in fs::read_dir(dir)? {
                let entry = entry?;
                let path = entry.path();
                
                // Skip .git, node_modules, target, dist, build, .vscode, .idea
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with(".") || name == "node_modules" || name == "target" || name == "dist" || name == "build" {
                        continue;
                    }
                }

                if path.is_dir() {
                    visit_dirs(&path, query, content, results)?;
                } else {
                    let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                    let path_str = path.to_string_lossy().to_string();

                    if !content {
                        // Filename search
                        if file_name.to_lowercase().contains(&query.to_lowercase()) {
                            results.push(SearchResult {
                                file: path_str,
                                line: None,
                                content: None
                            });
                        }
                    } else {
                        // Content search
                        // Only search text files - simplified check
                        if let Ok(content_str) = fs::read_to_string(&path) {
                           for (i, line) in content_str.lines().enumerate() {
                               if line.to_lowercase().contains(&query.to_lowercase()) {
                                   results.push(SearchResult {
                                       file: path_str.clone(),
                                       line: Some((i + 1) as u32),
                                       content: Some(line.trim().to_string())
                                   });
                                   // Limit to 10 matches per file to avoid bloat
                                   if results.iter().filter(|r| r.file == path_str).count() > 10 {
                                       break;
                                   }
                               }
                           }
                        }
                    }
                }
            }
        }
        Ok(())
    }

    visit_dirs(search_path, &query, content_search, &mut results).map_err(|e| e.to_string())?;
    
    // Cap results at 100
    if results.len() > 100 {
        results.truncate(100);
    }

    Ok(results)
}

pub fn visit_dirs(dir: &std::path::Path, query: &str, content: bool, results: &mut Vec<SearchResult>) -> std::io::Result<()> {
        if dir.is_dir() {
            for entry in fs::read_dir(dir)? {
                let entry = entry?;
                let path = entry.path();
                
                // Skip .git, node_modules, target, dist, build, .vscode, .idea
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with(".") || name == "node_modules" || name == "target" || name == "dist" || name == "build" {
                        continue;
                    }
                }

                if path.is_dir() {
                    visit_dirs(&path, query, content, results)?;
                } else {
                    let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                    let path_str = path.to_string_lossy().to_string();

                    if !content {
                        // Filename search
                        if file_name.to_lowercase().contains(&query.to_lowercase()) {
                            results.push(SearchResult {
                                file: path_str,
                                line: None,
                                content: None
                            });
                        }
                    } else {
                        // Content search
                        // Only search text files - simplified check
                        if let Ok(content_str) = fs::read_to_string(&path) {
                           for (i, line) in content_str.lines().enumerate() {
                               if line.to_lowercase().contains(&query.to_lowercase()) {
                                   results.push(SearchResult {
                                       file: path_str.clone(),
                                       line: Some((i + 1) as u32),
                                       content: Some(line.trim().to_string())
                                   });
                                   // Limit to 10 matches per file to avoid bloat
                                   if results.iter().filter(|r| r.file == path_str).count() > 10 {
                                       break;
                                   }
                               }
                           }
                        }
                    }
                }
            }
        }
        Ok(())
    }

#[tauri::command]
pub fn get_git_diff(file_path: String) -> Result<String, String> {
    let output = Command::new("git")
        .args(&["diff", &file_path])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        // Try cached diff if staged
        let output_cached = Command::new("git")
            .args(&["diff", "--cached", &file_path])
            .output()
            .map_err(|e| e.to_string())?;
            
        if output_cached.status.success() {
             Ok(String::from_utf8_lossy(&output_cached.stdout).to_string())
        } else {
             Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
}

#[tauri::command]
pub fn get_changed_files() -> Result<Vec<String>, String> {
    let output = Command::new("git")
        .args(&["status", "--porcelain"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let files: Vec<String> = stdout
            .lines()
            .map(|line| {
                // Porcelain format: " M src/lib.rs" or "?? src/new.rs"
                // Valid codes are 2 chars, then space, then path
                if line.len() > 3 {
                    line[3..].to_string()
                } else {
                    line.to_string()
                }
            })
            .collect();
        Ok(files)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub fn open_folder(path: String) -> Result<(), String> {
    opener::open(&path).map_err(|e| e.to_string())
}

