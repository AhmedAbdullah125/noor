import { http } from "./http";

/**
 * Best-effort server-side token revocation. Never throws: local state must be
 * cleared by the caller regardless of the network result, so a failed request
 * does not strand the user in a logged-in UI.
 */
export async function logoutRequest(): Promise<void> {
    try {
        await http.post("/logout", null);
    } catch {
        // Ignore — logout proceeds locally even if the server call fails.
    }
}
