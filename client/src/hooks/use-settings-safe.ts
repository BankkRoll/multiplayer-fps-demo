import { GraphicsQuality, useSettings } from "../context/SettingsContext";

// Default settings to use when settings context is not available
export const DEFAULT_SETTINGS = {
  controls: {
    forward: { keyboard: ["ArrowUp", "w", "W"], gamepad: 1 },
    backward: { keyboard: ["ArrowDown", "s", "S"], gamepad: 1 },
    left: { keyboard: ["ArrowLeft", "a", "A"], gamepad: 0 },
    right: { keyboard: ["ArrowRight", "d", "D"], gamepad: 0 },
    jump: { keyboard: ["Space"], gamepad: 0 },
    sprint: { keyboard: ["Shift"], gamepad: 10 },
    primaryAction: { keyboard: ["click"], gamepad: 7 },
    reload: { keyboard: ["r", "R"], gamepad: 2 },
  },
  graphics: {
    quality: GraphicsQuality.MEDIUM,
    fov: 90,
    shadowQuality: "medium" as "low" | "medium" | "high",
    postProcessing: true,
    enableVignette: true,
    enableChromaticAberration: true,
    enableBrightnessContrast: true,
    enableToneMapping: true,
  },
  hud: {
    showCrosshair: true,
    showAmmo: true,
    showControls: true,
    showConnectionStatus: true,
    crosshairStyle: "default" as "default" | "dot" | "cross" | "circle",
    crosshairColor: "rgba(255, 255, 255, 0.75)",
  },
  player: {
    mouseSensitivity: 1.0,
    gamepadSensitivityX: 0.04,
    gamepadSensitivityY: 0.03,
    invertY: false,
    invertX: false,
  },
  audio: {
    masterVolume: 1.0,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    ambientVolume: 0.7,
  },
  showSettings: false,
  activeSettingsTab: "controls" as "controls" | "graphics" | "audio" | "hud",
};

// Create a constant empty functions object for consistent return
const EMPTY_FUNCTIONS = {
  updateControls: () => {},
  updateGraphics: () => {},
  updateHUD: () => {},
  updatePlayer: () => {},
  updateAudio: () => {},
  resetControls: () => {},
  resetGraphics: () => {},
  resetHUD: () => {},
  resetPlayer: () => {},
  resetAudio: () => {},
  toggleSettings: () => {},
  setActiveSettingsTab: () => {},
};

/**
 * A hook that safely accesses settings, providing defaults when settings are undefined
 */
export function useSettingsSafe() {
  const settingsContext = useSettings();

  // Create a merged settings object to ensure all properties exist even if some are missing
  const mergedSettings = {
    ...DEFAULT_SETTINGS,
    ...settingsContext?.settings,
    controls: {
      ...DEFAULT_SETTINGS.controls,
      ...settingsContext?.settings?.controls,
    },
    graphics: {
      ...DEFAULT_SETTINGS.graphics,
      ...settingsContext?.settings?.graphics,
    },
    hud: { ...DEFAULT_SETTINGS.hud, ...settingsContext?.settings?.hud },
    player: {
      ...DEFAULT_SETTINGS.player,
      ...settingsContext?.settings?.player,
    },
    audio: { ...DEFAULT_SETTINGS.audio, ...settingsContext?.settings?.audio },
  };

  // Return the context if it's available, otherwise return defaults
  if (!settingsContext || !settingsContext.settings) {
    return {
      settings: DEFAULT_SETTINGS,
      ...EMPTY_FUNCTIONS,
    };
  }

  return {
    ...settingsContext,
    settings: mergedSettings,
  };
}
