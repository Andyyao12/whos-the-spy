import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { PublicRoomState, Room, Player } from "./types";
import type { DoResult, PartyRoomDO } from "../durable-objects/party-room";
import { RoomError } from "./room-error";

export { RoomError } from "./room-error";

const ROOMS_DO_ID = "whos-the-spy-rooms";

async function callDo<T>(
  invoke: (stub: DurableObjectStub<PartyRoomDO>) => Promise<DoResult<T>>
): Promise<T> {
  const { env } = getCloudflareContext();
  const id = env.PARTY_ROOM.idFromName(ROOMS_DO_ID);
  const stub = env.PARTY_ROOM.get(id);
  const res = await invoke(stub);
  if (!res.ok) throw new RoomError(res.error, res.status);
  return res.data;
}

export async function createRoom(): Promise<{ room: Room; host: Player }> {
  return callDo((stub) => stub.createRoom());
}

export async function joinRoom(code: string): Promise<{ room: Room; player: Player }> {
  return callDo((stub) => stub.joinRoom(code));
}

export async function addLocalPlayer(code: string, hostToken: string | null): Promise<Player> {
  return callDo((stub) => stub.addLocalPlayer(code, hostToken));
}

export async function removeLocalPlayer(
  code: string,
  hostToken: string | null,
  playerId: string
): Promise<void> {
  await callDo((stub) => stub.removeLocalPlayer(code, hostToken, playerId));
}

export async function renamePlayer(
  code: string,
  token: string | null,
  playerId: string,
  name: string,
  avatar?: string | null
): Promise<void> {
  await callDo((stub) => stub.renamePlayer(code, token, playerId, name, avatar ?? null));
}

export async function leaveRoom(code: string, token: string | null): Promise<void> {
  await callDo((stub) => stub.leaveRoom(code, token));
}

export async function updateSettings(
  code: string,
  hostToken: string | null,
  settings: { topicCategory?: string; spyCount?: number }
): Promise<void> {
  await callDo((stub) => stub.updateSettings(code, hostToken, settings));
}

export async function startGame(code: string, hostToken: string | null): Promise<void> {
  await callDo((stub) => stub.startGame(code, hostToken));
}

export async function revealPlayer(
  code: string,
  hostToken: string | null,
  playerId: string
): Promise<void> {
  await callDo((stub) => stub.revealPlayer(code, hostToken, playerId));
}

export async function restartGame(code: string, hostToken: string | null): Promise<void> {
  await callDo((stub) => stub.restartGame(code, hostToken));
}

export async function resetToLobby(code: string, hostToken: string | null): Promise<void> {
  await callDo((stub) => stub.resetToLobby(code, hostToken));
}

export async function getMyWord(
  code: string,
  token: string | null
): Promise<{ playerId: string; nickname: string; seat: number; word: string }> {
  return callDo((stub) => stub.getMyWord(code, token));
}

export async function getLocalPlayerWord(
  code: string,
  hostToken: string | null,
  playerId: string
): Promise<{ playerId: string; nickname: string; word: string }> {
  return callDo((stub) => stub.getLocalPlayerWord(code, hostToken, playerId));
}

export async function getPublicState(code: string): Promise<PublicRoomState> {
  return callDo((stub) => stub.getPublicState(code));
}
