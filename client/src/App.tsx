"use client";

import * as THREE from "three";

import {
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import {
  Environment,
  MeshReflectorMaterial,
  PerspectiveCamera,
} from "@react-three/drei";
import { HUD, defaultHUDConfig } from "./components/game/hud";
import { Player, PlayerControls } from "./components/game/player";
import { useRef, useState } from "react";

import { BlendFunction } from "postprocessing";
import { Canvas } from "./components/canvas";
import { MultiplayerProvider } from "./context/MultiplayerContext";
import { OtherPlayers } from "./components/multiplayer/OtherPlayers";
import { SphereTool } from "./components/game/sphere-tool";
import { useLoadingAssets } from "./hooks/use-loading-assets";
import { useTexture } from "@react-three/drei";

const Scene = () => {
  const texture = useTexture("/final-texture.png");
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  // Ground texture (50x50)
  const groundTexture = texture.clone();
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(12, 12); // 12 repeats to match ground size

  // Side walls texture (2x4)
  const sideWallTexture = texture.clone();
  sideWallTexture.wrapS = sideWallTexture.wrapT = THREE.RepeatWrapping;
  sideWallTexture.repeat.set(12, 1); // 12 repeats horizontally to match wall length

  // Front/back walls texture (50x4)
  const frontWallTexture = texture.clone();
  frontWallTexture.wrapS = frontWallTexture.wrapT = THREE.RepeatWrapping;
  frontWallTexture.repeat.set(12, 1); // 12 repeats horizontally to match wall width

  return (
    <RigidBody type="fixed" position={[0, 0, 0]} colliders={false}>
      {/* Ground collider */}
      <CuboidCollider args={[25, 0.1, 25]} position={[0, -0.1, 0]} />

      {/* Wall colliders */}
      <CuboidCollider position={[25, 2, 0]} args={[1, 2, 25]} />
      <CuboidCollider position={[-25, 2, 0]} args={[1, 2, 25]} />
      <CuboidCollider position={[0, 2, 25]} args={[25, 2, 1]} />
      <CuboidCollider position={[0, 2, -25]} args={[25, 2, 1]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          map={groundTexture}
          mirror={0}
          roughness={1}
          depthScale={0}
          minDepthThreshold={0.9}
          maxDepthThreshold={1}
          metalness={0}
        />
      </mesh>

      {/* Border walls */}
      <mesh position={[25, 2, 0]}>
        <boxGeometry args={[2, 4, 50]} />
        <meshStandardMaterial map={sideWallTexture} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-25, 2, 0]}>
        <boxGeometry args={[2, 4, 50]} />
        <meshStandardMaterial map={sideWallTexture} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 2, 25]}>
        <boxGeometry args={[50, 4, 2]} />
        <meshStandardMaterial map={frontWallTexture} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 2, -25]}>
        <boxGeometry args={[50, 4, 2]} />
        <meshStandardMaterial map={frontWallTexture} side={THREE.DoubleSide} />
      </mesh>
    </RigidBody>
  );
};

export function App() {
  const loading = useLoadingAssets();
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);

  // HUD configuration state
  const [hudConfig, setHudConfig] = useState(defaultHUDConfig);

  // Ammo state (moved from SphereTool to App for HUD)
  const [ammoCount, setAmmoCount] = useState(50);
  const [maxAmmo] = useState(50);
  const [isReloading, setIsReloading] = useState(false);

  // Hardcoded character settings (previously from Leva controls)
  const characterSettings = {
    walkSpeed: 0.11,
    runSpeed: 0.15,
    jumpForce: 0.5,
  };

  // Hardcoded environment settings (previously from Leva controls)
  const environmentSettings = {
    // Fog settings
    fogEnabled: true,
    fogColor: "#dbdbdb",
    fogNear: 13,
    fogFar: 95,

    // Lighting settings
    ambientIntensity: 1.3,
    directionalIntensity: 1,
    directionalHeight: 20,
    directionalDistance: 10,

    // Post-processing settings
    enablePostProcessing: true,

    // Vignette settings
    vignetteEnabled: true,
    vignetteOffset: 0.5,
    vignetteDarkness: 0.5,

    // Chromatic aberration settings
    chromaticAberrationEnabled: true,
    chromaticAberrationOffset: 0.0005,

    // Brightness/contrast settings
    brightnessContrastEnabled: true,
    brightness: 0.1,
    contrast: 0.1,

    // Color grading settings
    colorGradingEnabled: true,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.2,
  };

  return (
    <MultiplayerProvider>
      <HUD
        config={hudConfig}
        ammoCount={ammoCount}
        maxAmmo={maxAmmo}
        isReloading={isReloading}
      />

      <Canvas>
        {environmentSettings.fogEnabled && (
          <fog
            attach="fog"
            args={[
              environmentSettings.fogColor,
              environmentSettings.fogNear,
              environmentSettings.fogFar,
            ]}
          />
        )}
        <Environment preset="sunset" background blur={0.8} resolution={256} />

        <ambientLight intensity={environmentSettings.ambientIntensity} />
        <directionalLight
          castShadow
          position={[
            environmentSettings.directionalDistance,
            environmentSettings.directionalHeight,
            environmentSettings.directionalDistance,
          ]}
          ref={directionalLightRef}
          intensity={environmentSettings.directionalIntensity}
          shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-camera-near={1}
          shadow-camera-far={150}
          shadow-bias={-0.0001}
          shadow-normalBias={0.02}
        />

        <Physics
          debug={false}
          paused={loading}
          timeStep={1 / 60}
          interpolate={true}
          gravity={[0, -9.81, 0]}
        >
          <PlayerControls>
            <Player
              position={[0, 7, 10]}
              walkSpeed={characterSettings.walkSpeed}
              runSpeed={characterSettings.runSpeed}
              jumpForce={characterSettings.jumpForce}
              onMove={(position) => {
                if (directionalLightRef.current) {
                  const light = directionalLightRef.current;
                  light.position.x =
                    position.x + environmentSettings.directionalDistance;
                  light.position.z =
                    position.z + environmentSettings.directionalDistance;
                  light.target.position.copy(position);
                  light.target.updateMatrixWorld();
                }
              }}
            />
          </PlayerControls>

          <OtherPlayers />

          <Scene />
          <SphereTool
            onAmmoChange={setAmmoCount}
            onReloadingChange={setIsReloading}
            maxAmmo={maxAmmo}
          />
        </Physics>

        <PerspectiveCamera
          makeDefault
          position={[0, 10, 10]}
          rotation={[0, 0, 0]}
          near={0.1}
          far={1000}
        />

        {environmentSettings.enablePostProcessing && (
          <EffectComposer>
            {environmentSettings.vignetteEnabled && (
              <Vignette
                offset={environmentSettings.vignetteOffset}
                darkness={environmentSettings.vignetteDarkness}
                eskil={false}
              />
            )}
            {environmentSettings.chromaticAberrationEnabled && (
              <ChromaticAberration
                offset={
                  new THREE.Vector2(
                    environmentSettings.chromaticAberrationOffset,
                    environmentSettings.chromaticAberrationOffset,
                  )
                }
                radialModulation={false}
                modulationOffset={0}
              />
            )}
            {environmentSettings.brightnessContrastEnabled && (
              <BrightnessContrast
                brightness={environmentSettings.brightness}
                contrast={environmentSettings.contrast}
              />
            )}
            {environmentSettings.colorGradingEnabled && (
              <ToneMapping
                blendFunction={BlendFunction.NORMAL}
                mode={environmentSettings.toneMapping}
              />
            )}
          </EffectComposer>
        )}
      </Canvas>
    </MultiplayerProvider>
  );
}

export default App;
