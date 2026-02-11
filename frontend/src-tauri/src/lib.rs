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

            // 3) Try exe directory
            if let Ok(exe_dir) = std::env::current_exe() {
                if let Some(parent) = exe_dir.parent() {
                    #[cfg(windows)]
                    let backend_name = "wallet-backend.exe";
                    #[cfg(not(windows))]
                    let backend_name = "wallet-backend";
                    let alt_path = parent.join(backend_name);
                    if alt_path.is_file() {
                        let _ = Command::new(&alt_path)
                            .env("PORT", port.to_string())
                            .current_dir(parent)
                            .spawn();
                        return Ok(());
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Wallet Tracker application");
}
