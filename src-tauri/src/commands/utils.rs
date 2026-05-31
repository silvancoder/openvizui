
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
use crate::commands::skills::*;

pub fn get_version(program: &str, args: &[&str]) -> Option<String> {
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

pub fn get_proxy_client(app: &AppHandle) -> Result<reqwest::Client, String> {
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

