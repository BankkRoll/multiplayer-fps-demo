import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useSettingsSafe } from "./use-settings-safe";

// Optimized deadzone values for better control
const STICK_DEADZONE = 0.15;
const TRIGGER_DEADZONE = 0.1;

// Stick response curve for more precise aiming
const applyCurve = (value: number, sensitivity: number, invert: boolean): number => {
  const sign = Math.sign(value);
  const abs = Math.abs(value);
  const curvedValue = sign * Math.pow(abs, 1.5); // Exponential response curve
  return invert ? -curvedValue * sensitivity : curvedValue * sensitivity;
};

export type GamepadState = {
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  buttons: {
    jump: boolean;
    leftStickPress: boolean;
    shoot: boolean;
    reload: boolean;
  };
  connected: boolean;
};

export function useGamepad() {
  const { settings } = useSettingsSafe();
  const [gamepadState, setGamepadState] = useState<GamepadState>({
    leftStick: { x: 0, y: 0 },
    rightStick: { x: 0, y: 0 },
    buttons: {
      jump: false,
      leftStickPress: false,
      shoot: false,
      reload: false,
    },
    connected: false,
  });

  // Track previous button states for handling events
  const previousButtonStates = useRef({
    jump: false,
    leftStickPress: false,
    shoot: false,
    reload: false,
  });

  // Get button mapping from settings with null check
  const getButtonMapping = (action: string): number[] => {
    const mapping = settings.controls[action]?.gamepad || [];
    return Array.isArray(mapping) ? mapping : [mapping];
  };

  useFrame(() => {
    const gamepad = navigator.getGamepads()[0];
    if (!gamepad) return;

    // Process movement stick with deadzone
    const leftX =
      Math.abs(gamepad.axes[0]) > STICK_DEADZONE ? gamepad.axes[0] : 0;
    const leftY =
      Math.abs(gamepad.axes[1]) > STICK_DEADZONE ? gamepad.axes[1] : 0;

    // Default sensitivity values if settings are undefined
    const gamepadSensitivityX = settings.player.gamepadSensitivityX ?? 0.04;
    const gamepadSensitivityY = settings.player.gamepadSensitivityY ?? 0.03;
    const invertX = settings.player.invertX ?? false;
    const invertY = settings.player.invertY ?? false;

    // Apply sensitivity and inversion settings
    const rightX =
      Math.abs(gamepad.axes[2]) > STICK_DEADZONE
        ? applyCurve(
            gamepad.axes[2], 
            gamepadSensitivityX, 
            invertX
          )
        : 0;
    const rightY =
      Math.abs(gamepad.axes[3]) > STICK_DEADZONE
        ? applyCurve(
            gamepad.axes[3], 
            gamepadSensitivityY, 
            invertY
          )
        : 0;

    // Map gamepad buttons to actions based on settings
    const jumpButtonIndex = getButtonMapping('jump')[0] ?? 0; // Default to A button
    const sprintButtonIndex = getButtonMapping('sprint')[0] ?? 10; // Default to L3 button
    const shootButtonIndex = getButtonMapping('primaryAction')[0] ?? 7; // Default to RT
    const reloadButtonIndex = getButtonMapping('reload')[0] ?? 2; // Default to B button

    // Get button states
    const jumpButton = gamepad.buttons[jumpButtonIndex]?.pressed || false;
    const leftStickPress = gamepad.buttons[sprintButtonIndex]?.pressed || false;
    const shootButton = gamepad.buttons[shootButtonIndex]?.value > TRIGGER_DEADZONE || false;
    const reloadButton = gamepad.buttons[reloadButtonIndex]?.pressed || false;

    setGamepadState({
      leftStick: { x: leftX, y: leftY },
      rightStick: { x: rightX, y: rightY },
      buttons: {
        jump: jumpButton,
        leftStickPress: leftStickPress,
        shoot: shootButton,
        reload: reloadButton,
      },
      connected: true,
    });

    // Store current button states for next frame
    previousButtonStates.current = {
      jump: jumpButton,
      leftStickPress: leftStickPress,
      shoot: shootButton,
      reload: reloadButton,
    };
  });

  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log("Gamepad connected:", e.gamepad.id);
      setGamepadState(prev => ({ ...prev, connected: true }));
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log("Gamepad disconnected:", e.gamepad.id);
      setGamepadState(prev => ({ ...prev, connected: false }));
    };

    window.addEventListener("gamepadconnected", handleGamepadConnected);
    window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);

    return () => {
      window.removeEventListener("gamepadconnected", handleGamepadConnected);
      window.removeEventListener(
        "gamepaddisconnected",
        handleGamepadDisconnected,
      );
    };
  }, []);

  return gamepadState;
}
