// Session manager utility for extending sessions on API calls
class SessionManager {
  private static instance: SessionManager;
  private extendSessionCallback: (() => void) | null = null;

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Register the extend session callback from the session timeout hook
  registerExtendSessionCallback(callback: () => void) {
    this.extendSessionCallback = callback;
  }

  // Extend session (called by API client on successful requests)
  extendSession() {
    if (this.extendSessionCallback) {
      this.extendSessionCallback();
    }
  }

  // Clear the callback when component unmounts
  clearCallback() {
    this.extendSessionCallback = null;
  }
}

export const sessionManager = SessionManager.getInstance();
