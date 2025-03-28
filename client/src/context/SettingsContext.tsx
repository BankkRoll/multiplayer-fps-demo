import React, { createContext, useContext, useEffect, useState } from "react";

// Graphics quality presets
export enum GraphicsQuality {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  ULTRA = "ultra",
}

// Control binding types
export type ControlBinding = {
  keyboard: string[];
  gamepad?: number; // Button index or special value for axes
};

export type ControlBindings = {
  [key: string]: ControlBinding;
};

// Default control bindings
const DEFAULT_CONTROL_BINDINGS: ControlBindings = {
  forward: { keyboard: ["ArrowUp", "w", "W"], gamepad: 1 }, // Left stick up
  backward: { keyboard: ["ArrowDown", "s", "S"], gamepad: 1 }, // Left stick down
  left: { keyboard: ["ArrowLeft", "a", "A"], gamepad: 0 }, // Left stick left
  right: { keyboard: ["ArrowRight", "d", "D"], gamepad: 0 }, // Left stick right
  jump: { keyboard: ["Space"], gamepad: 0 }, // A button
  sprint: { keyboard: ["Shift"], gamepad: 10 }, // Left stick press
  primaryAction: { keyboard: ["click"], gamepad: 7 }, // Right trigger
  reload: { keyboard: ["r", "R"], gamepad: 2 }, // B button
};

// Graphics settings structure
export type GraphicsSettings = {
  quality: GraphicsQuality;
  fov: number;
  shadowQuality: "low" | "medium" | "high";
  postProcessing: boolean;
  enableVignette: boolean;
  enableChromaticAberration: boolean;
  enableBrightnessContrast: boolean;
  enableToneMapping: boolean;
};

// Default graphics settings
const DEFAULT_GRAPHICS_SETTINGS: GraphicsSettings = {
  quality: GraphicsQuality.MEDIUM,
  fov: 90,
  shadowQuality: "medium",
  postProcessing: true,
  enableVignette: true,
  enableChromaticAberration: true,
  enableBrightnessContrast: true,
  enableToneMapping: true,
};

// HUD settings structure
export type HUDSettings = {
  showCrosshair: boolean;
  showAmmo: boolean;
  showControls: boolean;
  showConnectionStatus: boolean;
  crosshairStyle: "default" | "dot" | "cross" | "circle";
  crosshairColor: string;
};

// Default HUD settings
const DEFAULT_HUD_SETTINGS: HUDSettings = {
  showCrosshair: true,
  showAmmo: true,
  showControls: true,
  showConnectionStatus: true,
  crosshairStyle: "default",
  crosshairColor: "rgba(255, 255, 255, 0.75)",
};

// Player settings
export type PlayerSettings = {
  mouseSensitivity: number;
  gamepadSensitivityX: number;
  gamepadSensitivityY: number;
  invertY: boolean;
  invertX: boolean;
};

// Default player settings
const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  mouseSensitivity: 1.0,
  gamepadSensitivityX: 0.04,
  gamepadSensitivityY: 0.03,
  invertY: false,
  invertX: false,
};

// Audio settings
export type AudioSettings = {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  ambientVolume: number;
};

// Default audio settings
const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 1.0,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  ambientVolume: 0.7,
};

// Combined settings object
export type GameSettings = {
  controls: ControlBindings;
  graphics: GraphicsSettings;
  hud: HUDSettings;
  player: PlayerSettings;
  audio: AudioSettings;
  showSettings: boolean;
  activeSettingsTab: "controls" | "graphics" | "audio" | "hud";
};

// Initialize settings from localStorage or defaults
const initializeSettings = (): GameSettings => {
  try {
    const storedSettings = localStorage.getItem("gameSettings");
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
  } catch (e) {
    console.error("Failed to load settings from localStorage:", e);
  }

  return {
    controls: DEFAULT_CONTROL_BINDINGS,
    graphics: DEFAULT_GRAPHICS_SETTINGS,
    hud: DEFAULT_HUD_SETTINGS,
    player: DEFAULT_PLAYER_SETTINGS,
    audio: DEFAULT_AUDIO_SETTINGS,
    showSettings: false,
    activeSettingsTab: "controls",
  };
};

// Define the context
type SettingsContextType = {
  settings: GameSettings;
  updateControls: (newBindings: Partial<ControlBindings>) => void;
  updateGraphics: (newSettings: Partial<GraphicsSettings>) => void;
  updateHUD: (newSettings: Partial<HUDSettings>) => void;
  updatePlayer: (newSettings: Partial<PlayerSettings>) => void;
  updateAudio: (newSettings: Partial<AudioSettings>) => void;
  resetControls: () => void;
  resetGraphics: () => void;
  resetHUD: () => void;
  resetPlayer: () => void;
  resetAudio: () => void;
  toggleSettings: () => void;
  setActiveSettingsTab: (
    tab: "controls" | "graphics" | "audio" | "hud",
  ) => void;
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: initializeSettings(),
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
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<GameSettings>(initializeSettings());

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("gameSettings", JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings to localStorage:", e);
    }
  }, [settings]);

  const updateControls = (newBindings: Partial<ControlBindings>) => {
    setSettings((prev) => ({
      ...prev,
      controls: { ...prev.controls, ...newBindings },
    }));
  };

  const updateGraphics = (newSettings: Partial<GraphicsSettings>) => {
    setSettings((prev) => ({
      ...prev,
      graphics: { ...prev.graphics, ...newSettings },
    }));
  };

  const updateHUD = (newSettings: Partial<HUDSettings>) => {
    setSettings((prev) => ({
      ...prev,
      hud: { ...prev.hud, ...newSettings },
    }));
  };

  const updatePlayer = (newSettings: Partial<PlayerSettings>) => {
    setSettings((prev) => ({
      ...prev,
      player: { ...prev.player, ...newSettings },
    }));
  };

  const updateAudio = (newSettings: Partial<AudioSettings>) => {
    setSettings((prev) => ({
      ...prev,
      audio: { ...prev.audio, ...newSettings },
    }));
  };

  const resetControls = () => {
    setSettings((prev) => ({
      ...prev,
      controls: DEFAULT_CONTROL_BINDINGS,
    }));
  };

  const resetGraphics = () => {
    setSettings((prev) => ({
      ...prev,
      graphics: DEFAULT_GRAPHICS_SETTINGS,
    }));
  };

  const resetHUD = () => {
    setSettings((prev) => ({
      ...prev,
      hud: DEFAULT_HUD_SETTINGS,
    }));
  };

  const resetPlayer = () => {
    setSettings((prev) => ({
      ...prev,
      player: DEFAULT_PLAYER_SETTINGS,
    }));
  };

  const resetAudio = () => {
    setSettings((prev) => ({
      ...prev,
      audio: DEFAULT_AUDIO_SETTINGS,
    }));
  };

  const toggleSettings = () => {
    setSettings((prev) => ({
      ...prev,
      showSettings: !prev.showSettings,
    }));
  };

  const setActiveSettingsTab = (
    tab: "controls" | "graphics" | "audio" | "hud",
  ) => {
    setSettings((prev) => ({
      ...prev,
      activeSettingsTab: tab,
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateControls,
        updateGraphics,
        updateHUD,
        updatePlayer,
        updateAudio,
        resetControls,
        resetGraphics,
        resetHUD,
        resetPlayer,
        resetAudio,
        toggleSettings,
        setActiveSettingsTab,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
