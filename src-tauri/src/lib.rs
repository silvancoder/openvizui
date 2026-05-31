
pub mod commands;
use commands::pty::*;
use commands::config::*;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            // Ensure config exists on startup
            let _ = get_app_config(app_handle.clone());
            
            Ok(())
        })
        .manage(AppPty::default())
        .invoke_handler(tauri::generate_handler![
            commands::pty::pty_open,
            commands::pty::pty_close,
            commands::pty::pty_write,
            commands::pty::pty_resize,
            commands::pty::pty_exists,
            commands::env::check_executable,
            commands::env::check_environment,
            commands::env::launch_tool,
            commands::env::launch_tool_with_args,
            commands::env::install_tool,
            commands::env::update_tool,
            commands::env::uninstall_tool,
            commands::env::check_tool_status,
            commands::config::get_app_config,
            commands::config::save_app_config,
            commands::fs::open_url,
            commands::fs::download_file,
            commands::fs::extract_file,
            commands::chat::fetch_remote_models,
            commands::fs::search_files,
            commands::fs::get_git_diff,
            commands::fs::get_changed_files,
            commands::config::get_system_fonts,
            commands::skills::list_installed_skills,
            commands::skills::install_skills,
            commands::config::get_config_file,
            commands::config::save_config_file,
            commands::skills::uninstall_skills,
            commands::fs::open_folder,
            commands::skills::inspect_mcp_server,
            commands::chat::get_models,
            commands::chat::get_chat_sessions,
            commands::chat::save_chat_sessions
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
                use tauri::Manager;
                let state = app_handle.state::<AppPty>();
                let mut sessions = state.sessions.lock().unwrap();
                sessions.clear();
            }
            _ => {}
        });
}
