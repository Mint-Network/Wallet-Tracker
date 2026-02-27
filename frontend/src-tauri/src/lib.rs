use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::{process::CommandChild, ShellExt};
use std::net::TcpStream;

const BACKEND_PORT: u16 = 55001;

// Struct to hold the backend child process
struct BackendProcess(Mutex<Option<CommandChild>>);

impl BackendProcess {
    fn set(&self, child: CommandChild) {
        let mut lock = self.0.lock().unwrap();
        *lock = Some(child);
    }

    fn kill(&self) {
        let child = self.0.lock().unwrap().take();
        if let Some(child) = child {
            eprintln!("🛑 Killing backend process...");
            let _ = child.kill();
        }
    }
}

// Implement Drop to ensure backend is killed when app is destroyed
impl Drop for BackendProcess {
    fn drop(&mut self) {
        let child = self.0.lock().unwrap().take();
        if let Some(child) = child {
            eprintln!("🛑 BackendProcess dropped, killing backend...");
            let _ = child.kill();
        }
    }
}

/// Tauri command: returns backend API base URL for frontend.
#[tauri::command]
fn get_backend_url() -> String {
    format!("http://127.0.0.1:{}", BACKEND_PORT)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_backend_url])
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            let port = 55001u16;

            // Helper function to check if backend is listening on port
            let check_backend_health = |port: u16| -> bool {
                for attempt in 1..=10 {
                    match TcpStream::connect(format!("127.0.0.1:{}", port)) {
                        Ok(_) => {
                            eprintln!("✅ Backend is listening on port {} (attempt {})", port, attempt);
                            return true;
                        }
                        Err(_) => {
                            if attempt < 10 {
                                std::thread::sleep(std::time::Duration::from_millis(500));
                            }
                        }
                    }
                }
                eprintln!("❌ Backend is not listening on port {} after 10 attempts", port);
                false
            };

            // Helper to load .env file and return env vars
            let load_env_vars = || -> std::collections::HashMap<String, String> {
                let mut env_vars = std::collections::HashMap::new();
                env_vars.insert("PORT".to_string(), port.to_string());

                // Try to find .env file in multiple locations (in priority order)
                let mut env_paths = Vec::new();

                // 1. Executable's directory (most reliable for packaged apps)
                if let Ok(exe_path) = std::env::current_exe() {
                    if let Some(exe_dir) = exe_path.parent() {
                        env_paths.push(exe_dir.join(".env"));
                        // Also check parent directory (in case exe is in a subdirectory)
                        if let Some(parent) = exe_dir.parent() {
                            env_paths.push(parent.join(".env"));
                        }
                    }
                }

                // 2. Resource directory (where Tauri bundles resources)
                if let Ok(resource_dir) = app.path().resource_dir() {
                    env_paths.push(resource_dir.join(".env"));
                }

                // 3. App data directory
                if let Ok(app_data_dir) = app.path().app_data_dir() {
                    env_paths.push(app_data_dir.join(".env"));
                }

                // 4. Current working directory
                if let Ok(cwd) = std::env::current_dir() {
                    env_paths.push(cwd.join(".env"));
                }

                eprintln!("🔍 Checking for .env file in {} locations...", env_paths.len());

                let mut loaded_from: Option<PathBuf> = None;
                for env_path in &env_paths {
                    if let Ok(content) = std::fs::read_to_string(env_path) {
                        eprintln!("✅ Found .env file at: {:?}", env_path);
                        loaded_from = Some(env_path.clone());

                        let mut loaded_count = 0;
                        for line in content.lines() {
                            let line = line.trim();
                            if line.is_empty() || line.starts_with('#') {
                                continue;
                            }
                            if let Some((key, value)) = line.split_once('=') {
                                let key = key.trim().to_string();
                                let value = value.trim().to_string();
                                env_vars.insert(key.clone(), value.clone());
                                loaded_count += 1;
                                // Log important vars (masked)
                                if key == "ETH_RPC_URL" || key == "CODEX_RPC_URL" {
                                    eprintln!("  📝 Loaded {} = {}***", key, &value[..value.len().min(20)]);
                                }
                            }
                        }
                        eprintln!("  ✅ Loaded {} environment variables from .env", loaded_count);
                        break;
                    }
                }

                if loaded_from.is_none() {
                    eprintln!("⚠️  No .env file found in any checked location:");
                    for path in &env_paths {
                        eprintln!("    - {:?}", path);
                    }
                    eprintln!("  Backend will use default values or environment variables already set.");
                }

                // Log summary of what we're passing to backend
                eprintln!("📋 Environment variables to pass to backend:");
                eprintln!("  PORT = {}", env_vars.get("PORT").unwrap_or(&"not set".to_string()));
                eprintln!("  ETH_RPC_URL = {}",
                    if env_vars.contains_key("ETH_RPC_URL") { "***set***" } else { "NOT SET" });
                eprintln!("  CODEX_RPC_URL = {}",
                    if env_vars.contains_key("CODEX_RPC_URL") { "***set***" } else { "NOT SET" });
                eprintln!("  NODE_ENV = {}", env_vars.get("NODE_ENV").unwrap_or(&"not set".to_string()));

                env_vars
            };

            // 1) Try official sidecar (name: wallet-backend)
            if let Ok(cmd) = app.shell().sidecar("wallet-backend") {
                let env_vars = load_env_vars();
                let mut sidecar_cmd = cmd;

                // Set all environment variables from .env
                for (key, value) in &env_vars {
                    sidecar_cmd = sidecar_cmd.env(key, value);
                }

                match sidecar_cmd.spawn() {
                    Ok((_rx, child)) => {
                        eprintln!("Backend sidecar spawned, waiting for health check...");

                        // Store child in app state for cleanup
                        let state = app.state::<BackendProcess>();
                        state.set(child);

                        // Wait a bit for backend to start
                        std::thread::sleep(std::time::Duration::from_millis(2000));

                        // Verify backend is actually listening
                        if check_backend_health(port) {
                            eprintln!("✅ Backend started successfully via sidecar");
                            return Ok(());
                        } else {
                            eprintln!("⚠️ Backend sidecar spawned but not responding on port {}", port);
                            // Continue to fallback methods
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to spawn sidecar backend: {}", e);
                    }
                }
            }

            eprintln!("❌ Warning: Could not start backend automatically.");
            eprintln!("The app may not function correctly. Backend should be listening on port {}", port);
            Ok(())
        })
        .on_window_event(|window, event| {
            // Kill backend when window is closed
            if matches!(event, tauri::WindowEvent::CloseRequested { .. }) {
                let state = window.app_handle().state::<BackendProcess>();
                state.kill();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Wallet Tracker application");
}
