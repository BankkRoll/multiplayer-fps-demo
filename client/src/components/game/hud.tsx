"use client";

import { useEffect, useState } from "react";

import type React from "react";
import { useMultiplayer } from "../../context/MultiplayerContext";
import { useSettingsSafe } from "../../hooks/use-settings-safe";

export interface HUDConfig {
  showControls: boolean;
  showAmmo: boolean;
  showConnectionStatus: boolean;
  showCrosshair: boolean;
  crosshairStyle: "default" | "dot" | "cross" | "circle";
  crosshairColor: string;
}

interface HUDProps {
  ammoCount?: number;
  maxAmmo?: number;
  isReloading?: boolean;
}

export const defaultHUDConfig: HUDConfig = {
  showControls: true,
  showAmmo: true,
  showConnectionStatus: true,
  showCrosshair: true,
  crosshairStyle: "default",
  crosshairColor: "rgba(255, 255, 255, 0.75)",
};

export const HUD: React.FC<HUDProps> = ({
  ammoCount = 50,
  maxAmmo = 50,
  isReloading = false,
}) => {
  const { connected, room, clientId } = useMultiplayer();
  const { settings, toggleSettings } = useSettingsSafe();
  const [playerCount, setPlayerCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [showFps, setShowFps] = useState(true);

  // FPS counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const updateFps = () => {
      frameCount++;
      const now = performance.now();

      if (now - lastTime > 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(updateFps);
    };

    const frameId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Handle toggle settings menu with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        toggleSettings();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSettings]);

  useEffect(() => {
    if (room) {
      // Update player count when state changes
      const handleStateChange = (state: any) => {
        setPlayerCount(state.players.size);
      };

      room.onStateChange(handleStateChange);

      // Initial player count
      if (room.state && room.state.players) {
        setPlayerCount(room.state.players.size);
      }
    }
  }, [room]);

  // Create crosshair based on settings
  const renderCrosshair = () => {
    if (!settings.hud.showCrosshair) return null;

    // Get crosshair style and color from settings
    const style = settings.hud.crosshairStyle || "default";
    const color = settings.hud.crosshairColor || "rgba(255, 255, 255, 0.75)";

    switch (style) {
      case "dot":
        return (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: color,
              pointerEvents: "none",
            }}
          />
        );
      case "cross":
        return (
          <>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "16px",
                height: "2px",
                background: color,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "2px",
                height: "16px",
                background: color,
                pointerEvents: "none",
              }}
            />
          </>
        );
      case "circle":
        return (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              border: `2px solid ${color}`,
              pointerEvents: "none",
            }}
          />
        );
      default:
        return (
          <>
            <div
              style={{
                position: "absolute",
                top: "50%",
                marginTop: "10px",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(45deg)",
                width: "12px",
                height: "2px",
                background: color,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                marginTop: "10px",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(-45deg)",
                width: "12px",
                height: "2px",
                background: color,
                pointerEvents: "none",
              }}
            />
          </>
        );
    }
  };

  // Display controls info
  const renderControlsInfo = () => {
    if (!settings.hud.showControls) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255, 255, 255, 0.75)",
          fontSize: "13px",
          fontFamily: "monospace",
          userSelect: "none",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            padding: "8px 12px",
            borderRadius: "4px",
            letterSpacing: "0.5px",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          WASD to move | SPACE to jump | SHIFT to run | R to reload | ESC for
          settings
        </div>
      </div>
    );
  };

  // Display ammo counter
  const renderAmmo = () => {
    if (!settings.hud.showAmmo) return null;

    return (
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          right: "40px",
          background: "rgba(0, 0, 0, 0.5)",
          color: "white",
          padding: "10px 15px",
          borderRadius: "5px",
          fontFamily: "monospace",
          fontSize: "16px",
          userSelect: "none",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        {isReloading ? (
          <div style={{ color: "#f44336", fontWeight: "bold" }}>
            RELOADING...
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span>{ammoCount}</span>
              <span style={{ fontSize: "14px", opacity: 0.7 }}>/{maxAmmo}</span>
            </div>
            <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "2px" }}>
              Press R to reload
            </div>
          </>
        )}
      </div>
    );
  };

  // Display connection status
  const renderConnectionStatus = () => {
    if (!settings.hud.showConnectionStatus) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "rgba(0, 0, 0, 0.5)",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
          fontFamily: "monospace",
          zIndex: 1000,
        }}
      >
        <div style={{ marginBottom: "5px" }}>
          Connection: {connected ? "✅ Connected" : "❌ Disconnected"}
        </div>
        <div style={{ marginBottom: "5px" }}>Room ID: {room?.id || "None"}</div>
        <div style={{ marginBottom: "5px" }}>
          Client ID: {clientId || "None"}
        </div>
        <div>Players in room: {playerCount}</div>
        {showFps && (
          <div
            style={{
              marginTop: "10px",
              color: fps < 30 ? "#f44336" : "#4caf50",
            }}
          >
            FPS: {fps}
          </div>
        )}
      </div>
    );
  };

  // Settings button
  const renderSettingsButton = () => {
    return (
      <button
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(0, 0, 0, 0.5)",
          color: "white",
          border: "none",
          borderRadius: "5px",
          padding: "8px 15px",
          fontFamily: "monospace",
          fontSize: "14px",
          cursor: "pointer",
          zIndex: 1000,
        }}
        onClick={toggleSettings}
      >
        Settings
      </button>
    );
  };

  return (
    <>
      {renderControlsInfo()}
      {renderAmmo()}
      {renderConnectionStatus()}
      {renderSettingsButton()}
      {renderCrosshair()}
    </>
  );
};
