"use client";

import * as THREE from "three";

import { useEffect, useRef, useState } from "react";

import { RigidBody } from "@react-three/rapier";
import { useGamepad } from "../../hooks/use-gamepad";
import { useMultiplayer } from "../../context/MultiplayerContext";
import { useThree } from "@react-three/fiber";

const RAINBOW_COLORS = [
  "#FF0000", // Red
  "#FF7F00", // Orange
  "#FFFF00", // Yellow
  "#00FF00", // Green
  "#0000FF", // Blue
  "#4B0082", // Indigo
  "#9400D3", // Violet
];

const SHOOT_FORCE = 45; // Speed factor for projectiles
const SPHERE_OFFSET = {
  x: 0.12, // Slightly to the right
  y: -0.27, // Lower below crosshair
  z: -1.7, // Offset even further back
};

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
  const { room, clientId } = useMultiplayer();

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

  const reload = () => {
    if (isReloading) return;

    setIsReloading(true);
    // Simulate reload time
    setTimeout(() => {
      setAmmoCount(maxAmmo);
      setIsReloading(false);
    }, 1000);
  };

  const shootSphere = () => {
    const pointerLocked =
      document.pointerLockElement !== null || gamepadState.connected;
    if (!pointerLocked || isReloading || ammoCount <= 0 || !room) return;

    setAmmoCount((prev) => {
      const newCount = prev - 1;
      if (newCount <= 0) {
        reload();
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
    shootingInterval.current = window.setInterval(shootSphere, 80);
  };

  const stopShooting = () => {
    isPointerDown.current = false;
    if (shootingInterval.current) {
      clearInterval(shootingInterval.current);
    }
  };

  useEffect(() => {
    window.addEventListener("pointerdown", startShooting);
    window.addEventListener("pointerup", stopShooting);

    // Handle gamepad shooting
    if (gamepadState.buttons.shoot) {
      if (!isPointerDown.current) {
        startShooting();
      }
    } else if (isPointerDown.current) {
      stopShooting();
    }

    return () => {
      window.removeEventListener("pointerdown", startShooting);
      window.removeEventListener("pointerup", stopShooting);
    };
  }, [camera, gamepadState.buttons.shoot]);

  return (
    <group>
      {/* Render all spheres */}
      {Object.values(spheres).map((props) => (
        <Sphere key={`sphere-${props.id}`} {...props} />
      ))}
    </group>
  );
};
