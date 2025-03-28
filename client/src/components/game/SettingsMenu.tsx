import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GraphicsQuality } from "../../context/SettingsContext";
import { useSettingsSafe } from "../../hooks/use-settings-safe";

// Key name mapping for display purposes
const KEY_DISPLAY_NAMES: Record<string, string> = {
  " ": "Space",
  "ArrowUp": "↑",
  "ArrowDown": "↓",
  "ArrowLeft": "←",
  "ArrowRight": "→",
  "click": "Left Click",
  "contextmenu": "Right Click",
};

export const SettingsMenu: React.FC = () => {
  const { settings, updateControls, updateGraphics, updateHUD, updatePlayer, 
    updateAudio, resetControls, resetGraphics, resetHUD, resetPlayer, 
    resetAudio, toggleSettings, setActiveSettingsTab } = useSettingsSafe();

  const [listeningForKey, setListeningForKey] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState<string | null>(null);
  
  // Disable pointer lock when menu opens
  useEffect(() => {
    if (settings.showSettings) {
      // Exit pointer lock when settings menu is open
      document.exitPointerLock();
    }
  }, [settings.showSettings]);

  // Handle key binding
  useEffect(() => {
    if (!listeningForKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      setTempKey(e.key);
      
      // Update the control binding
      const action = listeningForKey;
      const currentBinding = settings.controls[action];
      
      if (currentBinding) {
        updateControls({
          [action]: {
            ...currentBinding,
            keyboard: [e.key],
          },
        });
      }
      
      setListeningForKey(null);
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      
      // Map mouse buttons to recognizable names
      let buttonName = "";
      if (e.button === 0) buttonName = "click";
      else if (e.button === 2) buttonName = "contextmenu";
      else buttonName = `mouse${e.button}`;
      
      setTempKey(buttonName);
      
      // Update the control binding
      const action = listeningForKey;
      const currentBinding = settings.controls[action];
      
      if (currentBinding) {
        updateControls({
          [action]: {
            ...currentBinding,
            keyboard: [buttonName],
          },
        });
      }
      
      setListeningForKey(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [listeningForKey, settings.controls, updateControls]);

  // Render key binding
  const renderKeyBinding = (action: string, displayName: string) => {
    const binding = settings.controls[action];
    const keyNames = binding?.keyboard.map(key => KEY_DISPLAY_NAMES[key] || key).join(", ");
    
    return (
      <div className="control-binding">
        <span className="action-name">{displayName}</span>
        <button 
          className={`binding-button ${listeningForKey === action ? "listening" : ""}`}
          onClick={() => setListeningForKey(action)}
        >
          {listeningForKey === action ? "Press a key..." : keyNames}
        </button>
      </div>
    );
  };

  // Tab content rendering
  const renderControlsTab = () => {
    const { 
      mouseSensitivity = 1.0, 
      gamepadSensitivityX = 0.04, 
      gamepadSensitivityY = 0.03, 
      invertX = false, 
      invertY = false 
    } = settings?.player || {};
    
    return (
      <div className="settings-tab">
        <h3>Mouse Settings</h3>
        <div className="settings-group">
          <label>Mouse Sensitivity</label>
          <div className="slider-container">
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={mouseSensitivity}
              onChange={(e) => updatePlayer({ mouseSensitivity: parseFloat(e.target.value) })}
            />
            <span>{mouseSensitivity.toFixed(1)}</span>
          </div>
        </div>
        
        <h3>Gamepad Settings</h3>
        <div className="settings-group">
          <label>Gamepad Horizontal Sensitivity</label>
          <div className="slider-container">
            <input
              type="range"
              min="0.01"
              max="0.1"
              step="0.01"
              value={gamepadSensitivityX}
              onChange={(e) => updatePlayer({ gamepadSensitivityX: parseFloat(e.target.value) })}
            />
            <span>{gamepadSensitivityX.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="settings-group">
          <label>Gamepad Vertical Sensitivity</label>
          <div className="slider-container">
            <input
              type="range"
              min="0.01"
              max="0.1"
              step="0.01"
              value={gamepadSensitivityY}
              onChange={(e) => updatePlayer({ gamepadSensitivityY: parseFloat(e.target.value) })}
            />
            <span>{gamepadSensitivityY.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="settings-group">
          <label>Invert X Axis</label>
          <input 
            type="checkbox" 
            checked={invertX} 
            onChange={(e) => updatePlayer({ invertX: e.target.checked })}
          />
        </div>
        
        <div className="settings-group">
          <label>Invert Y Axis</label>
          <input 
            type="checkbox" 
            checked={invertY} 
            onChange={(e) => updatePlayer({ invertY: e.target.checked })}
          />
        </div>
        
        <div className="key-bindings">
          <h4>Key Bindings</h4>
          <div className="control-binding">
            <div className="action-name">Forward</div>
            <div className="binding-button">
              {(settings?.controls?.forward?.keyboard || []).join(', ')}
            </div>
          </div>
          <div className="control-binding">
            <div className="action-name">Backward</div>
            <div className="binding-button">
              {(settings?.controls?.backward?.keyboard || []).join(', ')}
            </div>
          </div>
          <div className="control-binding">
            <div className="action-name">Left</div>
            <div className="binding-button">
              {(settings?.controls?.left?.keyboard || []).join(', ')}
            </div>
          </div>
          <div className="control-binding">
            <div className="action-name">Right</div>
            <div className="binding-button">
              {(settings?.controls?.right?.keyboard || []).join(', ')}
            </div>
          </div>
          <div className="control-binding">
            <div className="action-name">Jump</div>
            <div className="binding-button">
              {(settings?.controls?.jump?.keyboard || []).join(', ')}
            </div>
          </div>
          <div className="control-binding">
            <div className="action-name">Sprint</div>
            <div className="binding-button">
              {(settings?.controls?.sprint?.keyboard || []).join(', ')}
            </div>
          </div>
          <div className="control-binding">
            <div className="action-name">Shoot</div>
            <div className="binding-button">
              {(settings?.controls?.primaryAction?.keyboard || []).join(', ')}
            </div>
          </div>
          <div className="control-binding">
            <div className="action-name">Reload</div>
            <div className="binding-button">
              {(settings?.controls?.reload?.keyboard || []).join(', ')}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGraphicsTab = () => {
    const {
      quality = GraphicsQuality.MEDIUM,
      fov = 90,
      shadowQuality = "medium",
      postProcessing = true,
      enableVignette = true,
      enableChromaticAberration = true,
      enableBrightnessContrast = true,
      enableToneMapping = true
    } = settings?.graphics || {};
    
    return (
      <div className="settings-tab">
        <h3>Graphics</h3>
        
        <div className="settings-group">
          <label>Quality Preset</label>
          <select 
            value={quality} 
            onChange={(e) => updateGraphics({ quality: e.target.value as any })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="ultra">Ultra</option>
          </select>
        </div>
        
        <div className="settings-group">
          <label>Field of View (FOV)</label>
          <div className="slider-container">
            <input 
              type="range" 
              min="60" 
              max="120" 
              step="1" 
              value={fov} 
              onChange={(e) => updateGraphics({ fov: parseInt(e.target.value) })}
            />
            <span>{fov}°</span>
          </div>
        </div>
        
        <div className="settings-group">
          <label>Shadow Quality</label>
          <select 
            value={shadowQuality} 
            onChange={(e) => updateGraphics({ shadowQuality: e.target.value as any })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        
        <div className="settings-group">
          <label>Post Processing</label>
          <input 
            type="checkbox" 
            checked={postProcessing} 
            onChange={(e) => updateGraphics({ postProcessing: e.target.checked })}
          />
        </div>
        
        {postProcessing && (
          <>
            <div className="settings-group">
              <label>Vignette Effect</label>
              <input 
                type="checkbox" 
                checked={enableVignette} 
                onChange={(e) => updateGraphics({ enableVignette: e.target.checked })}
              />
            </div>
            
            <div className="settings-group">
              <label>Chromatic Aberration Effect</label>
              <input 
                type="checkbox" 
                checked={enableChromaticAberration} 
                onChange={(e) => updateGraphics({ enableChromaticAberration: e.target.checked })}
              />
            </div>
            
            <div className="settings-group">
              <label>Brightness/Contrast Effect</label>
              <input 
                type="checkbox" 
                checked={enableBrightnessContrast} 
                onChange={(e) => updateGraphics({ enableBrightnessContrast: e.target.checked })}
              />
            </div>
            
            <div className="settings-group">
              <label>Tone Mapping Effect</label>
              <input 
                type="checkbox" 
                checked={enableToneMapping} 
                onChange={(e) => updateGraphics({ enableToneMapping: e.target.checked })}
              />
            </div>
          </>
        )}
        
        <button className="reset-button" onClick={resetGraphics}>
          Reset Graphics
        </button>
      </div>
    );
  };

  const renderAudioTab = () => {
    const {
      masterVolume = 1.0,
      sfxVolume = 0.8,
      musicVolume = 0.5,
      ambientVolume = 0.7
    } = settings?.audio || {};
    
    return (
      <div className="settings-tab">
        <h3>Audio</h3>
        
        <div className="settings-group">
          <label>Master Volume</label>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVolume}
              onChange={(e) => updateAudio({ masterVolume: parseFloat(e.target.value) })}
            />
            <span>{Math.round(masterVolume * 100)}%</span>
          </div>
        </div>
        
        <div className="settings-group">
          <label>SFX Volume</label>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={(e) => updateAudio({ sfxVolume: parseFloat(e.target.value) })}
            />
            <span>{Math.round(sfxVolume * 100)}%</span>
          </div>
        </div>
        
        <div className="settings-group">
          <label>Music Volume</label>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={(e) => updateAudio({ musicVolume: parseFloat(e.target.value) })}
            />
            <span>{Math.round(musicVolume * 100)}%</span>
          </div>
        </div>
        
        <div className="settings-group">
          <label>Ambient Volume</label>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={(e) => updateAudio({ ambientVolume: parseFloat(e.target.value) })}
            />
            <span>{Math.round(ambientVolume * 100)}%</span>
          </div>
        </div>
      </div>
    );
  };

  const renderHUDTab = () => {
    const {
      showCrosshair = true,
      showAmmo = true,
      showControls = true,
      showConnectionStatus = true,
      crosshairStyle = "default",
      crosshairColor = "rgba(255, 255, 255, 0.75)"
    } = settings?.hud || {};
    
    return (
      <div className="settings-tab">
        <h3>HUD Settings</h3>
        
        <div className="settings-group">
          <label>Show Crosshair</label>
          <input 
            type="checkbox" 
            checked={showCrosshair} 
            onChange={(e) => updateHUD({ showCrosshair: e.target.checked })}
          />
        </div>
        
        {showCrosshair && (
          <>
            <div className="settings-group">
              <label>Crosshair Style</label>
              <select 
                value={crosshairStyle} 
                onChange={(e) => updateHUD({ crosshairStyle: e.target.value as any })}
              >
                <option value="default">Default</option>
                <option value="dot">Dot</option>
                <option value="cross">Cross</option>
                <option value="circle">Circle</option>
              </select>
            </div>
            
            <div className="settings-group">
              <label>Crosshair Color</label>
              <input 
                type="text" 
                value={crosshairColor} 
                onChange={(e) => updateHUD({ crosshairColor: e.target.value })}
              />
            </div>
          </>
        )}
        
        <div className="settings-group">
          <label>Show Ammo Counter</label>
          <input 
            type="checkbox" 
            checked={showAmmo} 
            onChange={(e) => updateHUD({ showAmmo: e.target.checked })}
          />
        </div>
        
        <div className="settings-group">
          <label>Show Controls Guide</label>
          <input 
            type="checkbox" 
            checked={showControls} 
            onChange={(e) => updateHUD({ showControls: e.target.checked })}
          />
        </div>
        
        <div className="settings-group">
          <label>Show Connection Info</label>
          <input 
            type="checkbox" 
            checked={showConnectionStatus} 
            onChange={(e) => updateHUD({ showConnectionStatus: e.target.checked })}
          />
        </div>
      </div>
    );
  };

  // If settings menu is not visible, don't render anything
  if (!settings.showSettings) {
    return null;
  }

  // Portal the UI to the DOM instead of rendering it in the Canvas
  return createPortal(
    <div className="settings-menu" style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
      fontFamily: "'Arial', sans-serif",
      color: "white",
      userSelect: "none",
    }}>
      <div className="settings-content" style={{
        background: "#1a1a1a",
        borderRadius: "8px",
        width: "80%",
        maxWidth: "800px",
        maxHeight: "80vh",
        overflowY: "auto",
        boxShadow: "0 0 20px rgba(0, 0, 0, 0.5)",
      }}>
        <div className="settings-header" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 20px",
          borderBottom: "2px solid #333",
        }}>
          <h2 style={{ margin: 0, fontSize: "24px" }}>Settings</h2>
          <button className="close-button" style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
          }} onClick={toggleSettings}>×</button>
        </div>
        
        <div className="settings-tabs" style={{
          display: "flex",
          borderBottom: "1px solid #333",
        }}>
          <button
            className={settings.activeSettingsTab === "controls" ? "active" : ""}
            style={{
              padding: "12px 24px",
              background: "none",
              border: "none",
              color: settings.activeSettingsTab === "controls" ? "white" : "#ccc",
              fontSize: "16px",
              cursor: "pointer",
              position: "relative",
              ...(settings.activeSettingsTab === "controls" ? {
                ":after": {
                  content: "''",
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: "#4a90e2",
                }
              } : {})
            }}
            onClick={() => setActiveSettingsTab("controls")}
          >
            Controls
          </button>
          <button
            className={settings.activeSettingsTab === "graphics" ? "active" : ""}
            style={{
              padding: "12px 24px",
              background: "none",
              border: "none",
              color: settings.activeSettingsTab === "graphics" ? "white" : "#ccc",
              fontSize: "16px",
              cursor: "pointer",
              position: "relative",
            }}
            onClick={() => setActiveSettingsTab("graphics")}
          >
            Graphics
          </button>
          <button
            className={settings.activeSettingsTab === "audio" ? "active" : ""}
            style={{
              padding: "12px 24px",
              background: "none",
              border: "none",
              color: settings.activeSettingsTab === "audio" ? "white" : "#ccc",
              fontSize: "16px",
              cursor: "pointer",
              position: "relative",
            }}
            onClick={() => setActiveSettingsTab("audio")}
          >
            Audio
          </button>
          <button
            className={settings.activeSettingsTab === "hud" ? "active" : ""}
            style={{
              padding: "12px 24px",
              background: "none",
              border: "none",
              color: settings.activeSettingsTab === "hud" ? "white" : "#ccc",
              fontSize: "16px",
              cursor: "pointer",
              position: "relative",
            }}
            onClick={() => setActiveSettingsTab("hud")}
          >
            HUD
          </button>
        </div>
        
        <div className="settings-tab-content" style={{ padding: "20px" }}>
          {settings.activeSettingsTab === "controls" && renderControlsTab()}
          {settings.activeSettingsTab === "graphics" && renderGraphicsTab()}
          {settings.activeSettingsTab === "audio" && renderAudioTab()}
          {settings.activeSettingsTab === "hud" && renderHUDTab()}
        </div>
      </div>
    </div>,
    document.body
  );
}; 