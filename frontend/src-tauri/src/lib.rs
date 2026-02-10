use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // For now we use a fixed port; backend reads PORT from env.
            // You can change this to a random free port and expose it to the frontend if needed.
            let port = 5001;

            // Launch the backend as a sidecar process.
            // This expects binaries named like:
            // - wallet-backend-x86_64-pc-windows-msvc.exe
            // - wallet-backend-x86_64-apple-darwin
            // - wallet-backend-aarch64-apple-darwin
            // placed under src-tauri/bin/.
            let _child = app
                .shell()
                .sidecar("wallet-backend")?
                .env("PORT", port.to_string())
                .spawn()?;

            // Optionally store `_child` in state if you need to manage it explicitly.
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Wallet Tracker application");
}
