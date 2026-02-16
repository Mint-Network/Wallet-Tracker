use std::path::{Path, PathBuf};
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
            let name = "wallet-backend.bat";

            #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
            let name = "wallet-backend";

            name
        }
    };
}

/// Spawn the backend process. On Windows, .bat must be run via `cmd /c`.
fn spawn_backend(backend_path: &Path, work_dir: &Path) {
    #[cfg(windows)]
    let _ = Command::new("cmd")
        .args(["/c", backend_path.as_path()])
        .current_dir(work_dir)
        .env("PORT", BACKEND_PORT.to_string())
        .spawn();

    #[cfg(not(windows))]
    let _ = Command::new(backend_path)
        .current_dir(work_dir)
        .env("PORT", BACKEND_PORT.to_string())
        .spawn();
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
                    spawn_backend(&backend_path, &resource_dir);
                    wait_for_backend_ready();
                    return Ok(());
                }
            }

            // Try exe directory
            if let Ok(exe_dir) = std::env::current_exe() {
                if let Some(parent) = exe_dir.parent() {
                    let alt_path = parent.join(backend_name);
                    if alt_path.is_file() {
                        spawn_backend(&alt_path, parent);
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
