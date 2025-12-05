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

  registerExtendSessionCallback(callback: () => void) {
    this.extendSessionCallback = callback;
  }

  extendSession() {
    if (this.extendSessionCallback) {
      this.extendSessionCallback();
    }
  }

  clearCallback() {
    this.extendSessionCallback = null;
  }
}

export const sessionManager = SessionManager.getInstance();
