/**
 * Type declaration for @tauri-apps/api/core subpath.
 * Ensures TypeScript resolves the module when package exports are not picked up.
 */
declare module "@tauri-apps/api/core" {
  export function invoke<T = unknown>(
    cmd: string,
    args?: Record<string, unknown>
  ): Promise<T>;
}
