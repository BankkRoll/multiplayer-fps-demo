import * as THREE from "three";

import {
  KeyboardControls,
  PointerLockControls,
  useAnimations,
  useGLTF,
  useKeyboardControls,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CapsuleCollider,
  RigidBody,
  RigidBodyProps,
  useBeforePhysicsStep,
  useRapier,
} from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { Component, Entity, EntityType } from "./ecs";

import Rapier from "@dimforge/rapier3d-compat";
import { PlayerAnimation } from "../../../../shared/types";
import { useMultiplayer } from "../../context/MultiplayerContext";
import { useGamepad } from "../../hooks/use-gamepad";
import { useSettingsSafe } from "../../hooks/use-settings-safe";

const _direction = new THREE.Vector3();
const _frontVector = new THREE.Vector3();
const _sideVector = new THREE.Vector3();
const _characterLinvel = new THREE.Vector3();
const _characterTranslation = new THREE.Vector3();
const _cameraWorldDirection = new THREE.Vector3();
const _cameraPosition = new THREE.Vector3();

// Physics constants
const characterShapeOffset = 0.1;
const autoStepMaxHeight = 2;
const autoStepMinWidth = 0.05;
const accelerationTimeAirborne = 0.2;
const accelerationTimeGrounded = 0.025;
const timeToJumpApex = 2;
const maxJumpHeight = 0.5;
const minJumpHeight = 0.2;
const velocityXZSmoothing = 0.1;
const velocityXZMin = 0.0001;
const jumpGravity = -(2 * maxJumpHeight) / Math.pow(timeToJumpApex, 2);
const maxJumpVelocity = Math.abs(jumpGravity) * timeToJumpApex;
const minJumpVelocity = Math.sqrt(2 * Math.abs(jumpGravity) * minJumpHeight);

const up = new THREE.Vector3(0, 1, 0);

export type PlayerControls = {
  children: React.ReactNode;
};

type PlayerProps = RigidBodyProps & {
  onMove?: (position: THREE.Vector3) => void;
  walkSpeed?: number;
  runSpeed?: number;
  jumpForce?: number;
};

export const Player = ({
  onMove,
  walkSpeed = 0.1,
  runSpeed = 0.15,
  jumpForce = 0.5,
  ...props
}: PlayerProps) => {
  const playerRef = useRef<EntityType>(null!);
  const gltf = useGLTF("/fps.glb");
  const { actions } = useAnimations(gltf.animations, gltf.scene);
  const { room } = useMultiplayer();
  const { settings } = useSettingsSafe();

  // Hardcoded arms position (previously from Leva controls)
  const armsPosition = {
    x: 0.1,
    y: -0.62,
    z: -0.2,
  };

  const rapier = useRapier();
  const camera = useThree((state) => state.camera);
  const clock = useThree((state) => state.clock);

  const characterController = useRef<Rapier.KinematicCharacterController>(
    null!,
  );

  const [, getKeyboardControls] = useKeyboardControls();
  const gamepadState = useGamepad();

  const horizontalVelocity = useRef({ x: 0, z: 0 });
  const jumpVelocity = useRef(0);
  const holdingJump = useRef(false);
  const jumpTime = useRef(0);
  const jumping = useRef(false);

  // Animation states
  const [currentAnimation, setCurrentAnimation] = useState<PlayerAnimation>(PlayerAnimation.IDLE);
  const [isWalking, setIsWalking] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  // Safely get keyboard controls
  const getSafeKeyboardControls = () => {
    try {
      return getKeyboardControls() || { 
        forward: false, 
        backward: false, 
        left: false, 
        right: false, 
        jump: false, 
        sprint: false 
      };
    } catch (error) {
      // Return fallback controls if there's an error
      return { 
        forward: false, 
        backward: false, 
        left: false, 
        right: false, 
        jump: false, 
        sprint: false 
      };
    }
  };

  useEffect(() => {
    const { world } = rapier;

    characterController.current =
      world.createCharacterController(characterShapeOffset);
    characterController.current.enableAutostep(
      autoStepMaxHeight,
      autoStepMinWidth,
      true,
    );
    characterController.current.setSlideEnabled(true);
    characterController.current.enableSnapToGround(0.1);
    characterController.current.setApplyImpulsesToDynamicBodies(true);

    // Stop all animations initially
    Object.values(actions).forEach((action) => action?.stop());

    // Start with idle animation
    const idleAction = actions[PlayerAnimation.IDLE];
    if (idleAction) {
      idleAction.reset().play();
    }

    return () => {
      world.removeCharacterController(characterController.current);
      characterController.current = null!;
    };
  }, []);

  // Handle shooting animation
  useEffect(() => {
    const handleShoot = () => {
      // Don't shoot if settings menu is open
      if (document.pointerLockElement && !settings.showSettings) {
        setIsFiring(true);
        const fireAction = actions[PlayerAnimation.FIRING];
        if (fireAction) {
          fireAction.setLoop(THREE.LoopOnce, 1);
          fireAction.reset().play();
          
          // Return to previous animation after fire animation completes
          const duration = fireAction.getClip().duration * 1000;
          setTimeout(() => {
            setIsFiring(false);
          }, duration);
        }
      }
    };

    window.addEventListener("pointerdown", handleShoot);
    return () => window.removeEventListener("pointerdown", handleShoot);
  }, [actions, settings.showSettings]);

  // Handle reload animation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const reloadKey = settings.controls.reload?.keyboard[0] || 'r';
      // Don't reload if settings menu is open
      if (e.key.toLowerCase() === reloadKey.toLowerCase() && document.pointerLockElement && !settings.showSettings) {
        setIsReloading(true);
        const reloadAction = actions[PlayerAnimation.RELOADING];
        if (reloadAction) {
          reloadAction.setLoop(THREE.LoopOnce, 1);
          reloadAction.reset().play();
          
          // Return to previous animation after reload animation completes
          const duration = reloadAction.getClip().duration * 1000;
          setTimeout(() => {
            setIsReloading(false);
          }, duration);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, settings.controls, settings.showSettings]);

  // Handle reload animation with gamepad
  useEffect(() => {
    if (gamepadState.buttons.reload && document.pointerLockElement && !isReloading && !settings.showSettings) {
      setIsReloading(true);
      const reloadAction = actions[PlayerAnimation.RELOADING];
      if (reloadAction) {
        reloadAction.setLoop(THREE.LoopOnce, 1);
        reloadAction.reset().play();
        
        // Return to previous animation after reload animation completes
        const duration = reloadAction.getClip().duration * 1000;
        setTimeout(() => {
          setIsReloading(false);
        }, duration);
      }
    }
  }, [actions, gamepadState.buttons.reload, isReloading, settings.showSettings]);

  useBeforePhysicsStep(() => {
    const characterRigidBody = playerRef.current.rigidBody;

    if (!characterRigidBody) return;

    const characterCollider = characterRigidBody.collider(0);

    // Get key mapping from settings
    const getKeyboardState = (action: string): boolean => {
      const binding = settings.controls[action]?.keyboard || [];
      
      // Early return for special keys like forward, etc.
      const keyboardControls = getSafeKeyboardControls();
      if (Object.hasOwnProperty.call(keyboardControls, action)) {
        return keyboardControls[action as keyof ReturnType<typeof getSafeKeyboardControls>] as boolean;
      }
      
      // Otherwise check if any of the bound keys are pressed
      return binding.some(key => {
        if (key === "Space") return keyboardControls.jump;
        if (key === "Shift") return keyboardControls.sprint;
        // Add other special mappings here
        return false;
      });
    };

    // Combine keyboard and gamepad input
    const moveForward = getKeyboardState("forward") || gamepadState.leftStick.y < 0;
    const moveBackward = getKeyboardState("backward") || gamepadState.leftStick.y > 0;
    const moveLeft = getKeyboardState("left") || gamepadState.leftStick.x < 0;
    const moveRight = getKeyboardState("right") || gamepadState.leftStick.x > 0;
    const isJumping = getKeyboardState("jump") || gamepadState.buttons.jump;
    const isSprinting = getKeyboardState("sprint") || gamepadState.buttons.leftStickPress;

    const speed = walkSpeed * (isSprinting ? runSpeed / walkSpeed : 1);

    // Update movement state for animations
    const isMoving = moveForward || moveBackward || moveLeft || moveRight;
    setIsWalking(isMoving && !isSprinting);
    setIsRunning(isMoving && isSprinting);

    // Update current animation state based on priorities
    if (isReloading) {
      setCurrentAnimation(PlayerAnimation.RELOADING);
    } else if (isFiring) {
      setCurrentAnimation(PlayerAnimation.FIRING);
    } else if (isRunning) {
      setCurrentAnimation(PlayerAnimation.RUNNING);
    } else if (isWalking) {
      setCurrentAnimation(PlayerAnimation.WALKING);
    } else {
      setCurrentAnimation(PlayerAnimation.IDLE);
    }

    const grounded = characterController.current.computedGrounded();

    // x and z movement
    _frontVector.set(0, 0, Number(moveBackward) - Number(moveForward));
    _sideVector.set(Number(moveLeft) - Number(moveRight), 0, 0);

    const cameraWorldDirection = camera.getWorldDirection(
      _cameraWorldDirection,
    );
    const cameraYaw = Math.atan2(
      cameraWorldDirection.x,
      cameraWorldDirection.z,
    );

    _direction
      .subVectors(_frontVector, _sideVector)
      .normalize()
      .multiplyScalar(speed);
    _direction.applyAxisAngle(up, cameraYaw).multiplyScalar(-1);

    const horizontalVelocitySmoothing =
      velocityXZSmoothing *
      (grounded ? accelerationTimeGrounded : accelerationTimeAirborne);
    const horizontalVelocityLerpFactor =
      1 - Math.pow(horizontalVelocitySmoothing, 0.116);
    horizontalVelocity.current = {
      x: THREE.MathUtils.lerp(
        horizontalVelocity.current.x,
        _direction.x,
        horizontalVelocityLerpFactor,
      ),
      z: THREE.MathUtils.lerp(
        horizontalVelocity.current.z,
        _direction.z,
        horizontalVelocityLerpFactor,
      ),
    };

    if (Math.abs(horizontalVelocity.current.x) < velocityXZMin) {
      horizontalVelocity.current.x = 0;
    }
    if (Math.abs(horizontalVelocity.current.z) < velocityXZMin) {
      horizontalVelocity.current.z = 0;
    }

    // jumping and gravity
    if (isJumping && grounded) {
      jumping.current = true;
      holdingJump.current = true;
      jumpTime.current = clock.elapsedTime;
      jumpVelocity.current = maxJumpVelocity * (jumpForce / 0.5); // Scale jump velocity based on jumpForce
    }

    if (!isJumping && grounded) {
      jumping.current = false;
    }

    if (jumping.current && holdingJump.current && !isJumping) {
      if (jumpVelocity.current > minJumpVelocity) {
        jumpVelocity.current = minJumpVelocity;
      }
    }

    if (!isJumping && grounded) {
      jumpVelocity.current = 0;
    } else {
      jumpVelocity.current += jumpGravity * 0.116;
    }

    holdingJump.current = isJumping;

    // compute movement direction
    const movementDirection = {
      x: horizontalVelocity.current.x,
      y: jumpVelocity.current,
      z: horizontalVelocity.current.z,
    };

    // compute collider movement and update rigid body
    characterController.current.computeColliderMovement(
      characterCollider,
      movementDirection,
    );

    const translation = characterRigidBody.translation();
    const newPosition = _characterTranslation.copy(
      translation as THREE.Vector3,
    );
    const movement = characterController.current.computedMovement();
    newPosition.add(movement);

    characterRigidBody.setNextKinematicTranslation(newPosition);
  });

  useFrame((_, delta) => {
    const characterRigidBody = playerRef.current.rigidBody;
    if (!characterRigidBody) {
      return;
    }

    _characterLinvel.copy(characterRigidBody.linvel() as THREE.Vector3);
    const currentSpeed = _characterLinvel.length();

    const { forward, backward, left, right } =
      getSafeKeyboardControls() as KeyControls;
    const isMoving = forward || backward || left || right;
    const isSprinting =
      getSafeKeyboardControls().sprint || gamepadState.buttons.leftStickPress;

    const translation = characterRigidBody.translation();
    onMove?.(translation as THREE.Vector3);

    // Send position to server
    if (room) {
      room.send("player:move", {
        position: {
          x: translation.x,
          y: translation.y,
          z: translation.z,
        },
        rotation: {
          x: camera.rotation.x,
          y: camera.rotation.y,
          z: camera.rotation.z,
        },
        animation: currentAnimation,
      });
    }

    const cameraPosition = _cameraPosition.set(
      translation.x,
      translation.y + 1,
      translation.z,
    );
    const cameraEuler = new THREE.Euler().setFromQuaternion(
      camera.quaternion,
      "YXZ",
    );

    // Get sensitivity with guaranteed defaults from useSettingsSafe
    const mouseSensitivity = settings.player.mouseSensitivity;

    // Apply gamepad right stick for camera rotation
    if (
      gamepadState.connected &&
      (Math.abs(gamepadState.rightStick.x) > 0 ||
        Math.abs(gamepadState.rightStick.y) > 0)
    ) {
      // Apply the stick values directly since sensitivity and inversion are applied in the hook
      cameraEuler.y -= gamepadState.rightStick.x;
      cameraEuler.x = THREE.MathUtils.clamp(
        cameraEuler.x - gamepadState.rightStick.y,
        -Math.PI / 2,
        Math.PI / 2,
      );

      // Apply the new rotation while maintaining up vector
      camera.quaternion.setFromEuler(cameraEuler);
    }

    camera.position.lerp(cameraPosition, delta * 30);

    // FOV change for sprint with fallback
    if (camera instanceof THREE.PerspectiveCamera) {
      const normalFov = settings.graphics.fov;
      const sprintFov = normalFov + 10; // Add 10 degrees for sprint

      camera.fov = THREE.MathUtils.lerp(
        camera.fov,
        isSprinting && currentSpeed > 0.1 ? sprintFov : normalFov,
        10 * delta,
      );
      camera.updateProjectionMatrix();
    }
  });

  // Handle movement animations
  useEffect(() => {
    // Skip animation updates during firing or reloading
    if (isFiring || isReloading) return;
    
    const idleAction = actions[PlayerAnimation.IDLE];
    const walkAction = actions[PlayerAnimation.WALKING];
    const runAction = actions[PlayerAnimation.RUNNING];
    
    // Fade out all animations
    const fadeOutAll = () => {
      if (idleAction && idleAction.isRunning()) idleAction.fadeOut(0.2);
      if (walkAction && walkAction.isRunning()) walkAction.fadeOut(0.2);
      if (runAction && runAction.isRunning()) runAction.fadeOut(0.2);
    };
    
    if (isRunning) {
      fadeOutAll();
      runAction?.reset().fadeIn(0.2).play();
    } else if (isWalking) {
      fadeOutAll();
      walkAction?.reset().fadeIn(0.2).play();
    } else {
      fadeOutAll();
      idleAction?.reset().fadeIn(0.2).play();
    }
  }, [isWalking, isRunning, isFiring, isReloading, actions]);

  return (
    <>
      <Entity isPlayer ref={playerRef}>
        <Component name="rigidBody">
          <RigidBody
            {...props}
            colliders={false}
            mass={1}
            type="kinematicPosition"
            enabledRotations={[false, false, false]}
          >
            <object3D name="player" />
            <CapsuleCollider args={[1, 0.5]} />
          </RigidBody>
        </Component>
      </Entity>
      <primitive
        object={gltf.scene}
        position={[armsPosition.x, armsPosition.y, armsPosition.z]}
        rotation={[0, Math.PI, 0]}
        scale={0.7}
        parent={camera}
      />
    </>
  );
};

type KeyControls = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
};

export const PlayerControls = ({ children }: PlayerControls) => {
  const { settings } = useSettingsSafe();
  
  // Generate controls based on settings
  const controlsFromSettings = [
    { name: "forward", keys: settings?.controls?.forward?.keyboard || ["ArrowUp", "w", "W"] },
    { name: "backward", keys: settings?.controls?.backward?.keyboard || ["ArrowDown", "s", "S"] },
    { name: "left", keys: settings?.controls?.left?.keyboard || ["ArrowLeft", "a", "A"] },
    { name: "right", keys: settings?.controls?.right?.keyboard || ["ArrowRight", "d", "D"] },
    { name: "jump", keys: settings?.controls?.jump?.keyboard || ["Space"] },
    { name: "sprint", keys: settings?.controls?.sprint?.keyboard || ["Shift"] },
  ];
  
  // Always render KeyboardControls for context, but make PointerLock conditional
  return (
    <KeyboardControls map={controlsFromSettings}>
      {children}
      {!settings.showSettings && <PointerLockControls makeDefault />}
    </KeyboardControls>
  );
};

// Preload the model to ensure it's cached
useGLTF.preload("/fps.glb");
