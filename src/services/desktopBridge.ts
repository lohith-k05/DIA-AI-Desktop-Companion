/**
 * Dia Desktop Bridge Service
 * Connects frontend window controls and native OS features with Tauri 2.0 runtime
 */

export interface DesktopRuntimeInfo {
  isNative: boolean;
  platform: string;
  version: string;
  status: string;
}

/**
 * Returns true if running inside a native Tauri desktop webview
 */
export const isTauri = (): boolean => {
  return (
    typeof window !== "undefined" &&
    Boolean(
      (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ ||
      (window as unknown as Record<string, unknown>).__TAURI__ ||
      (window as unknown as Record<string, unknown>).__TAURI_METADATA__
    )
  );
};

/**
 * Minimize the application window
 */
export const minimizeWindow = async (): Promise<void> => {
  if (isTauri()) {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().minimize();
    } catch (err) {
      console.warn("[DesktopBridge] Failed to minimize window:", err);
    }
  } else {
    console.info("[DesktopBridge] Browser preview: Window minimize requested.");
  }
};

/**
 * Toggle maximize / restore for the application window
 */
export const toggleMaximizeWindow = async (): Promise<void> => {
  if (isTauri()) {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().toggleMaximize();
    } catch (err) {
      console.warn("[DesktopBridge] Failed to toggle maximize window:", err);
    }
  } else {
    console.info("[DesktopBridge] Browser preview: Window maximize toggle requested.");
  }
};

/**
 * Close the application window
 */
export const closeWindow = async (): Promise<void> => {
  if (isTauri()) {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    } catch (err) {
      console.warn("[DesktopBridge] Failed to close window:", err);
    }
  } else {
    console.info("[DesktopBridge] Browser preview: Window close requested.");
  }
};

/**
 * Query native desktop shell information
 */
export const getDesktopRuntimeInfo = async (): Promise<DesktopRuntimeInfo> => {
  if (isTauri()) {
    return {
      isNative: true,
      platform: "Windows x64 (Tauri 2.0 Native)",
      version: "2.0.0",
      status: "Native Frameless Hardware-Accelerated Shell Active",
    };
  }
  return {
    isNative: false,
    platform: "Web Browser (Localhost)",
    version: "2.0.0 (Web Preview)",
    status: "Browser Preview Mode — Window management simulated",
  };
};


/**
 * Open the Floating DIA Companion Window
 */
export const openFloatingCompanion = async (alwaysOnTop: boolean = true): Promise<void> => {
  if (isTauri()) {
    try {
      const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
      const { getAllWindows } = await import("@tauri-apps/api/window");

      // Check if the window already exists
      const windows = await getAllWindows();
      const existing = windows.find((w) => w.label === "floating-companion");

      if (existing) {
        // Unminimize if it's minimized, then focus it
        await existing.unminimize();
        await existing.setFocus();
        return;
      }

      const floatingWindow = new WebviewWindow("floating-companion", {
        url: "/?mode=floating",
        title: "Dia Companion",
        width: 320,
        height: 480,
        decorations: false,
        alwaysOnTop: alwaysOnTop,
        transparent: true,
        resizable: true,
        center: false,
        x: 100,
        y: 100
      });
      floatingWindow.once('tauri://error', function (e) {
        console.warn("Floating window error:", e);
      });
    } catch (err) {
      console.warn("[DesktopBridge] Failed to open floating window:", err);
    }
  } else {
    console.info("[DesktopBridge] Browser preview: Opening floating companion in a popup window.");
    window.open(
      "/?mode=floating",
      "DiaCompanion",
      "popup=yes,toolbar=no,location=no,menubar=no,status=no,width=320,height=480,resizable=yes"
    );
  }
};
