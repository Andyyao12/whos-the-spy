import { PublicRoomState } from "./types";

export interface StoredIdentity {
  playerToken: string;
  playerId: string;
  hostToken?: string;
}

const KEY = (code: string) => `pg:${code}`;

export function saveIdentity(code: string, identity: StoredIdentity) {
  localStorage.setItem(KEY(code), JSON.stringify(identity));
  localStorage.setItem("pg:lastRoom", code);
}

export function loadIdentity(code: string): StoredIdentity | null {
  try {
    const raw = localStorage.getItem(KEY(code));
    return raw ? (JSON.parse(raw) as StoredIdentity) : null;
  } catch {
    return null;
  }
}

export function clearIdentity(code: string) {
  localStorage.removeItem(KEY(code));
}

export function lastRoom(): string | null {
  return localStorage.getItem("pg:lastRoom");
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; hostToken?: string; playerToken?: string } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (options.hostToken) headers["x-host-token"] = options.hostToken;
  if (options.playerToken) headers["x-player-token"] = options.playerToken;
  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(String(data.error ?? "请求失败"), res.status);
  return data as T;
}

export const api = {
  createRoom: (): Promise<{ roomCode: string; hostToken: string; playerToken: string; playerId: string }> =>
    request<{ roomCode: string; hostToken: string; playerToken: string; playerId: string }>("/api/rooms", { method: "POST" }),
  joinRoom: (code: string): Promise<{ roomCode: string; playerToken: string; playerId: string; nickname: string; avatar: string }> =>
    request<{ roomCode: string; playerToken: string; playerId: string; nickname: string; avatar: string }>(`/api/rooms/${code}/join`, { method: "POST" }),
  state: (code: string): Promise<PublicRoomState> =>
    request<PublicRoomState>(`/api/rooms/${code}/state`),
  me: (code: string, playerToken: string): Promise<{ playerId: string; nickname: string; seat: number; word: string }> =>
    request<{ playerId: string; nickname: string; seat: number; word: string }>(`/api/rooms/${code}/me`, { playerToken }),
  addLocal: (code: string, hostToken: string) =>
    request(`/api/rooms/${code}/local-players`, { method: "POST", hostToken }),
  removeLocal: (code: string, hostToken: string, playerId: string) =>
    request(`/api/rooms/${code}/local-players/${playerId}`, { method: "DELETE", hostToken }),
  localWord: (code: string, hostToken: string, playerId: string): Promise<{ playerId: string; nickname: string; word: string }> =>
    request<{ playerId: string; nickname: string; word: string }>(`/api/rooms/${code}/local-players/${playerId}/word`, { hostToken }),
  start: (code: string, hostToken: string) =>
    request(`/api/rooms/${code}/start`, { method: "POST", hostToken }),
  reveal: (code: string, hostToken: string, playerId: string) =>
    request(`/api/rooms/${code}/reveal/${playerId}`, { method: "POST", hostToken }),
  restart: (code: string, hostToken: string) =>
    request(`/api/rooms/${code}/restart`, { method: "POST", hostToken }),
  reset: (code: string, hostToken: string) =>
    request(`/api/rooms/${code}/reset`, { method: "POST", hostToken }),
  settings: (code: string, hostToken: string, body: { topicCategory?: string; spyCount?: number }) =>
    request(`/api/rooms/${code}/settings`, { method: "POST", hostToken, body }),
  rename: (code: string, playerToken: string, playerId: string, nickname: string, avatar?: string) =>
    request(`/api/rooms/${code}/players/${playerId}`, {
      method: "PATCH",
      playerToken,
      body: { nickname, ...(avatar ? { avatar } : {}) },
    }),
  renameLocal: (code: string, hostToken: string, playerId: string, nickname: string, avatar?: string) =>
    request(`/api/rooms/${code}/players/${playerId}`, {
      method: "PATCH",
      hostToken,
      body: { nickname, ...(avatar ? { avatar } : {}) },
    }),
  leave: (code: string, playerToken: string) =>
    request(`/api/rooms/${code}/leave`, { method: "POST", playerToken }),
};
