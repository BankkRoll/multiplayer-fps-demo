"use client";

import * as THREE from "three";

import {
  Environment,
  MeshReflectorMaterial,
  PerspectiveCamera,
} from "@react-three/drei";
import {
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { HUD } from "./components/game/hud";
import { Player, PlayerControls } from "./components/game/player";

import { useTexture } from "@react-three/drei";
import { BlendFunction } from "postprocessing";
import { Canvas } from "./components/canvas";
import { SettingsMenu } from "./components/game/SettingsMenu";
import { SphereTool } from "./components/game/sphere-tool";
import { OtherPlayers } from "./components/multiplayer/OtherPlayers";
import { MultiplayerProvider } from "./context/MultiplayerContext";
import { SettingsProvider } from "./context/SettingsContext";
import { useLoadingAssets } from "./hooks/use-loading-assets";
import { useSettingsSafe } from "./hooks/use-settings-safe";

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

  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const { settings } = useSettingsSafe();

  useEffect(() => {
    // Update shadow quality based on settings
    if (directionalLightRef.current) {
      const shadowMapSize = getShadowMapSize(settings.graphics.shadowQuality);
      directionalLightRef.current.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    }
  }, [settings.graphics.shadowQuality]);

  // Helper function to get shadow map size based on quality setting
  const getShadowMapSize = (quality: string): number => {
    switch (quality) {
      case 'low': return 1024;
      case 'medium': return 2048;
      case 'high': return 4096;
      default: return 2048;
    }
  };

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

// Component that uses graphics settings
const GameScene = () => {
  const loading = useLoadingAssets();
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const { settings } = useSettingsSafe();

  // Ammo state (moved from SphereTool to App for HUD)
  const [ammoCount, setAmmoCount] = useState(50);
  const [maxAmmo] = useState(50);
  const [isReloading, setIsReloading] = useState(false);

  // Hardcoded character settings for movement
  const characterSettings = {
    walkSpeed: 0.11,
    runSpeed: 0.15,
    jumpForce: 0.5,
  };

  // Calculate fog settings
  const fogSettings = {
    enabled: true,
    color: "#dbdbdb",
    near: 13,
    far: 95,
  };

  // Light settings
  const lightSettings = {
    ambientIntensity: 1.3,
    directionalIntensity: 1,
    directionalHeight: 20,
    directionalDistance: 10,
  };

  // Helper function to get shadow map size based on quality setting
  const getShadowMapSize = (quality: string): number => {
    switch (quality) {
      case 'low': return 1024;
      case 'medium': return 2048;
      case 'high': return 4096;
      default: return 2048;
    }
  };

  useEffect(() => {
    // Update shadow quality based on settings
    if (directionalLightRef.current) {
      const shadowMapSize = getShadowMapSize(settings.graphics.shadowQuality);
      directionalLightRef.current.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    }
  }, [settings.graphics.shadowQuality]);

  return (
    <>
      <HUD
        ammoCount={ammoCount}
        maxAmmo={maxAmmo}
        isReloading={isReloading}
      />

      <SettingsMenu />

      <Canvas>
        {fogSettings.enabled && (
          <fog
            attach="fog"
            args={[
              fogSettings.color,
              fogSettings.near,
              fogSettings.far,
            ]}
          />
        )}
        <Environment preset="sunset" background blur={0.8} resolution={256} />

        <ambientLight intensity={lightSettings.ambientIntensity} />
        <directionalLight
          castShadow
          position={[
            lightSettings.directionalDistance,
            lightSettings.directionalHeight,
            lightSettings.directionalDistance,
          ]}
          ref={directionalLightRef}
          intensity={lightSettings.directionalIntensity}
          shadow-mapSize={[getShadowMapSize(settings.graphics.shadowQuality), getShadowMapSize(settings.graphics.shadowQuality)]}
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
          paused={loading || settings.showSettings}
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
                    position.x + lightSettings.directionalDistance;
                  light.position.z =
                    position.z + lightSettings.directionalDistance;
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
          fov={settings.graphics.fov}
        />

        {settings.graphics.postProcessing && (
          <EffectComposer>
            {settings.graphics.enableVignette && (
              <Vignette
                offset={0.5}
                darkness={0.5}
                eskil={false}
              />
            )}
            {settings.graphics.enableChromaticAberration && (
              <ChromaticAberration
                offset={
                  new THREE.Vector2(
                    0.0005,
                    0.0005,
                  )
                }
                radialModulation={false}
                modulationOffset={0}
              />
            )}
            {settings.graphics.enableBrightnessContrast && (
              <BrightnessContrast
                brightness={0.1}
                contrast={0.1}
              />
            )}
            {settings.graphics.enableToneMapping && (
              <ToneMapping
                blendFunction={BlendFunction.NORMAL}
                mode={THREE.ACESFilmicToneMapping}
              />
            )}
          </EffectComposer>
        )}
      </Canvas>
    </>
  );
};

export function App() {
  return (
    <SettingsProvider>
      <MultiplayerProvider>
        <GameScene />
      </MultiplayerProvider>
    </SettingsProvider>
  );
}

export default App;
