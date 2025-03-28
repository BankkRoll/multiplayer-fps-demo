"use client";

import * as THREE from "three";

import { useEffect, useRef, useState } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useMultiplayer } from "../../context/MultiplayerContext";
import { useSettings } from "../../context/SettingsContext";
import { useGamepad } from "../../hooks/use-gamepad";

// Rainbow colors for projectiles
const RAINBOW_COLORS = [
  "#FF0000", // Red
  "#FF7F00", // Orange
  "#FFFF00", // Yellow
  "#00FF00", // Green
  "#0000FF", // Blue
  "#4B0082", // Indigo
  "#9400D3", // Violet
];

// Projectile configuration
const SHOOT_FORCE = 45; // Speed factor for projectiles
const SPHERE_OFFSET = {
  x: 0.12, // Slightly to the right
  y: -0.27, // Lower below crosshair
  z: -1.7, // Offset even further back
};

// Reload settings
const RELOAD_TIME = 3000; // 3 seconds for reload
const RELOAD_SOUND_DELAY = 300; // Delay before playing reload sound

type SphereProps = {
  id: string;
  position: [number, number, number];
  direction: [number, number, number];
  color: string;
  radius: number;
};

// Sphere with physics
const Sphere = ({ position, direction, color, radius }: SphereProps) => {
  return (
    <RigidBody
      position={position}
      friction={1}
      angularDamping={0.2}
      linearDamping={0.1}
      restitution={0.5}
      colliders="ball"
      mass={1}
      ccd={true}
      linearVelocity={[
        direction[0] * SHOOT_FORCE,
        direction[1] * SHOOT_FORCE,
        direction[2] * SHOOT_FORCE,
      ]}
    >
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
};

interface SphereToolProps {
  onAmmoChange?: (ammo: number) => void;
  onReloadingChange?: (isReloading: boolean) => void;
  maxAmmo?: number;
}

export const SphereTool = ({
  onAmmoChange,
  onReloadingChange,
  maxAmmo = 50,
}: SphereToolProps) => {
  const sphereRadius = 0.11;

  const camera = useThree((s) => s.camera);
  const [spheres, setSpheres] = useState<{ [key: string]: SphereProps }>({});
  const [ammoCount, setAmmoCount] = useState(maxAmmo);
  const [isReloading, setIsReloading] = useState(false);
  const shootingInterval = useRef<number>();
  const isPointerDown = useRef(false);
  const gamepadState = useGamepad();
  const { settings } = useSettings();
  const { room, clientId } = useMultiplayer();

  // Refs for handling reload animation
  const reloadTimeoutRef = useRef<number>();
  const lastShootTime = useRef(0);
  const canShoot = useRef(true);

  // Check if we should reload automatically on empty
  const shouldAutoReload = true; // Could be added to settings

  // Update parent component with ammo state
  useEffect(() => {
    onAmmoChange?.(ammoCount);
  }, [ammoCount, onAmmoChange]);

  // Update parent component with reloading state
  useEffect(() => {
    onReloadingChange?.(isReloading);
  }, [isReloading, onReloadingChange]);

  // Listen for all spheres from the server
  useEffect(() => {
    if (!room) return;

    const handleStateChange = (state: any) => {
      const updatedSpheres: { [key: string]: SphereProps } = {};

      state.projectiles.forEach((projectile: any, id: string) => {
        updatedSpheres[id] = {
          id,
          position: [
            projectile.position.x,
            projectile.position.y,
            projectile.position.z,
          ],
          direction: [
            projectile.direction.x,
            projectile.direction.y,
            projectile.direction.z,
          ],
          color: projectile.color || RAINBOW_COLORS[0],
          radius: sphereRadius,
        };
      });

      setSpheres(updatedSpheres);
    };

    room.onStateChange(handleStateChange);

    // Initial state
    if (room.state) {
      handleStateChange(room.state);
    }

    return () => {
      // No cleanup needed as Colyseus handles this
    };
  }, [room]);

  // Clean up old spheres
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // We rely on the server to clean up old projectiles
      // This is just to ensure our local state stays in sync
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Handle reload key press or gamepad button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if reload key is pressed (default is 'r')
      const reloadKey = settings.controls.reload?.keyboard[0] || 'r';
      if (e.key.toLowerCase() === reloadKey.toLowerCase()) {
        reload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.controls]);

  // Handle reload with gamepad
  useEffect(() => {
    if (gamepadState.buttons.reload) {
      reload();
    }
  }, [gamepadState.buttons.reload]);

  const reload = () => {
    if (isReloading || ammoCount >= maxAmmo) return;

    setIsReloading(true);
    
    // Clear any existing timeout
    if (reloadTimeoutRef.current) {
      window.clearTimeout(reloadTimeoutRef.current);
    }

    // Play reload sound after a small delay
    setTimeout(() => {
      // TODO: Play reload sound
      console.log("Playing reload sound");
    }, RELOAD_SOUND_DELAY);

    // Simulate reload time
    reloadTimeoutRef.current = window.setTimeout(() => {
      setAmmoCount(maxAmmo);
      setIsReloading(false);
      canShoot.current = true;
      reloadTimeoutRef.current = undefined;
    }, RELOAD_TIME);
  };

  const shootSphere = () => {
    const pointerLocked =
      document.pointerLockElement !== null || gamepadState.connected;
    
    // Check if we can shoot (not reloading, have ammo, room exists)
    if (!pointerLocked || isReloading || ammoCount <= 0 || !room || !canShoot.current) return;

    // Rate limiting
    const now = performance.now();
    if (now - lastShootTime.current < 80) return; // 80ms between shots
    lastShootTime.current = now;

    setAmmoCount((prev) => {
      const newCount = prev - 1;
      
      // Auto reload when out of ammo
      if (newCount <= 0 && shouldAutoReload) {
        canShoot.current = false;
        setTimeout(() => reload(), 100);
      }
      
      return newCount;
    });

    const direction = camera.getWorldDirection(new THREE.Vector3());

    // Create offset vector in camera's local space
    const offset = new THREE.Vector3(
      SPHERE_OFFSET.x,
      SPHERE_OFFSET.y,
      SPHERE_OFFSET.z,
    );
    offset.applyQuaternion(camera.quaternion);

    const position = camera.position.clone().add(offset);

    // Normalize direction
    direction.normalize();

    const randomColor =
      RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];

    // Send to server for all clients
    room.send("projectile:create", {
      position: {
        x: position.x,
        y: position.y,
        z: position.z,
      },
      direction: {
        x: direction.x,
        y: direction.y,
        z: direction.z,
      },
      color: randomColor,
    });
  };

  const startShooting = () => {
    isPointerDown.current = true;
    shootSphere();
  };

  const stopShooting = () => {
    isPointerDown.current = false;
    if (shootingInterval.current) {
      clearInterval(shootingInterval.current);
    }
  };

  // Handle mouse shooting
  useEffect(() => {
    const handlePointerDown = () => {
      if (document.pointerLockElement) {
        startShooting();
      }
    };

    const handlePointerUp = () => {
      stopShooting();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  // Handle continuous shooting
  useFrame(() => {
    // Handle gamepad shooting
    if (gamepadState.buttons.shoot) {
      shootSphere();
    }

    // Handle mouse continuous shooting
    if (isPointerDown.current) {
      shootSphere();
    }
  });

  return (
    <group>
      {/* Render all spheres */}
      {Object.values(spheres).map((props) => (
        <Sphere key={`sphere-${props.id}`} {...props} />
      ))}
    </group>
  );
};
