"use client";

import { useEffect, useState } from "react";

import type React from "react";
import { useMultiplayer } from "../../context/MultiplayerContext";

export interface HUDConfig {
  showControls: boolean;
  showAmmo: boolean;
  showConnectionStatus: boolean;
  showCrosshair: boolean;
}

interface HUDProps {
  config?: Partial<HUDConfig>;
  ammoCount?: number;
  maxAmmo?: number;
  isReloading?: boolean;
}

export const defaultHUDConfig: HUDConfig = {
  showControls: true,
  showAmmo: true,
  showConnectionStatus: true,
  showCrosshair: true,
};

export const HUD: React.FC<HUDProps> = ({
  config = defaultHUDConfig,
  ammoCount = 50,
  maxAmmo = 50,
  isReloading = false,
}) => {
  // Merge default config with provided config
  const hudConfig = { ...defaultHUDConfig, ...config };
  const { connected, room, clientId } = useMultiplayer();
  const [playerCount, setPlayerCount] = useState(0);

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

  return (
    <>
      {/* Controls Info */}
      {hudConfig.showControls && (
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
              background: "rgba(255, 255, 255, 0.15)",
              padding: "8px 12px",
              borderRadius: "4px",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
            }}
          >
            WASD to move | SPACE to jump | SHIFT to run
          </div>
        </div>
      )}

      {/* Ammo Display */}
      {hudConfig.showAmmo && (
        <div
          id="ammo-display"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            color: "rgba(255, 255, 255, 0.75)",
            fontSize: "14px",
            fontFamily: "monospace",
            userSelect: "none",
            zIndex: 1000,
          }}
        >
          {isReloading ? "RELOADING..." : `AMMO: ${ammoCount}/${maxAmmo}`}
        </div>
      )}

      {/* Connection Status */}
      {hudConfig.showConnectionStatus && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            left: "10px",
            background: "rgba(0, 0, 0, 0.5)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            fontFamily: "monospace",
            zIndex: 1000,
          }}
        >
          <div>
            Connection: {connected ? "✅ Connected" : "❌ Disconnected"}
          </div>
          <div>Room ID: {room?.id || "None"}</div>
          <div>Client ID: {clientId || "None"}</div>
          <div>Players in room: {playerCount}</div>
        </div>
      )}

      {/* Crosshair */}
      {hudConfig.showCrosshair && (
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
              background: "rgba(255, 255, 255, 0.5)",
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
              background: "rgba(255, 255, 255, 0.5)",
              pointerEvents: "none",
            }}
          />
        </>
      )}
    </>
  );
};
