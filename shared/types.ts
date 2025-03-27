export enum PlayerAnimation {
  IDLE = "Rig|Saiga_Idle",
  WALKING = "Rig|Saiga_Walk",
  RUNNING = "Rig|Saiga_Run",
  FIRING = "Rig|Saiga_Fire",
  RELOADING = "Rig|Saiga_Reload_Full",
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface PlayerInput {
  position: Vector3;
  rotation: Quaternion;
  animation: PlayerAnimation;
}

export interface ProjectileInput {
  position: Vector3;
  direction: Vector3;
  color: string;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface PlayerState {
  id: string;
  position: Vector3;
  rotation: Quaternion;
  animation: PlayerAnimation;
}

export interface ProjectileState {
  id: string;
  position: Vector3;
  direction: Vector3;
  color: string;
  ownerId: string;
  timestamp: number;
}

export interface GameState {
  players: { [key: string]: PlayerState };
  projectiles: { [key: string]: ProjectileState };
}

export interface PlayerInput {
  position: Vector3;
  rotation: Quaternion;
  animation: PlayerAnimation;
}

export interface ProjectileInput {
  position: Vector3;
  direction: Vector3;
  color: string;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface PlayerState {
  id: string;
  position: Vector3;
  rotation: Quaternion;
  animation: PlayerAnimation;
}

export interface ProjectileState {
  id: string;
  position: Vector3;
  direction: Vector3;
  color: string;
  ownerId: string;
  timestamp: number;
}

export interface GameState {
  players: { [key: string]: PlayerState };
  projectiles: { [key: string]: ProjectileState };
}

export interface PlayerInput {
  position: Vector3;
  rotation: Quaternion;
  animation: PlayerAnimation;
}

export interface ProjectileInput {
  position: Vector3;
  direction: Vector3;
  color: string;
}
