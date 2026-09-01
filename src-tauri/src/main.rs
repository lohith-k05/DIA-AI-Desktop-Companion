// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn get_system_status() -> String {
    "Dia Sovereign Desktop Engine v2.0 - Tauri Runtime Active".to_string()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_system_status])
        .run(tauri::generate_context!())
        .expect("error while running Dia desktop application");
}
