use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // For now we use a fixed port; backend reads PORT from env.
            let port = 5001;

            // Launch the backend as a sidecar process.
            // Expects binaries in src-tauri/bin/, e.g. wallet-backend-x86_64-pc-windows-msvc.exe
            match app.shell().sidecar("wallet-backend") {
                Ok(cmd) => {
                    cmd.env("PORT", port.to_string())
                        .spawn()
                        .map_err(|e| e.to_string())?;
                }
                Err(e) => {
                    eprintln!("Wallet Tracker: backend sidecar not found or failed to start: {}", e);
                    eprintln!("Build the backend first: cd backend && npm run build:backend:win");
                    return Err(e.into());
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Wallet Tracker application");
}
