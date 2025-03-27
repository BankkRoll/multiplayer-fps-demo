# Code Digest

## client\src\components\game\hud.tsx

```tsx
     1: "use client";
     2: 
     3: import { useEffect, useState } from "react";
     4: 
     5: import type React from "react";
     6: import { useMultiplayer } from "../../context/MultiplayerContext";
     7: 
     8: export interface HUDConfig {
     9:   showControls: boolean;
    10:   showAmmo: boolean;
    11:   showConnectionStatus: boolean;
    12:   showCrosshair: boolean;
    13: }
    14: 
    15: interface HUDProps {
    16:   config?: Partial<HUDConfig>;
    17:   ammoCount?: number;
    18:   maxAmmo?: number;
    19:   isReloading?: boolean;
    20: }
    21: 
    22: export const defaultHUDConfig: HUDConfig = {
    23:   showControls: true,
    24:   showAmmo: true,
    25:   showConnectionStatus: true,
    26:   showCrosshair: true,
    27: };
    28: 
    29: export const HUD: React.FC<HUDProps> = ({
    30:   config = defaultHUDConfig,
    31:   ammoCount = 50,
    32:   maxAmmo = 50,
    33:   isReloading = false,
    34: }) => {
    35:   // Merge default config with provided config
    36:   const hudConfig = { ...defaultHUDConfig, ...config };
    37:   const { connected, room, clientId } = useMultiplayer();
    38:   const [playerCount, setPlayerCount] = useState(0);
    39: 
    40:   useEffect(() => {
    41:     if (room) {
    42:       // Update player count when state changes
    43:       const handleStateChange = (state: any) => {
    44:         setPlayerCount(state.players.size);
    45:       };
    46: 
    47:       room.onStateChange(handleStateChange);
    48: 
    49:       // Initial player count
    50:       if (room.state && room.state.players) {
    51:         setPlayerCount(room.state.players.size);
    52:       }
    53:     }
    54:   }, [room]);
    55: 
    56:   return (
    57:     <>
    58:       {/* Controls Info */}
    59:       {hudConfig.showControls && (
    60:         <div
    61:           style={{
    62:             position: "absolute",
    63:             top: "20px",
    64:             left: "50%",
    65:             transform: "translateX(-50%)",
    66:             color: "rgba(255, 255, 255, 0.75)",
    67:             fontSize: "13px",
    68:             fontFamily: "monospace",
    69:             userSelect: "none",
    70:             zIndex: 1000,
    71:           }}
    72:         >
    73:           <div
    74:             style={{
    75:               background: "rgba(255, 255, 255, 0.15)",
    76:               padding: "8px 12px",
    77:               borderRadius: "4px",
    78:               letterSpacing: "0.5px",
    79:               whiteSpace: "nowrap",
    80:             }}
    81:           >
    82:             WASD to move | SPACE to jump | SHIFT to run
    83:           </div>
    84:         </div>
    85:       )}
    86: 
    87:       {/* Ammo Display */}
    88:       {hudConfig.showAmmo && (
    89:         <div
    90:           id="ammo-display"
    91:           style={{
    92:             position: "absolute",
    93:             top: "10px",
    94:             right: "10px",
    95:             color: "rgba(255, 255, 255, 0.75)",
    96:             fontSize: "14px",
    97:             fontFamily: "monospace",
    98:             userSelect: "none",
    99:             zIndex: 1000,
   100:           }}
   101:         >
   102:           {isReloading ? "RELOADING..." : `AMMO: ${ammoCount}/${maxAmmo}`}
   103:         </div>
   104:       )}
   105: 
   106:       {/* Connection Status */}
   107:       {hudConfig.showConnectionStatus && (
   108:         <div
   109:           style={{
   110:             position: "absolute",
   111:             top: "50px",
   112:             left: "10px",
   113:             background: "rgba(0, 0, 0, 0.5)",
   114:             color: "white",
   115:             padding: "10px",
   116:             borderRadius: "5px",
   117:             fontFamily: "monospace",
   118:             zIndex: 1000,
   119:           }}
   120:         >
   121:           <div>
   122:             Connection: {connected ? "✅ Connected" : "❌ Disconnected"}
   123:           </div>
   124:           <div>Room ID: {room?.id || "None"}</div>
   125:           <div>Client ID: {clientId || "None"}</div>
   126:           <div>Players in room: {playerCount}</div>
   127:         </div>
   128:       )}
   129: 
   130:       {/* Crosshair */}
   131:       {hudConfig.showCrosshair && (
   132:         <>
   133:           <div
   134:             style={{
   135:               position: "absolute",
   136:               top: "50%",
   137:               marginTop: "10px",
   138:               left: "50%",
   139:               transform: "translate(-50%, -50%) rotate(45deg)",
   140:               width: "12px",
   141:               height: "2px",
   142:               background: "rgba(255, 255, 255, 0.5)",
   143:               pointerEvents: "none",
   144:             }}
   145:           />
   146:           <div
   147:             style={{
   148:               position: "absolute",
   149:               top: "50%",
   150:               marginTop: "10px",
   151:               left: "50%",
   152:               transform: "translate(-50%, -50%) rotate(-45deg)",
   153:               width: "12px",
   154:               height: "2px",
   155:               background: "rgba(255, 255, 255, 0.5)",
   156:               pointerEvents: "none",
   157:             }}
   158:           />
   159:         </>
   160:       )}
   161:     </>
   162:   );
   163: };
   164: 
```

## client\src\hooks\use-gamepad.ts

```typescript
     1: import { useEffect, useRef, useState } from "react";
     2: import { useFrame } from "@react-three/fiber";
     3: 
     4: // Optimized deadzone values for better control
     5: const STICK_DEADZONE = 0.15;
     6: const TRIGGER_DEADZONE = 0.1;
     7: 
     8: // Stick response curve for more precise aiming
     9: const applyCurve = (value: number): number => {
    10:   const sign = Math.sign(value);
    11:   const abs = Math.abs(value);
    12:   return sign * Math.pow(abs, 1.5); // Exponential response curve for better precision
    13: };
    14: 
    15: export type GamepadState = {
    16:   leftStick: { x: number; y: number };
    17:   rightStick: { x: number; y: number };
    18:   buttons: {
    19:     jump: boolean;
    20:     leftStickPress: boolean;
    21:     shoot: boolean;
    22:   };
    23:   connected: boolean;
    24: };
    25: 
    26: export function useGamepad() {
    27:   const [gamepadState, setGamepadState] = useState<GamepadState>({
    28:     leftStick: { x: 0, y: 0 },
    29:     rightStick: { x: 0, y: 0 },
    30:     buttons: {
    31:       jump: false,
    32:       shoot: false,
    33:     },
    34:     connected: false,
    35:   });
    36: 
    37:   const previousButtonStates = useRef({
    38:     jump: false,
    39:     sprint: false,
    40:     leftStickPress: false,
    41:     shoot: false,
    42:   });
    43: 
    44:   useFrame(() => {
    45:     const gamepad = navigator.getGamepads()[0];
    46:     if (!gamepad) return;
    47: 
    48:     // Process movement stick with deadzone
    49:     const leftX =
    50:       Math.abs(gamepad.axes[0]) > STICK_DEADZONE ? gamepad.axes[0] : 0;
    51:     const leftY =
    52:       Math.abs(gamepad.axes[1]) > STICK_DEADZONE ? gamepad.axes[1] : 0;
    53: 
    54:     // Process aim stick with response curve for better precision
    55:     const rightX =
    56:       Math.abs(gamepad.axes[2]) > STICK_DEADZONE
    57:         ? applyCurve(gamepad.axes[2])
    58:         : 0;
    59:     const rightY =
    60:       Math.abs(gamepad.axes[3]) > STICK_DEADZONE
    61:         ? applyCurve(gamepad.axes[3])
    62:         : 0;
    63: 
    64:     // Map gamepad buttons to actions
    65:     const jumpButton = gamepad.buttons[0].pressed; // A button
    66:     const leftStickPress = gamepad.buttons[10].pressed; // L3 button
    67:     const shootButton = gamepad.buttons[7].value > TRIGGER_DEADZONE; // RT button with analog support
    68: 
    69:     setGamepadState({
    70:       leftStick: { x: leftX, y: leftY },
    71:       rightStick: { x: rightX, y: rightY },
    72:       buttons: {
    73:         jump: jumpButton,
    74:         leftStickPress: leftStickPress,
    75:         shoot: shootButton,
    76:       },
    77:       connected: true,
    78:     });
    79: 
    80:     // Store current button states for next frame
    81:     previousButtonStates.current = {
    82:       jump: jumpButton,
    83:       leftStickPress: leftStickPress,
    84:       shoot: shootButton,
    85:     };
    86:   });
    87: 
    88:   useEffect(() => {
    89:     const handleGamepadConnected = (e: GamepadEvent) => {
    90:       console.log("Gamepad connected:", e.gamepad.id);
    91:     };
    92: 
    93:     const handleGamepadDisconnected = (e: GamepadEvent) => {
    94:       console.log("Gamepad disconnected:", e.gamepad.id);
    95:       setGamepadState((prev) => ({ ...prev, connected: false }));
    96:     };
    97: 
    98:     window.addEventListener("gamepadconnected", handleGamepadConnected);
    99:     window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);
   100: 
   101:     return () => {
   102:       window.removeEventListener("gamepadconnected", handleGamepadConnected);
   103:       window.removeEventListener(
   104:         "gamepaddisconnected",
   105:         handleGamepadDisconnected,
   106:       );
   107:     };
   108:   }, []);
   109: 
   110:   return gamepadState;
   111: }
   112: 
```

## client\tsconfig.app.json

```json
     1: {
     2:   "compilerOptions": {
     3:     "target": "ES2020",
     4:     "useDefineForClassFields": true,
     5:     "lib": ["ES2020", "DOM", "DOM.Iterable"],
     6:     "module": "ESNext",
     7:     "skipLibCheck": true,
     8: 
     9:     /* Bundler mode */
    10:     "moduleResolution": "bundler",
    11:     "allowImportingTsExtensions": true,
    12:     "isolatedModules": true,
    13:     "moduleDetection": "force",
    14:     "noEmit": true,
    15:     "jsx": "react-jsx"
    16:   },
    17:   "include": ["src"]
    18: }
    19: 
```

## shared\types.ts

```typescript
     1: export enum PlayerAnimation {
     2:   IDLE = "idle",
     3:   WALKING = "walking",
     4:   GREETING = "greeting",
     5: }
     6: 
     7: export interface Vector3 {
     8:   x: number;
     9:   y: number;
    10:   z: number;
    11: }
    12: 
    13: export interface Quaternion {
    14:   x: number;
    15:   y: number;
    16:   z: number;
    17:   w: number;
    18: }
    19: 
    20: export interface PlayerInput {
    21:   position: Vector3;
    22:   rotation: Quaternion;
    23:   animation: PlayerAnimation;
    24: }
    25: 
    26: export interface ProjectileInput {
    27:   position: Vector3;
    28:   direction: Vector3;
    29:   color: string;
    30: }
    31: 
    32: export interface Vector3 {
    33:   x: number;
    34:   y: number;
    35:   z: number;
    36: }
    37: 
    38: export interface Quaternion {
    39:   x: number;
    40:   y: number;
    41:   z: number;
    42:   w: number;
    43: }
    44: 
    45: export interface PlayerState {
    46:   id: string;
    47:   position: Vector3;
    48:   rotation: Quaternion;
    49:   animation: PlayerAnimation;
    50: }
    51: 
    52: export interface ProjectileState {
    53:   id: string;
    54:   position: Vector3;
    55:   direction: Vector3;
    56:   color: string;
    57:   ownerId: string;
    58:   timestamp: number;
    59: }
    60: 
    61: export interface GameState {
    62:   players: { [key: string]: PlayerState };
    63:   projectiles: { [key: string]: ProjectileState };
    64: }
    65: 
    66: export interface PlayerInput {
    67:   position: Vector3;
    68:   rotation: Quaternion;
    69:   animation: PlayerAnimation;
    70: }
    71: 
    72: export interface ProjectileInput {
    73:   position: Vector3;
    74:   direction: Vector3;
    75:   color: string;
    76: }
    77: 
    78: export interface Vector3 {
    79:   x: number;
    80:   y: number;
    81:   z: number;
    82: }
    83: 
    84: export interface Quaternion {
    85:   x: number;
    86:   y: number;
    87:   z: number;
    88:   w: number;
    89: }
    90: 
    91: export interface PlayerState {
    92:   id: string;
    93:   position: Vector3;
    94:   rotation: Quaternion;
    95:   animation: PlayerAnimation;
    96: }
    97: 
    98: export interface ProjectileState {
    99:   id: string;
   100:   position: Vector3;
   101:   direction: Vector3;
   102:   color: string;
   103:   ownerId: string;
   104:   timestamp: number;
   105: }
   106: 
   107: export interface GameState {
   108:   players: { [key: string]: PlayerState };
   109:   projectiles: { [key: string]: ProjectileState };
   110: }
   111: 
   112: export interface PlayerInput {
   113:   position: Vector3;
   114:   rotation: Quaternion;
   115:   animation: PlayerAnimation;
   116: }
   117: 
   118: export interface ProjectileInput {
   119:   position: Vector3;
   120:   direction: Vector3;
   121:   color: string;
   122: }
   123: 
```

## client\src\App.tsx

```tsx
     1: "use client";
     2: 
     3: import * as THREE from "three";
     4: 
     5: import {
     6:   BrightnessContrast,
     7:   ChromaticAberration,
     8:   EffectComposer,
     9:   ToneMapping,
    10:   Vignette,
    11: } from "@react-three/postprocessing";
    12: import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
    13: import {
    14:   Environment,
    15:   MeshReflectorMaterial,
    16:   PerspectiveCamera,
    17: } from "@react-three/drei";
    18: import { HUD, defaultHUDConfig } from "./components/game/hud";
    19: import { Player, PlayerControls } from "./components/game/player";
    20: import { useRef, useState } from "react";
    21: 
    22: import { BlendFunction } from "postprocessing";
    23: import { Canvas } from "./components/canvas";
    24: import { MultiplayerProvider } from "./context/MultiplayerContext";
    25: import { OtherPlayers } from "./components/multiplayer/OtherPlayers";
    26: import { SphereTool } from "./components/game/sphere-tool";
    27: import { useLoadingAssets } from "./hooks/use-loading-assets";
    28: import { useTexture } from "@react-three/drei";
    29: 
    30: const Scene = () => {
    31:   const texture = useTexture("/final-texture.png");
    32:   texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    33: 
    34:   // Ground texture (50x50)
    35:   const groundTexture = texture.clone();
    36:   groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    37:   groundTexture.repeat.set(12, 12); // 12 repeats to match ground size
    38: 
    39:   // Side walls texture (2x4)
    40:   const sideWallTexture = texture.clone();
    41:   sideWallTexture.wrapS = sideWallTexture.wrapT = THREE.RepeatWrapping;
    42:   sideWallTexture.repeat.set(12, 1); // 12 repeats horizontally to match wall length
    43: 
    44:   // Front/back walls texture (50x4)
    45:   const frontWallTexture = texture.clone();
    46:   frontWallTexture.wrapS = frontWallTexture.wrapT = THREE.RepeatWrapping;
    47:   frontWallTexture.repeat.set(12, 1); // 12 repeats horizontally to match wall width
    48: 
    49:   return (
    50:     <RigidBody type="fixed" position={[0, 0, 0]} colliders={false}>
    51:       {/* Ground collider */}
    52:       <CuboidCollider args={[25, 0.1, 25]} position={[0, -0.1, 0]} />
    53: 
    54:       {/* Wall colliders */}
    55:       <CuboidCollider position={[25, 2, 0]} args={[1, 2, 25]} />
    56:       <CuboidCollider position={[-25, 2, 0]} args={[1, 2, 25]} />
    57:       <CuboidCollider position={[0, 2, 25]} args={[25, 2, 1]} />
    58:       <CuboidCollider position={[0, 2, -25]} args={[25, 2, 1]} />
    59: 
    60:       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
    61:         <planeGeometry args={[50, 50]} />
    62:         <MeshReflectorMaterial
    63:           map={groundTexture}
    64:           mirror={0}
    65:           roughness={1}
    66:           depthScale={0}
    67:           minDepthThreshold={0.9}
    68:           maxDepthThreshold={1}
    69:           metalness={0}
    70:         />
    71:       </mesh>
    72: 
    73:       {/* Border walls */}
    74:       <mesh position={[25, 2, 0]}>
    75:         <boxGeometry args={[2, 4, 50]} />
    76:         <meshStandardMaterial map={sideWallTexture} side={THREE.DoubleSide} />
    77:       </mesh>
    78:       <mesh position={[-25, 2, 0]}>
    79:         <boxGeometry args={[2, 4, 50]} />
    80:         <meshStandardMaterial map={sideWallTexture} side={THREE.DoubleSide} />
    81:       </mesh>
    82:       <mesh position={[0, 2, 25]}>
    83:         <boxGeometry args={[50, 4, 2]} />
    84:         <meshStandardMaterial map={frontWallTexture} side={THREE.DoubleSide} />
    85:       </mesh>
    86:       <mesh position={[0, 2, -25]}>
    87:         <boxGeometry args={[50, 4, 2]} />
    88:         <meshStandardMaterial map={frontWallTexture} side={THREE.DoubleSide} />
    89:       </mesh>
    90:     </RigidBody>
    91:   );
    92: };
    93: 
    94: export function App() {
    95:   const loading = useLoadingAssets();
    96:   const directionalLightRef = useRef<THREE.DirectionalLight>(null);
    97: 
    98:   // HUD configuration state
    99:   const [hudConfig, setHudConfig] = useState(defaultHUDConfig);
   100: 
   101:   // Ammo state (moved from SphereTool to App for HUD)
   102:   const [ammoCount, setAmmoCount] = useState(50);
   103:   const [maxAmmo] = useState(50);
   104:   const [isReloading, setIsReloading] = useState(false);
   105: 
   106:   // Hardcoded character settings (previously from Leva controls)
   107:   const characterSettings = {
   108:     walkSpeed: 0.11,
   109:     runSpeed: 0.15,
   110:     jumpForce: 0.5,
   111:   };
   112: 
   113:   // Hardcoded environment settings (previously from Leva controls)
   114:   const environmentSettings = {
   115:     // Fog settings
   116:     fogEnabled: true,
   117:     fogColor: "#dbdbdb",
   118:     fogNear: 13,
   119:     fogFar: 95,
   120: 
   121:     // Lighting settings
   122:     ambientIntensity: 1.3,
   123:     directionalIntensity: 1,
   124:     directionalHeight: 20,
   125:     directionalDistance: 10,
   126: 
   127:     // Post-processing settings
   128:     enablePostProcessing: true,
   129: 
   130:     // Vignette settings
   131:     vignetteEnabled: true,
   132:     vignetteOffset: 0.5,
   133:     vignetteDarkness: 0.5,
   134: 
   135:     // Chromatic aberration settings
   136:     chromaticAberrationEnabled: true,
   137:     chromaticAberrationOffset: 0.0005,
   138: 
   139:     // Brightness/contrast settings
   140:     brightnessContrastEnabled: true,
   141:     brightness: 0.1,
   142:     contrast: 0.1,
   143: 
   144:     // Color grading settings
   145:     colorGradingEnabled: true,
   146:     toneMapping: THREE.ACESFilmicToneMapping,
   147:     toneMappingExposure: 1.2,
   148:   };
   149: 
   150:   return (
   151:     <MultiplayerProvider>
   152:       <HUD
   153:         config={hudConfig}
   154:         ammoCount={ammoCount}
   155:         maxAmmo={maxAmmo}
   156:         isReloading={isReloading}
   157:       />
   158: 
   159:       <Canvas>
   160:         {environmentSettings.fogEnabled && (
   161:           <fog
   162:             attach="fog"
   163:             args={[
   164:               environmentSettings.fogColor,
   165:               environmentSettings.fogNear,
   166:               environmentSettings.fogFar,
   167:             ]}
   168:           />
   169:         )}
   170:         <Environment preset="sunset" background blur={0.8} resolution={256} />
   171: 
   172:         <ambientLight intensity={environmentSettings.ambientIntensity} />
   173:         <directionalLight
   174:           castShadow
   175:           position={[
   176:             environmentSettings.directionalDistance,
   177:             environmentSettings.directionalHeight,
   178:             environmentSettings.directionalDistance,
   179:           ]}
   180:           ref={directionalLightRef}
   181:           intensity={environmentSettings.directionalIntensity}
   182:           shadow-mapSize={[4096, 4096]}
   183:           shadow-camera-left={-30}
   184:           shadow-camera-right={30}
   185:           shadow-camera-top={30}
   186:           shadow-camera-bottom={-30}
   187:           shadow-camera-near={1}
   188:           shadow-camera-far={150}
   189:           shadow-bias={-0.0001}
   190:           shadow-normalBias={0.02}
   191:         />
   192: 
   193:         <Physics
   194:           debug={false}
   195:           paused={loading}
   196:           timeStep={1 / 60}
   197:           interpolate={true}
   198:           gravity={[0, -9.81, 0]}
   199:         >
   200:           <PlayerControls>
   201:             <Player
   202:               position={[0, 7, 10]}
   203:               walkSpeed={characterSettings.walkSpeed}
   204:               runSpeed={characterSettings.runSpeed}
   205:               jumpForce={characterSettings.jumpForce}
   206:               onMove={(position) => {
   207:                 if (directionalLightRef.current) {
   208:                   const light = directionalLightRef.current;
   209:                   light.position.x =
   210:                     position.x + environmentSettings.directionalDistance;
   211:                   light.position.z =
   212:                     position.z + environmentSettings.directionalDistance;
   213:                   light.target.position.copy(position);
   214:                   light.target.updateMatrixWorld();
   215:                 }
   216:               }}
   217:             />
   218:           </PlayerControls>
   219: 
   220:           <OtherPlayers />
   221: 
   222:           <Scene />
   223:           <SphereTool
   224:             onAmmoChange={setAmmoCount}
   225:             onReloadingChange={setIsReloading}
   226:             maxAmmo={maxAmmo}
   227:           />
   228:         </Physics>
   229: 
   230:         <PerspectiveCamera
   231:           makeDefault
   232:           position={[0, 10, 10]}
   233:           rotation={[0, 0, 0]}
   234:           near={0.1}
   235:           far={1000}
   236:         />
   237: 
   238:         {environmentSettings.enablePostProcessing && (
   239:           <EffectComposer>
   240:             {environmentSettings.vignetteEnabled && (
   241:               <Vignette
   242:                 offset={environmentSettings.vignetteOffset}
   243:                 darkness={environmentSettings.vignetteDarkness}
   244:                 eskil={false}
   245:               />
   246:             )}
   247:             {environmentSettings.chromaticAberrationEnabled && (
   248:               <ChromaticAberration
   249:                 offset={
   250:                   new THREE.Vector2(
   251:                     environmentSettings.chromaticAberrationOffset,
   252:                     environmentSettings.chromaticAberrationOffset,
   253:                   )
   254:                 }
   255:                 radialModulation={false}
   256:                 modulationOffset={0}
   257:               />
   258:             )}
   259:             {environmentSettings.brightnessContrastEnabled && (
   260:               <BrightnessContrast
   261:                 brightness={environmentSettings.brightness}
   262:                 contrast={environmentSettings.contrast}
   263:               />
   264:             )}
   265:             {environmentSettings.colorGradingEnabled && (
   266:               <ToneMapping
   267:                 blendFunction={BlendFunction.NORMAL}
   268:                 mode={environmentSettings.toneMapping}
   269:               />
   270:             )}
   271:           </EffectComposer>
   272:         )}
   273:       </Canvas>
   274:     </MultiplayerProvider>
   275:   );
   276: }
   277: 
   278: export default App;
   279: 
```

## .gitignore

```
     1: # Dependencies
     2: node_modules/
     3: .pnp
     4: .pnp.js
     5: .yarn/install-state.gz
     6: 
     7: # Build outputs
     8: dist/
     9: build/
    10: lib/
    11: 
    12: # Environment files
    13: .env
    14: .env.local
    15: .env.development.local
    16: .env.test.local
    17: .env.production.local
    18: 
    19: # Logs
    20: logs
    21: *.log
    22: npm-debug.log*
    23: yarn-debug.log*
    24: yarn-error.log*
    25: pnpm-debug.log*
    26: lerna-debug.log*
    27: 
    28: # Editor directories and files
    29: .vscode/*
    30: !.vscode/extensions.json
    31: !.vscode/settings.json
    32: .idea/
    33: .DS_Store
    34: *.suo
    35: *.ntvs*
    36: *.njsproj
    37: *.sln
    38: *.sw?
    39: 
    40: # Testing
    41: coverage/
    42: 
```

## server\.gitignore

```
     1: # Dependencies
     2: node_modules/
     3: .pnp
     4: .pnp.js
     5: .yarn/install-state.gz
     6: 
     7: # Build outputs
     8: dist/
     9: build/
    10: lib/
    11: 
    12: # Environment files
    13: .env
    14: .env.local
    15: .env.development.local
    16: .env.test.local
    17: .env.production.local
    18: 
    19: # Logs
    20: logs
    21: *.log
    22: npm-debug.log*
    23: yarn-debug.log*
    24: yarn-error.log*
    25: pnpm-debug.log*
    26: lerna-debug.log*
    27: 
    28: # Editor directories and files
    29: .vscode/*
    30: !.vscode/extensions.json
    31: !.vscode/settings.json
    32: .idea/
    33: .DS_Store
    34: *.suo
    35: *.ntvs*
    36: *.njsproj
    37: *.sln
    38: 
```

## client\src\hooks\use-loading-assets.ts

```typescript
     1: import { useEffect, useState } from "react";
     2: import { useProgress } from "@react-three/drei";
     3: 
     4: export function useLoadingAssets() {
     5:   const { active } = useProgress();
     6:   const [loading, setLoading] = useState(true);
     7: 
     8:   useEffect(() => {
     9:     // Wait a bit after the loading progress completes
    10:     if (!active) {
    11:       const timeout = setTimeout(() => {
    12:         setLoading(false);
    13:       }, 500);
    14:       return () => clearTimeout(timeout);
    15:     } else {
    16:       setLoading(true);
    17:     }
    18:   }, [active]);
    19: 
    20:   return loading;
    21: }
    22: 
```

## client\src\components\game\player.tsx

```tsx
     1: import * as THREE from "three";
     2: 
     3: import {
     4:   CapsuleCollider,
     5:   RigidBody,
     6:   RigidBodyProps,
     7:   useBeforePhysicsStep,
     8:   useRapier,
     9: } from "@react-three/rapier";
    10: import { Component, Entity, EntityType } from "./ecs";
    11: import {
    12:   KeyboardControls,
    13:   PointerLockControls,
    14:   useAnimations,
    15:   useGLTF,
    16:   useKeyboardControls,
    17: } from "@react-three/drei";
    18: import { useEffect, useRef, useState } from "react";
    19: import { useFrame, useThree } from "@react-three/fiber";
    20: 
    21: import { PlayerAnimation } from "../../../../shared/types";
    22: import Rapier from "@dimforge/rapier3d-compat";
    23: import { useControls } from "leva";
    24: import { useGamepad } from "../../hooks/use-gamepad";
    25: import { useMultiplayer } from "../../context/MultiplayerContext";
    26: 
    27: const _direction = new THREE.Vector3();
    28: const _frontVector = new THREE.Vector3();
    29: const _sideVector = new THREE.Vector3();
    30: const _characterLinvel = new THREE.Vector3();
    31: const _characterTranslation = new THREE.Vector3();
    32: const _cameraWorldDirection = new THREE.Vector3();
    33: const _cameraPosition = new THREE.Vector3();
    34: 
    35: const normalFov = 90;
    36: const sprintFov = 100;
    37: 
    38: const characterShapeOffset = 0.1;
    39: const autoStepMaxHeight = 2;
    40: const autoStepMinWidth = 0.05;
    41: const accelerationTimeAirborne = 0.2;
    42: const accelerationTimeGrounded = 0.025;
    43: const timeToJumpApex = 2;
    44: const maxJumpHeight = 0.5;
    45: const minJumpHeight = 0.2;
    46: const velocityXZSmoothing = 0.1;
    47: const velocityXZMin = 0.0001;
    48: const jumpGravity = -(2 * maxJumpHeight) / Math.pow(timeToJumpApex, 2);
    49: const maxJumpVelocity = Math.abs(jumpGravity) * timeToJumpApex;
    50: const minJumpVelocity = Math.sqrt(2 * Math.abs(jumpGravity) * minJumpHeight);
    51: 
    52: const up = new THREE.Vector3(0, 1, 0);
    53: 
    54: export type PlayerControls = {
    55:   children: React.ReactNode;
    56: };
    57: 
    58: type PlayerProps = RigidBodyProps & {
    59:   onMove?: (position: THREE.Vector3) => void;
    60:   walkSpeed?: number;
    61:   runSpeed?: number;
    62:   jumpForce?: number;
    63: };
    64: 
    65: export const Player = ({
    66:   onMove,
    67:   walkSpeed = 0.1,
    68:   runSpeed = 0.15,
    69:   jumpForce = 0.5,
    70:   ...props
    71: }: PlayerProps) => {
    72:   const playerRef = useRef<EntityType>(null!);
    73:   const gltf = useGLTF("/fps.glb");
    74:   const { actions } = useAnimations(gltf.animations, gltf.scene);
    75:   const { room } = useMultiplayer();
    76: 
    77:   // Hardcoded arms position (previously from Leva controls)
    78:   const armsPosition = {
    79:     x: 0.1,
    80:     y: -0.62,
    81:     z: -0.2,
    82:   };
    83: 
    84:   const rapier = useRapier();
    85:   const camera = useThree((state) => state.camera);
    86:   const clock = useThree((state) => state.clock);
    87: 
    88:   const characterController = useRef<Rapier.KinematicCharacterController>(
    89:     null!,
    90:   );
    91: 
    92:   const [, getKeyboardControls] = useKeyboardControls();
    93:   const gamepadState = useGamepad();
    94: 
    95:   const horizontalVelocity = useRef({ x: 0, z: 0 });
    96:   const jumpVelocity = useRef(0);
    97:   const holdingJump = useRef(false);
    98:   const jumpTime = useRef(0);
    99:   const jumping = useRef(false);
   100: 
   101:   // Animation states
   102:   const [isWalking, setIsWalking] = useState(false);
   103:   const [isRunning, setIsRunning] = useState(false);
   104: 
   105:   useEffect(() => {
   106:     const { world } = rapier;
   107: 
   108:     characterController.current =
   109:       world.createCharacterController(characterShapeOffset);
   110:     characterController.current.enableAutostep(
   111:       autoStepMaxHeight,
   112:       autoStepMinWidth,
   113:       true,
   114:     );
   115:     characterController.current.setSlideEnabled(true);
   116:     characterController.current.enableSnapToGround(0.1);
   117:     characterController.current.setApplyImpulsesToDynamicBodies(true);
   118: 
   119:     // Stop all animations initially
   120:     Object.values(actions).forEach((action) => action?.stop());
   121: 
   122:     return () => {
   123:       world.removeCharacterController(characterController.current);
   124:       characterController.current = null!;
   125:     };
   126:   }, []);
   127: 
   128:   // Handle shooting animation
   129:   useEffect(() => {
   130:     const handleShoot = () => {
   131:       if (document.pointerLockElement) {
   132:         const fireAction = actions["Rig|Saiga_Fire"];
   133:         if (fireAction) {
   134:           fireAction.setLoop(THREE.LoopOnce, 1);
   135:           fireAction.reset().play();
   136:         }
   137: 
   138:         // // Send projectile data to server
   139:         // if (playerRef.current && playerRef.current.rigidBody && room) {
   140:         //   const position = playerRef.current.rigidBody.translation();
   141:         //   const cameraDirection = new THREE.Vector3();
   142:         //   camera.getWorldDirection(cameraDirection);
   143:         // }
   144:       }
   145:     };
   146: 
   147:     window.addEventListener("pointerdown", handleShoot);
   148:     return () => window.removeEventListener("pointerdown", handleShoot);
   149:   }, [actions, camera, room]);
   150: 
   151:   useBeforePhysicsStep(() => {
   152:     const characterRigidBody = playerRef.current.rigidBody;
   153: 
   154:     if (!characterRigidBody) return;
   155: 
   156:     const characterCollider = characterRigidBody.collider(0);
   157: 
   158:     const { forward, backward, left, right, jump, sprint } =
   159:       getKeyboardControls() as KeyControls;
   160: 
   161:     // Combine keyboard and gamepad input
   162:     const moveForward = forward || gamepadState.leftStick.y < 0;
   163:     const moveBackward = backward || gamepadState.leftStick.y > 0;
   164:     const moveLeft = left || gamepadState.leftStick.x < 0;
   165:     const moveRight = right || gamepadState.leftStick.x > 0;
   166:     const isJumping = jump || gamepadState.buttons.jump;
   167:     const isSprinting = sprint || gamepadState.buttons.leftStickPress;
   168: 
   169:     const speed = walkSpeed * (isSprinting ? runSpeed / walkSpeed : 1);
   170: 
   171:     // Update movement state for animations
   172:     const isMoving = moveForward || moveBackward || moveLeft || moveRight;
   173:     setIsWalking(isMoving && !isSprinting);
   174:     setIsRunning(isMoving && isSprinting);
   175: 
   176:     const grounded = characterController.current.computedGrounded();
   177: 
   178:     // x and z movement
   179:     _frontVector.set(0, 0, Number(moveBackward) - Number(moveForward));
   180:     _sideVector.set(Number(moveLeft) - Number(moveRight), 0, 0);
   181: 
   182:     const cameraWorldDirection = camera.getWorldDirection(
   183:       _cameraWorldDirection,
   184:     );
   185:     const cameraYaw = Math.atan2(
   186:       cameraWorldDirection.x,
   187:       cameraWorldDirection.z,
   188:     );
   189: 
   190:     _direction
   191:       .subVectors(_frontVector, _sideVector)
   192:       .normalize()
   193:       .multiplyScalar(speed);
   194:     _direction.applyAxisAngle(up, cameraYaw).multiplyScalar(-1);
   195: 
   196:     const horizontalVelocitySmoothing =
   197:       velocityXZSmoothing *
   198:       (grounded ? accelerationTimeGrounded : accelerationTimeAirborne);
   199:     const horizontalVelocityLerpFactor =
   200:       1 - Math.pow(horizontalVelocitySmoothing, 0.116);
   201:     horizontalVelocity.current = {
   202:       x: THREE.MathUtils.lerp(
   203:         horizontalVelocity.current.x,
   204:         _direction.x,
   205:         horizontalVelocityLerpFactor,
   206:       ),
   207:       z: THREE.MathUtils.lerp(
   208:         horizontalVelocity.current.z,
   209:         _direction.z,
   210:         horizontalVelocityLerpFactor,
   211:       ),
   212:     };
   213: 
   214:     if (Math.abs(horizontalVelocity.current.x) < velocityXZMin) {
   215:       horizontalVelocity.current.x = 0;
   216:     }
   217:     if (Math.abs(horizontalVelocity.current.z) < velocityXZMin) {
   218:       horizontalVelocity.current.z = 0;
   219:     }
   220: 
   221:     // jumping and gravity
   222:     if (isJumping && grounded) {
   223:       jumping.current = true;
   224:       holdingJump.current = true;
   225:       jumpTime.current = clock.elapsedTime;
   226:       jumpVelocity.current = maxJumpVelocity * (jumpForce / 0.5); // Scale jump velocity based on jumpForce
   227:     }
   228: 
   229:     if (!isJumping && grounded) {
   230:       jumping.current = false;
   231:     }
   232: 
   233:     if (jumping.current && holdingJump.current && !isJumping) {
   234:       if (jumpVelocity.current > minJumpVelocity) {
   235:         jumpVelocity.current = minJumpVelocity;
   236:       }
   237:     }
   238: 
   239:     if (!isJumping && grounded) {
   240:       jumpVelocity.current = 0;
   241:     } else {
   242:       jumpVelocity.current += jumpGravity * 0.116;
   243:     }
   244: 
   245:     holdingJump.current = isJumping;
   246: 
   247:     // compute movement direction
   248:     const movementDirection = {
   249:       x: horizontalVelocity.current.x,
   250:       y: jumpVelocity.current,
   251:       z: horizontalVelocity.current.z,
   252:     };
   253: 
   254:     // compute collider movement and update rigid body
   255:     characterController.current.computeColliderMovement(
   256:       characterCollider,
   257:       movementDirection,
   258:     );
   259: 
   260:     const translation = characterRigidBody.translation();
   261:     const newPosition = _characterTranslation.copy(
   262:       translation as THREE.Vector3,
   263:     );
   264:     const movement = characterController.current.computedMovement();
   265:     newPosition.add(movement);
   266: 
   267:     characterRigidBody.setNextKinematicTranslation(newPosition);
   268:   });
   269: 
   270:   useFrame((_, delta) => {
   271:     const characterRigidBody = playerRef.current.rigidBody;
   272:     if (!characterRigidBody) {
   273:       return;
   274:     }
   275: 
   276:     _characterLinvel.copy(characterRigidBody.linvel() as THREE.Vector3);
   277:     const currentSpeed = _characterLinvel.length();
   278: 
   279:     const { forward, backward, left, right } =
   280:       getKeyboardControls() as KeyControls;
   281:     const isMoving = forward || backward || left || right;
   282:     const isSprinting =
   283:       getKeyboardControls().sprint || gamepadState.buttons.leftStickPress;
   284: 
   285:     const translation = characterRigidBody.translation();
   286:     onMove?.(translation as THREE.Vector3);
   287: 
   288:     // Send position to server
   289:     if (room) {
   290:       room.send("player:move", {
   291:         position: {
   292:           x: translation.x,
   293:           y: translation.y,
   294:           z: translation.z,
   295:         },
   296:         rotation: {
   297:           x: camera.rotation.x,
   298:           y: camera.rotation.y,
   299:           z: camera.rotation.z,
   300:         },
   301:         animation: isMoving ? PlayerAnimation.WALKING : PlayerAnimation.IDLE,
   302:       });
   303:     }
   304: 
   305:     const cameraPosition = _cameraPosition.set(
   306:       translation.x,
   307:       translation.y + 1,
   308:       translation.z,
   309:     );
   310:     const cameraEuler = new THREE.Euler().setFromQuaternion(
   311:       camera.quaternion,
   312:       "YXZ",
   313:     );
   314: 
   315:     // Different sensitivities for horizontal and vertical aiming
   316:     const CAMERA_SENSITIVITY_X = 0.04;
   317:     const CAMERA_SENSITIVITY_Y = 0.03;
   318: 
   319:     // Apply gamepad right stick for camera rotation
   320:     if (
   321:       gamepadState.connected &&
   322:       (Math.abs(gamepadState.rightStick.x) > 0 ||
   323:         Math.abs(gamepadState.rightStick.y) > 0)
   324:     ) {
   325:       // Update Euler angles
   326:       cameraEuler.y -= gamepadState.rightStick.x * CAMERA_SENSITIVITY_X;
   327:       cameraEuler.x = THREE.MathUtils.clamp(
   328:         cameraEuler.x - gamepadState.rightStick.y * CAMERA_SENSITIVITY_Y,
   329:         -Math.PI / 2,
   330:         Math.PI / 2,
   331:       );
   332: 
   333:       // Apply the new rotation while maintaining up vector
   334:       camera.quaternion.setFromEuler(cameraEuler);
   335:     }
   336: 
   337:     camera.position.lerp(cameraPosition, delta * 30);
   338: 
   339:     // FOV change for sprint
   340:     if (camera instanceof THREE.PerspectiveCamera) {
   341:       camera.fov = THREE.MathUtils.lerp(
   342:         camera.fov,
   343:         isSprinting && currentSpeed > 0.1 ? sprintFov : normalFov,
   344:         10 * delta,
   345:       );
   346:       camera.updateProjectionMatrix();
   347:     }
   348:   });
   349: 
   350:   // Handle movement animations
   351:   useEffect(() => {
   352:     const walkAction = actions["Rig|Saiga_Walk"];
   353:     const runAction = actions["Rig|Saiga_Run"];
   354: 
   355:     if (isRunning) {
   356:       walkAction?.stop();
   357:       runAction?.play();
   358:     } else if (isWalking) {
   359:       runAction?.stop();
   360:       walkAction?.play();
   361:     } else {
   362:       walkAction?.stop();
   363:       runAction?.stop();
   364:     }
   365:   }, [isWalking, isRunning, actions]);
   366: 
   367:   return (
   368:     <>
   369:       <Entity isPlayer ref={playerRef}>
   370:         <Component name="rigidBody">
   371:           <RigidBody
   372:             {...props}
   373:             colliders={false}
   374:             mass={1}
   375:             type="kinematicPosition"
   376:             enabledRotations={[false, false, false]}
   377:           >
   378:             <object3D name="player" />
   379:             <CapsuleCollider args={[1, 0.5]} />
   380:           </RigidBody>
   381:         </Component>
   382:       </Entity>
   383:       <primitive
   384:         object={gltf.scene}
   385:         position={[armsPosition.x, armsPosition.y, armsPosition.z]}
   386:         rotation={[0, Math.PI, 0]}
   387:         scale={0.7}
   388:         parent={camera}
   389:       />
   390:     </>
   391:   );
   392: };
   393: 
   394: type KeyControls = {
   395:   forward: boolean;
   396:   backward: boolean;
   397:   left: boolean;
   398:   right: boolean;
   399:   sprint: boolean;
   400:   jump: boolean;
   401: };
   402: 
   403: const controls = [
   404:   { name: "forward", keys: ["ArrowUp", "w", "W"] },
   405:   { name: "backward", keys: ["ArrowDown", "s", "S"] },
   406:   { name: "left", keys: ["ArrowLeft", "a", "A"] },
   407:   { name: "right", keys: ["ArrowRight", "d", "D"] },
   408:   { name: "jump", keys: ["Space"] },
   409:   { name: "sprint", keys: ["Shift"] },
   410: ];
   411: 
   412: export const PlayerControls = ({ children }: PlayerControls) => {
   413:   return (
   414:     <KeyboardControls map={controls}>
   415:       {children}
   416:       <PointerLockControls makeDefault />
   417:     </KeyboardControls>
   418:   );
   419: };
   420: 
   421: // Preload the model to ensure it's cached
   422: useGLTF.preload("/fps.glb");
   423: 
```

## client\tsconfig.json

```json
     1: {
     2:   "files": [],
     3:   "references": [
     4:     { "path": "./tsconfig.app.json" },
     5:     { "path": "./tsconfig.node.json" }
     6:   ]
     7: }
     8: 
```

## client\src\components\canvas.tsx

```tsx
     1: import { Canvas as ThreeCanvas } from "@react-three/fiber";
     2: import { ReactNode } from "react";
     3: 
     4: type CanvasProps = {
     5:   children: ReactNode;
     6: };
     7: 
     8: export function Canvas({ children }: CanvasProps) {
     9:   return (
    10:     <ThreeCanvas
    11:       shadows
    12:       camera={{ position: [0, 0, 5], fov: 90 }}
    13:       gl={{ antialias: true }}
    14:     >
    15:       {children}
    16:     </ThreeCanvas>
    17:   );
    18: }
    19: 
```

## server\package.json

```json
     1: {
     2:   "name": "solar-system-shooter-server",
     3:   "version": "1.0.0",
     4:   "description": "Colyseus server for Solar System Shooter game",
     5:   "main": "lib/index.js",
     6:   "scripts": {
     7:     "start": "ts-node-dev --respawn --transpile-only src/index.ts",
     8:     "build": "tsc",
     9:     "serve": "node lib/index.js"
    10:   },
    11:   "dependencies": {
    12:     "@colyseus/core": "^0.15.0",
    13:     "@colyseus/monitor": "^0.16.6",
    14:     "@colyseus/schema": "^2.0.0",
    15:     "@colyseus/ws-transport": "^0.15.0",
    16:     "cors": "^2.8.5",
    17:     "express": "^4.18.2"
    18:   },
    19:   "devDependencies": {
    20:     "@types/cors": "^2.8.13",
    21:     "@types/express": "^4.17.17",
    22:     "@types/node": "^20.4.5",
    23:     "ts-node": "^10.9.1",
    24:     "ts-node-dev": "^2.0.0",
    25:     "typescript": "^5.1.6"
    26:   }
    27: }
    28: 
```

## client\src\index.css

```css
     1: @tailwind base;
     2: @tailwind components;
     3: @tailwind utilities;
     4: 
     5: html, body, #root {
     6:   margin: 0;
     7:   padding: 0;
     8:   width: 100%;
     9:   height: 100vh;
    10:   overflow: hidden;
    11: }
    12: 
    13: canvas {
    14:   width: 100% !important;
    15:   height: 100vh !important;
    16: }
```

## client\index.html

```html
     1: <!doctype html>
     2: <html lang="en">
     3:   <head>
     4:     <meta charset="UTF-8" />
     5:     <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23646cff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M13 2 3 14h9l-1 8 10-12h-9l1-8z'/%3E%3C/svg%3E" />
     6:     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     7:     <title>FPS Character Controller</title>
     8:   </head>
     9:   <body>
    10:     <div id="root"></div>
    11:     <script type="module" src="/src/main.tsx"></script>
    12:   </body>
    13: </html>
```

## client\src\components\game\sphere-tool.tsx

```tsx
     1: "use client";
     2: 
     3: import * as THREE from "three";
     4: 
     5: import { useEffect, useRef, useState } from "react";
     6: 
     7: import { RigidBody } from "@react-three/rapier";
     8: import { useGamepad } from "../../hooks/use-gamepad";
     9: import { useMultiplayer } from "../../context/MultiplayerContext";
    10: import { useThree } from "@react-three/fiber";
    11: 
    12: const RAINBOW_COLORS = [
    13:   "#FF0000", // Red
    14:   "#FF7F00", // Orange
    15:   "#FFFF00", // Yellow
    16:   "#00FF00", // Green
    17:   "#0000FF", // Blue
    18:   "#4B0082", // Indigo
    19:   "#9400D3", // Violet
    20: ];
    21: 
    22: const SHOOT_FORCE = 45; // Speed factor for projectiles
    23: const SPHERE_OFFSET = {
    24:   x: 0.12, // Slightly to the right
    25:   y: -0.27, // Lower below crosshair
    26:   z: -1.7, // Offset even further back
    27: };
    28: 
    29: type SphereProps = {
    30:   id: string;
    31:   position: [number, number, number];
    32:   direction: [number, number, number];
    33:   color: string;
    34:   radius: number;
    35: };
    36: 
    37: // Sphere with physics
    38: const Sphere = ({ position, direction, color, radius }: SphereProps) => {
    39:   return (
    40:     <RigidBody
    41:       position={position}
    42:       friction={1}
    43:       angularDamping={0.2}
    44:       linearDamping={0.1}
    45:       restitution={0.5}
    46:       colliders="ball"
    47:       mass={1}
    48:       ccd={true}
    49:       linearVelocity={[
    50:         direction[0] * SHOOT_FORCE,
    51:         direction[1] * SHOOT_FORCE,
    52:         direction[2] * SHOOT_FORCE,
    53:       ]}
    54:     >
    55:       <mesh castShadow receiveShadow>
    56:         <sphereGeometry args={[radius, 32, 32]} />
    57:         <meshStandardMaterial color={color} />
    58:       </mesh>
    59:     </RigidBody>
    60:   );
    61: };
    62: 
    63: interface SphereToolProps {
    64:   onAmmoChange?: (ammo: number) => void;
    65:   onReloadingChange?: (isReloading: boolean) => void;
    66:   maxAmmo?: number;
    67: }
    68: 
    69: export const SphereTool = ({
    70:   onAmmoChange,
    71:   onReloadingChange,
    72:   maxAmmo = 50,
    73: }: SphereToolProps) => {
    74:   const sphereRadius = 0.11;
    75: 
    76:   const camera = useThree((s) => s.camera);
    77:   const [spheres, setSpheres] = useState<{ [key: string]: SphereProps }>({});
    78:   const [ammoCount, setAmmoCount] = useState(maxAmmo);
    79:   const [isReloading, setIsReloading] = useState(false);
    80:   const shootingInterval = useRef<number>();
    81:   const isPointerDown = useRef(false);
    82:   const gamepadState = useGamepad();
    83:   const { room, clientId } = useMultiplayer();
    84: 
    85:   // Update parent component with ammo state
    86:   useEffect(() => {
    87:     onAmmoChange?.(ammoCount);
    88:   }, [ammoCount, onAmmoChange]);
    89: 
    90:   // Update parent component with reloading state
    91:   useEffect(() => {
    92:     onReloadingChange?.(isReloading);
    93:   }, [isReloading, onReloadingChange]);
    94: 
    95:   // Listen for all spheres from the server
    96:   useEffect(() => {
    97:     if (!room) return;
    98: 
    99:     const handleStateChange = (state: any) => {
   100:       const updatedSpheres: { [key: string]: SphereProps } = {};
   101: 
   102:       state.projectiles.forEach((projectile: any, id: string) => {
   103:         updatedSpheres[id] = {
   104:           id,
   105:           position: [
   106:             projectile.position.x,
   107:             projectile.position.y,
   108:             projectile.position.z,
   109:           ],
   110:           direction: [
   111:             projectile.direction.x,
   112:             projectile.direction.y,
   113:             projectile.direction.z,
   114:           ],
   115:           color: projectile.color || RAINBOW_COLORS[0],
   116:           radius: sphereRadius,
   117:         };
   118:       });
   119: 
   120:       setSpheres(updatedSpheres);
   121:     };
   122: 
   123:     room.onStateChange(handleStateChange);
   124: 
   125:     // Initial state
   126:     if (room.state) {
   127:       handleStateChange(room.state);
   128:     }
   129: 
   130:     return () => {
   131:       // No cleanup needed as Colyseus handles this
   132:     };
   133:   }, [room]);
   134: 
   135:   // Clean up old spheres
   136:   useEffect(() => {
   137:     const cleanupInterval = setInterval(() => {
   138:       // We rely on the server to clean up old projectiles
   139:       // This is just to ensure our local state stays in sync
   140:     }, 1000);
   141: 
   142:     return () => clearInterval(cleanupInterval);
   143:   }, []);
   144: 
   145:   const reload = () => {
   146:     if (isReloading) return;
   147: 
   148:     setIsReloading(true);
   149:     // Simulate reload time
   150:     setTimeout(() => {
   151:       setAmmoCount(maxAmmo);
   152:       setIsReloading(false);
   153:     }, 1000);
   154:   };
   155: 
   156:   const shootSphere = () => {
   157:     const pointerLocked =
   158:       document.pointerLockElement !== null || gamepadState.connected;
   159:     if (!pointerLocked || isReloading || ammoCount <= 0 || !room) return;
   160: 
   161:     setAmmoCount((prev) => {
   162:       const newCount = prev - 1;
   163:       if (newCount <= 0) {
   164:         reload();
   165:       }
   166:       return newCount;
   167:     });
   168: 
   169:     const direction = camera.getWorldDirection(new THREE.Vector3());
   170: 
   171:     // Create offset vector in camera's local space
   172:     const offset = new THREE.Vector3(
   173:       SPHERE_OFFSET.x,
   174:       SPHERE_OFFSET.y,
   175:       SPHERE_OFFSET.z,
   176:     );
   177:     offset.applyQuaternion(camera.quaternion);
   178: 
   179:     const position = camera.position.clone().add(offset);
   180: 
   181:     // Normalize direction
   182:     direction.normalize();
   183: 
   184:     const randomColor =
   185:       RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
   186: 
   187:     // Send to server for all clients
   188:     room.send("projectile:create", {
   189:       position: {
   190:         x: position.x,
   191:         y: position.y,
   192:         z: position.z,
   193:       },
   194:       direction: {
   195:         x: direction.x,
   196:         y: direction.y,
   197:         z: direction.z,
   198:       },
   199:       color: randomColor,
   200:     });
   201:   };
   202: 
   203:   const startShooting = () => {
   204:     isPointerDown.current = true;
   205:     shootSphere();
   206:     shootingInterval.current = window.setInterval(shootSphere, 80);
   207:   };
   208: 
   209:   const stopShooting = () => {
   210:     isPointerDown.current = false;
   211:     if (shootingInterval.current) {
   212:       clearInterval(shootingInterval.current);
   213:     }
   214:   };
   215: 
   216:   useEffect(() => {
   217:     window.addEventListener("pointerdown", startShooting);
   218:     window.addEventListener("pointerup", stopShooting);
   219: 
   220:     // Handle gamepad shooting
   221:     if (gamepadState.buttons.shoot) {
   222:       if (!isPointerDown.current) {
   223:         startShooting();
   224:       }
   225:     } else if (isPointerDown.current) {
   226:       stopShooting();
   227:     }
   228: 
   229:     return () => {
   230:       window.removeEventListener("pointerdown", startShooting);
   231:       window.removeEventListener("pointerup", stopShooting);
   232:     };
   233:   }, [camera, gamepadState.buttons.shoot]);
   234: 
   235:   return (
   236:     <group>
   237:       {/* Render all spheres */}
   238:       {Object.values(spheres).map((props) => (
   239:         <Sphere key={`sphere-${props.id}`} {...props} />
   240:       ))}
   241:     </group>
   242:   );
   243: };
   244: 
```

## client\tsconfig.node.json

```json
     1: {
     2:   "compilerOptions": {
     3:     "target": "ES2022",
     4:     "lib": ["ES2023"],
     5:     "module": "ESNext",
     6:     "skipLibCheck": true,
     7: 
     8:     /* Bundler mode */
     9:     "moduleResolution": "bundler",
    10:     "allowImportingTsExtensions": true,
    11:     "isolatedModules": true,
    12:     "moduleDetection": "force",
    13:     "noEmit": true
    14:   },
    15:   "include": ["vite.config.ts"]
    16: }
    17: 
```

## client\src\components\crosshair.tsx

```tsx
     1: import React from "react";
     2: 
     3: export function Crosshair() {
     4:   return (
     5:     <>
     6:       <div
     7:         style={{
     8:           position: "absolute",
     9:           top: "50%",
    10:           marginTop: "10px",
    11:           left: "50%",
    12:           transform: "translate(-50%, -50%) rotate(45deg)",
    13:           width: "12px",
    14:           height: "2px",
    15:           background: "rgba(255, 255, 255, 0.5)",
    16:           pointerEvents: "none",
    17:         }}
    18:       />
    19:       <div
    20:         style={{
    21:           position: "absolute",
    22:           top: "50%",
    23:           marginTop: "10px",
    24:           left: "50%",
    25:           transform: "translate(-50%, -50%) rotate(-45deg)",
    26:           width: "12px",
    27:           height: "2px",
    28:           background: "rgba(255, 255, 255, 0.5)",
    29:           pointerEvents: "none",
    30:         }}
    31:       />
    32:     </>
    33:   );
    34: }
    35: 
```

## client\src\components\multiplayer\ConnectionStatus.tsx

```tsx
     1: import React, { useEffect, useState } from "react";
     2: 
     3: import { useMultiplayer } from "../../context/MultiplayerContext";
     4: 
     5: export const ConnectionStatus: React.FC = () => {
     6:   const { connected, room, clientId } = useMultiplayer();
     7:   const [playerCount, setPlayerCount] = useState(0);
     8: 
     9:   useEffect(() => {
    10:     if (room) {
    11:       // Update player count when state changes
    12:       const handleStateChange = (state: any) => {
    13:         setPlayerCount(state.players.size);
    14:       };
    15: 
    16:       room.onStateChange(handleStateChange);
    17: 
    18:       // Initial player count
    19:       if (room.state && room.state.players) {
    20:         setPlayerCount(room.state.players.size);
    21:       }
    22:     }
    23:   }, [room]);
    24: 
    25:   return (
    26:     <div
    27:       style={{
    28:         position: "absolute",
    29:         top: "50px",
    30:         left: "10px",
    31:         background: "rgba(0, 0, 0, 0.5)",
    32:         color: "white",
    33:         padding: "10px",
    34:         borderRadius: "5px",
    35:         fontFamily: "monospace",
    36:         zIndex: 1000,
    37:       }}
    38:     >
    39:       <div>Connection: {connected ? "✅ Connected" : "❌ Disconnected"}</div>
    40:       <div>Room ID: {room?.id || "None"}</div>
    41:       <div>Client ID: {clientId || "None"}</div>
    42:       <div>Players in room: {playerCount}</div>
    43:     </div>
    44:   );
    45: };
    46: 
```

## server\src\index.ts

```typescript
     1: import { Server } from "@colyseus/core";
     2: import { WebSocketTransport } from "@colyseus/ws-transport";
     3: import { monitor } from "@colyseus/monitor";
     4: import cors from "cors";
     5: import express from "express";
     6: import { createServer } from "http";
     7: import path from "path";
     8: import { GameRoom } from "./rooms/GameRoom";
     9: 
    10: const port = Number(process.env.PORT || 3001);
    11: const app = express();
    12: 
    13: // Apply CORS middleware
    14: app.use(cors());
    15: 
    16: // Serve static files from the client's dist directory
    17: app.use(express.static(path.join(__dirname, "../../client/dist")));
    18: 
    19: // Add Colyseus Monitor
    20: app.use("/monitor", monitor());
    21: 
    22: // Create HTTP server
    23: const httpServer = createServer(app);
    24: 
    25: // Create a Colyseus server using the same HTTP server
    26: const server = new Server({
    27:   transport: new WebSocketTransport({
    28:     server: httpServer,
    29:   }),
    30: });
    31: 
    32: // Register the game room
    33: server.define("game_room", GameRoom);
    34: 
    35: // Start the server using the shared HTTP server
    36: httpServer.listen(port, () => {
    37:   console.log(`🚀 Server running on http://localhost:${port}`);
    38: });
    39: 
```

## client\src\main.tsx

```tsx
     1: import { createRoot } from "react-dom/client";
     2: import App from "./App.tsx";
     3: import "./index.css";
     4: 
     5: createRoot(document.getElementById("root")!).render(<App />);
     6: 
```

## client\package.json

```json
     1: {
     2:   "name": "fps-character-controller",
     3:   "private": true,
     4:   "version": "0.0.0",
     5:   "type": "module",
     6:   "scripts": {
     7:     "dev": "vite",
     8:     "build": "tsc && vite build",
     9:     "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    10:     "preview": "vite preview"
    11:   },
    12:   "dependencies": {
    13:     "@dimforge/rapier3d-compat": "^0.11.2",
    14:     "@react-three/drei": "^9.88.0",
    15:     "@react-three/fiber": "^8.14.4",
    16:     "@react-three/postprocessing": "^2.15.1",
    17:     "@react-three/rapier": "^1.1.1",
    18:     "@types/uuid": "^10.0.0",
    19:     "arancini": "^8.0.0",
    20:     "colyseus.js": "^0.15.27",
    21:     "leva": "^0.9.35",
    22:     "lucide-react": "^0.344.0",
    23:     "postprocessing": "^6.33.4",
    24:     "react": "^18.3.1",
    25:     "react-dom": "^18.3.1",
    26:     "three": "^0.157.0",
    27:     "uuid": "^11.1.0"
    28:   },
    29:   "devDependencies": {
    30:     "@eslint/js": "^9.9.1",
    31:     "@types/react": "^18.3.5",
    32:     "@types/react-dom": "^18.3.0",
    33:     "@types/three": "^0.157.2",
    34:     "@vitejs/plugin-react": "^4.3.1",
    35:     "autoprefixer": "^10.4.18",
    36:     "eslint": "^9.9.1",
    37:     "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    38:     "eslint-plugin-react-refresh": "^0.4.11",
    39:     "globals": "^15.9.0",
    40:     "postcss": "^8.4.35",
    41:     "tailwindcss": "^3.4.1",
    42:     "typescript": "^5.5.3",
    43:     "typescript-eslint": "^8.3.0",
    44:     "vite": "^5.4.2"
    45:   }
    46: }
    47: 
```

## client\vite.config.ts

```typescript
     1: import { defineConfig } from "vite";
     2: import react from "@vitejs/plugin-react";
     3: 
     4: // https://vitejs.dev/config/
     5: export default defineConfig({
     6:   plugins: [react()],
     7:   optimizeDeps: {
     8:     exclude: ["lucide-react"],
     9:   },
    10: });
    11: 
```

## client\src\components\game\ecs.ts

```typescript
     1: import { RapierRigidBody } from "@react-three/rapier";
     2: import { World } from "arancini";
     3: import { createReactAPI } from "arancini/react";
     4: import * as THREE from "three";
     5: 
     6: export type EntityType = {
     7:   isPlayer?: true;
     8:   three?: THREE.Object3D;
     9:   rigidBody?: RapierRigidBody;
    10: };
    11: 
    12: export const world = new World<EntityType>();
    13: 
    14: export const playerQuery = world.query((e) => e.has("isPlayer", "rigidBody"));
    15: 
    16: const { Entity, Component } = createReactAPI(world);
    17: 
    18: export { Component, Entity };
    19: 
```

## client\src\components\multiplayer\OtherPlayers.tsx

```tsx
     1: import * as THREE from "three";
     2: 
     3: import React, { useEffect, useState } from "react";
     4: import { useAnimations, useGLTF } from "@react-three/drei";
     5: 
     6: import { useMultiplayer } from "../../context/MultiplayerContext";
     7: 
     8: // Avatar representation of other players
     9: 
    10: const PlayerAvatar = ({
    11:   position,
    12:   rotation,
    13: }: {
    14:   position: THREE.Vector3;
    15:   rotation?: THREE.Vector3;
    16: }) => {
    17:   const { scene, animations } = useGLTF("/avatar.glb");
    18:   const { actions } = useAnimations(animations, scene);
    19: 
    20:   // Use a default if rotation isn't provided
    21:   const r = rotation || new THREE.Vector3(0, 0, 0);
    22: 
    23:   // This is how to get just y correctly
    24:   let correctedY = r.y;
    25:   const threshold = Math.PI / 2;
    26:   if (Math.abs(r.x) > threshold || Math.abs(r.z) > threshold) {
    27:     correctedY = -1 * (Math.PI + r.y);
    28:   }
    29: 
    30:   return (
    31:     <group position={[position.x, position.y, position.z]}>
    32:       <primitive
    33:         object={scene}
    34:         scale={0.7}
    35:         position={[0, -1.6, 0]}
    36:         rotation={[0, correctedY, 0]}
    37:       />
    38:     </group>
    39:   );
    40: };
    41: 
    42: export const OtherPlayers: React.FC = () => {
    43:   const { room, clientId } = useMultiplayer();
    44:   const [players, setPlayers] = useState<{
    45:     [key: string]: {
    46:       position: THREE.Vector3;
    47:       rotation?: THREE.Quaternion;
    48:     };
    49:   }>({});
    50: 
    51:   useEffect(() => {
    52:     if (!room) return;
    53: 
    54:     // Update player positions when state changes
    55:     const handleStateChange = (state: any) => {
    56:       // Update players
    57:       const newPlayers: {
    58:         [key: string]: {
    59:           position: THREE.Vector3;
    60:           rotation?: THREE.Quaternion;
    61:         };
    62:       } = {};
    63: 
    64:       state.players.forEach((player: any, id: string) => {
    65:         // Don't include the current player
    66:         if (id !== clientId) {
    67:           newPlayers[id] = {
    68:             position: new THREE.Vector3(
    69:               player.position.x,
    70:               player.position.y,
    71:               player.position.z,
    72:             ),
    73:             // Add rotation if available
    74:             rotation: player.rotation,
    75:           };
    76:         }
    77:       });
    78: 
    79:       setPlayers(newPlayers);
    80:     };
    81: 
    82:     room.onStateChange(handleStateChange);
    83: 
    84:     // Initial state
    85:     if (room.state) {
    86:       handleStateChange(room.state);
    87:     }
    88: 
    89:     return () => {
    90:       // No cleanup needed as Colyseus handles this
    91:     };
    92:   }, [room, clientId]);
    93: 
    94:   return (
    95:     <>
    96:       {/* Render other players */}
    97:       {Object.entries(players).map(([id, player]) => (
    98:         <PlayerAvatar
    99:           key={`player-${id}`}
   100:           position={player.position}
   101:           rotation={player.rotation}
   102:         />
   103:       ))}
   104:     </>
   105:   );
   106: };
   107: 
   108: // Preload the model to ensure it's cached
   109: useGLTF.preload("/avatar.glb");
   110: 
```

## server\src\rooms\GameRoom.ts

```typescript
     1: import { Room, Client } from "@colyseus/core";
     2: import { GameRoomState, Player, Projectile } from "../schema/GameRoomState";
     3: import {
     4:   PlayerAnimation,
     5:   PlayerInput,
     6:   ProjectileInput,
     7: } from "../../../shared/types";
     8: 
     9: export class GameRoom extends Room<GameRoomState> {
    10:   private projectileIdCounter: number = 0;
    11:   private readonly PROJECTILE_LIFETIME_MS = 10000; // 10 seconds
    12: 
    13:   onCreate() {
    14:     this.setState(new GameRoomState());
    15: 
    16:     // Handle player movement and rotation updates
    17:     this.onMessage("player:move", (client, message: PlayerInput) => {
    18:       const player = this.state.players.get(client.sessionId);
    19:       if (!player) return;
    20: 
    21:       // Update player position
    22:       player.position.x = message.position.x;
    23:       player.position.y = message.position.y;
    24:       player.position.z = message.position.z;
    25: 
    26:       // Update player rotation
    27:       player.rotation.x = message.rotation.x;
    28:       player.rotation.y = message.rotation.y;
    29:       player.rotation.z = message.rotation.z;
    30:       player.rotation.w = message.rotation.w;
    31: 
    32:       // Update animation state
    33:       player.animation = message.animation;
    34:     });
    35: 
    36:     // Handle projectile creation
    37:     this.onMessage(
    38:       "projectile:create",
    39:       (client, message: ProjectileInput & { id?: string }) => {
    40:         // Use provided ID or generate one
    41:         const projectileId =
    42:           message.id || `${client.sessionId}_${this.projectileIdCounter++}`;
    43:         const projectile = new Projectile(projectileId, client.sessionId);
    44: 
    45:         // Set projectile position
    46:         projectile.position.x = message.position.x;
    47:         projectile.position.y = message.position.y;
    48:         projectile.position.z = message.position.z;
    49: 
    50:         // Set projectile direction
    51:         projectile.direction.x = message.direction.x;
    52:         projectile.direction.y = message.direction.y;
    53:         projectile.direction.z = message.direction.z;
    54: 
    55:         // Set projectile color
    56:         projectile.color = message.color;
    57: 
    58:         // Add projectile to state
    59:         this.state.projectiles.set(projectileId, projectile);
    60: 
    61:         // Remove projectile after a certain time
    62:         setTimeout(() => {
    63:           if (this.state.projectiles.has(projectileId)) {
    64:             this.state.projectiles.delete(projectileId);
    65:           }
    66:         }, this.PROJECTILE_LIFETIME_MS);
    67:       },
    68:     );
    69: 
    70:     // Set up a regular cleanup for projectiles
    71:     this.setSimulationInterval(() => this.cleanupProjectiles(), 1000);
    72:   }
    73: 
    74:   onJoin(client: Client) {
    75:     console.log(`Client joined: ${client.sessionId}`);
    76: 
    77:     // Create a new player
    78:     const player = new Player(client.sessionId);
    79: 
    80:     // Set initial position (random position within the arena)
    81:     player.position.x = Math.random() * 40 - 20; // -20 to 20
    82:     player.position.y = 1;
    83:     player.position.z = Math.random() * 40 - 20; // -20 to 20
    84: 
    85:     // Set initial animation
    86:     player.animation = PlayerAnimation.IDLE;
    87: 
    88:     // Add player to the room state
    89:     this.state.players.set(client.sessionId, player);
    90:   }
    91: 
    92:   onLeave(client: Client) {
    93:     console.log(`Client left: ${client.sessionId}`);
    94: 
    95:     // Remove player from the room state
    96:     if (this.state.players.has(client.sessionId)) {
    97:       this.state.players.delete(client.sessionId);
    98:     }
    99: 
   100:     // Clean up any projectiles owned by this player
   101:     this.cleanupPlayerProjectiles(client.sessionId);
   102:   }
   103: 
   104:   private cleanupProjectiles() {
   105:     const now = Date.now();
   106: 
   107:     // Remove projectiles that have exceeded their lifetime
   108:     this.state.projectiles.forEach((projectile, key) => {
   109:       if (now - projectile.timestamp > this.PROJECTILE_LIFETIME_MS) {
   110:         this.state.projectiles.delete(key);
   111:       }
   112:     });
   113:   }
   114: 
   115:   private cleanupPlayerProjectiles(playerId: string) {
   116:     // Remove all projectiles owned by the player who left
   117:     this.state.projectiles.forEach((projectile, key) => {
   118:       if (projectile.ownerId === playerId) {
   119:         this.state.projectiles.delete(key);
   120:       }
   121:     });
   122:   }
   123: }
   124: 
```

## client\src\vite-env.d.ts

```typescript
     1: /// <reference types="vite/client" />
     2: 
```

## client\postcss.config.js

```javascript
     1: export default {
     2:   plugins: {
     3:     tailwindcss: {},
     4:     autoprefixer: {},
     5:   },
     6: };
     7: 
```

## package.json

```json
     1: {
     2:   "name": "solar-system-shooter",
     3:   "version": "1.0.0",
     4:   "description": "Multiplayer FPS game with Colyseus server",
     5:   "private": true,
     6:   "scripts": {
     7:     "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
     8:     "dev": "concurrently \"pnpm run dev:client\" \"pnpm run dev:server\"",
     9:     "dev:client": "cd client && pnpm run dev",
    10:     "dev:server": "cd server && pnpm run start",
    11:     "build": "pnpm run build:client && pnpm run build:server",
    12:     "build:client": "cd client && pnpm run build",
    13:     "build:server": "cd server && pnpm run build",
    14:     "start": "cd server && pnpm run serve",
    15:     "install-all": "pnpm install && cd client && pnpm install && cd ../server && pnpm install"
    16:   },
    17:   "devDependencies": {
    18:     "concurrently": "^8.2.0"
    19:   }
    20: }
    21: 
```

## client\src\context\MultiplayerContext.tsx

```tsx
     1: import { Client, Room } from "colyseus.js";
     2: import React, {
     3:   ReactNode,
     4:   createContext,
     5:   useContext,
     6:   useEffect,
     7:   useState,
     8: } from "react";
     9: 
    10: interface MultiplayerContextType {
    11:   connected: boolean;
    12:   room: Room | null;
    13:   clientId: string;
    14: }
    15: 
    16: const defaultContext: MultiplayerContextType = {
    17:   connected: false,
    18:   room: null,
    19:   clientId: "",
    20: };
    21: 
    22: const MultiplayerContext =
    23:   createContext<MultiplayerContextType>(defaultContext);
    24: 
    25: export const useMultiplayer = () => useContext(MultiplayerContext);
    26: 
    27: interface MultiplayerProviderProps {
    28:   children: ReactNode;
    29: }
    30: 
    31: export const MultiplayerProvider: React.FC<MultiplayerProviderProps> = ({
    32:   children,
    33: }) => {
    34:   const [client] = useState(new Client("ws://localhost:3001"));
    35:   const [room, setRoom] = useState<Room | null>(null);
    36:   const [connected, setConnected] = useState(false);
    37:   const [clientId, setClientId] = useState("");
    38: 
    39:   useEffect(() => {
    40:     const connectToServer = async () => {
    41:       try {
    42:         console.log("Connecting to game server...");
    43:         const joinedRoom = await client.joinOrCreate("game_room");
    44:         console.log("Connected to room:", joinedRoom.id);
    45: 
    46:         setRoom(joinedRoom);
    47:         setConnected(true);
    48:         setClientId(joinedRoom.sessionId);
    49: 
    50:         // Handle disconnection
    51:         joinedRoom.onLeave((code) => {
    52:           console.log("Left room", code);
    53:           setConnected(false);
    54:           setRoom(null);
    55:         });
    56:       } catch (error) {
    57:         console.error("Could not connect to server:", error);
    58:         setConnected(false);
    59:       }
    60:     };
    61: 
    62:     connectToServer();
    63: 
    64:     return () => {
    65:       if (room) {
    66:         room.leave();
    67:       }
    68:     };
    69:   }, [client]);
    70: 
    71:   return (
    72:     <MultiplayerContext.Provider
    73:       value={{
    74:         connected,
    75:         room,
    76:         clientId,
    77:       }}
    78:     >
    79:       {children}
    80:     </MultiplayerContext.Provider>
    81:   );
    82: };
    83: 
```

## client\tailwind.config.js

```javascript
     1: /** @type {import('tailwindcss').Config} */
     2: export default {
     3:   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
     4:   theme: {
     5:     extend: {},
     6:   },
     7:   plugins: [],
     8: };
     9: 
```

## server\src\schema\GameRoomState.ts

```typescript
     1: import { Schema, MapSchema, type } from "@colyseus/schema";
     2: 
     3: class Vector3 extends Schema {
     4:   @type("number") x: number = 0;
     5:   @type("number") y: number = 0;
     6:   @type("number") z: number = 0;
     7: }
     8: 
     9: class Quaternion extends Schema {
    10:   @type("number") x: number = 0;
    11:   @type("number") y: number = 0;
    12:   @type("number") z: number = 0;
    13:   @type("number") w: number = 1;
    14: }
    15: 
    16: export class Player extends Schema {
    17:   @type("string") id: string;
    18:   @type(Vector3) position = new Vector3();
    19:   @type(Quaternion) rotation = new Quaternion();
    20:   @type("string") animation: string = "idle";
    21: 
    22:   constructor(id: string) {
    23:     super();
    24:     this.id = id;
    25:   }
    26: }
    27: 
    28: export class Projectile extends Schema {
    29:   @type("string") id: string;
    30:   @type(Vector3) position = new Vector3();
    31:   @type(Vector3) direction = new Vector3();
    32:   @type("string") color: string;
    33:   @type("string") ownerId: string;
    34:   @type("number") timestamp: number;
    35: 
    36:   constructor(id: string, ownerId: string) {
    37:     super();
    38:     this.id = id;
    39:     this.ownerId = ownerId;
    40:     this.timestamp = Date.now();
    41:   }
    42: }
    43: 
    44: export class GameRoomState extends Schema {
    45:   @type({ map: Player }) players = new MapSchema<Player>();
    46:   @type({ map: Projectile }) projectiles = new MapSchema<Projectile>();
    47: }
    48: 
```

## README.md

```markdown
     1: To install and run:
     2: 
     3: ```
     4: pnpm run install-all
     5: ```
     6: 
     7: ```
     8: pnpm run dev
     9: ```
    10: 
```

## server\tsconfig.json

```json
     1: {
     2:   "compilerOptions": {
     3:     "target": "ES2020",
     4:     "module": "CommonJS",
     5:     "moduleResolution": "node",
     6:     "esModuleInterop": true,
     7:     "strict": true,
     8:     "outDir": "lib",
     9:     "sourceMap": true,
    10:     "declaration": true,
    11:     "experimentalDecorators": true,
    12:     "skipLibCheck": true,
    13:     "forceConsistentCasingInFileNames": true,
    14:     "resolveJsonModule": true,
    15:     "baseUrl": ".",
    16:     "paths": {
    17:       "@shared/*": ["../shared/*"]
    18:     }
    19:   },
    20:   "include": ["src/**/*", "../shared/**/*"],
    21:   "exclude": ["node_modules"]
    22: }
    23: 
```

