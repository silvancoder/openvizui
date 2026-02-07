/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src-tauri\src\main.rs
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  app_lib::run();
}
