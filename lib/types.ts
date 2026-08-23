export type GameStatus = "WAITING" | "PLAYING" | "GAME_END";
export type PlayerType = "ONLINE" | "LOCAL";
export type Role = "CIVILIAN" | "SPY";
export type Winner = "CIVILIANS" | "SPIES";

export interface Player {
  id: string;
  token: string;
  displayName: string;
  avatar: string;
  type: PlayerType;
  isHost: boolean;
  role: Role;
  word: string;
  revealed: boolean;
  seat: number;
}

export interface Room {
  roomCode: string;
  hostToken: string;
  status: GameStatus;
  topicCategory: string;
  spyCount: number;
  players: Player[];
  civilianWord: string;
  spyWord: string;
  createdAt: number;
  winner?: Winner;
}

export interface PublicPlayer {
  id: string;
  nickname: string;
  avatar: string;
  type: PlayerType;
  isHost: boolean;
  revealed: boolean;
  revealedRole?: Role;
}

export interface PublicRoomState {
  roomCode: string;
  status: GameStatus;
  topicCategory: string;
  spyCount: number;
  players: PublicPlayer[];
  civilianWord?: string;
  spyWord?: string;
  winner?: Winner;
}
