use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

macro_rules! get_backend_name {
    () => {
        {
            #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
            let name = "wallet-backend-aarch64-apple-darwin";

            #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
            let name = "wallet-backend-x86_64-apple-darwin";

            #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
            let name = "wallet-backend-x86_64-pc-windows-msvc.exe";

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
        .setup(|app| {
            let port = 55001u16;
            let backend_name = get_backend_name!();

            // Try platform-specific backend files in resource directory
            if let Ok(resource_dir) = app.path().resource_dir() {
                let backend_path: PathBuf = resource_dir.join(backend_name);

                if backend_path.is_file() {
                    let _ = Command::new(&backend_path)
                        .env("PORT", port.to_string())
                        .current_dir(&resource_dir)
                        .spawn();
                    return Ok(());
                }
            }

            // Try exe directory
            if let Ok(exe_dir) = std::env::current_exe() {
                if let Some(parent) = exe_dir.parent() {
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
