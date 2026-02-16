use std::path::PathBuf;
use std::process::Command;
use std::time::Duration;
use std::net::TcpStream;
use tauri::Manager;

/// Port the backend API listens on. Must match backend's PORT env and frontend usage.
const BACKEND_PORT: u16 = 55001;

/// Returns the backend API base URL (no trailing slash).
#[tauri::command]
fn get_backend_url() -> String {
    format!("http://127.0.0.1:{}", BACKEND_PORT)
}

/// Wait for the backend to accept TCP connections (up to ~15 seconds).
fn wait_for_backend_ready() {
    let deadline = std::time::Instant::now() + Duration::from_secs(15);
    while std::time::Instant::now() < deadline {
        if TcpStream::connect_timeout(
            &std::net::SocketAddr::from(([127, 0, 0, 1], BACKEND_PORT)),
            Duration::from_millis(500),
        )
        .is_ok()
        {
            return;
        }
        std::thread::sleep(Duration::from_millis(300));
    }
}

macro_rules! get_backend_name {
    () => {
        {
            #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
            let name = "wallet-backend";

            #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
            let name = "wallet-backend";

            #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
            let name = "wallet-backend.exe";

            #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
            let name = "wallet-backend";

            name
        }
    };
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_backend_url])
        .setup(|app| {
            let backend_name = get_backend_name!();

            // Try platform-specific backend files in resource directory
            if let Ok(resource_dir) = app.path().resource_dir() {
                let backend_path: PathBuf = resource_dir.join(backend_name);

                if backend_path.is_file() {
                    let _ = Command::new(&backend_path)
                        .env("PORT", BACKEND_PORT.to_string())
                        .current_dir(&resource_dir)
                        .spawn();
                    wait_for_backend_ready();
                    return Ok(());
                }
            }

            // Try exe directory
            if let Ok(exe_dir) = std::env::current_exe() {
                if let Some(parent) = exe_dir.parent() {
                    let alt_path = parent.join(backend_name);
                    if alt_path.is_file() {
                        let _ = Command::new(&alt_path)
                            .env("PORT", BACKEND_PORT.to_string())
                            .current_dir(parent)
                            .spawn();
                        wait_for_backend_ready();
                        return Ok(());
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Wallet Tracker application");
}
