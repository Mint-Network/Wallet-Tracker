use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let port = 5001u16;

            // 1) Try official sidecar (name: wallet-backend-<target-triple>.exe)
            if let Ok(cmd) = app.shell().sidecar("wallet-backend") {
                if cmd.env("PORT", port.to_string()).spawn().is_ok() {
                    return Ok(());
                }
            }

            // 2) Fallback: run wallet-backend.exe from same folder (works when zipped together)
            if let Ok(resource_dir) = app.path().resource_dir() {
                #[cfg(windows)]
                let backend_name = "wallet-backend.exe";
                #[cfg(not(windows))]
                let backend_name = "wallet-backend";
                let backend_path: PathBuf = resource_dir.join(backend_name);
                if backend_path.is_file() {
                    let _ = Command::new(&backend_path)
                        .env("PORT", port.to_string())
                        .current_dir(&resource_dir)
                        .spawn();
                    return Ok(());
                }
            }

            eprintln!("Wallet Tracker: backend not found. Place wallet-backend.exe next to wallet-tracker.exe.");
            Err(tauri::Error::Setup(Box::new(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "Backend not found. Place wallet-backend.exe in the same folder as wallet-tracker.exe.",
            ))))
        })
        .run(tauri::generate_context!())
        .expect("error while running Wallet Tracker application");
}
