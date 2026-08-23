import { DurableObject } from "cloudflare:workers";
import type { Room, Player, PublicRoomState, PublicPlayer } from "./types";
import { randomRoomCode } from "./code";
import { pickWordPair } from "./word-bank";

const ROOM_TTL_MS = 6 * 60 * 60 * 1000; // 6 小时
const MAX_PLAYERS = 16;
const MIN_PLAYERS = 3;
const AVATARS = ["🐼", "🦊", "🐸", "🐯", "🐵", "🐶", "🐱", "🐰"];
const ROOMS_KEY = "rooms";

export class RoomError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// RPC 返回统一结构，避免 DO 抛错序列化不可控
export type DoResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

function ok<T>(data: T): DoResult<T> {
  return { ok: true, data };
}

function toErr(e: unknown): DoResult<never> {
  if (e instanceof RoomError) return { ok: false, error: e.message, status: e.status };
  console.error(e);
  return { ok: false, error: "服务器错误", status: 500 };
}

function defaultSpyCount(playerCount: number): number {
  if (playerCount <= 6) return 1;
  if (playerCount <= 10) return 2;
  return 3;
}

function nextOnlineName(room: Room): string {
  const used = new Set(
    room.players.filter((p) => p.type === "ONLINE").map((p) => p.displayName)
  );
  let n = 1;
  while (used.has(`玩家${n}`)) n++;
  return `玩家${n}`;
}

function nextLocalName(room: Room): string {
  const used = new Set(
    room.players.filter((p) => p.type === "LOCAL").map((p) => p.displayName)
  );
  let n = 1;
  while (used.has(`线下${n}`)) n++;
  return `线下${n}`;
}

function nextAvatar(room: Room): string {
  const onlineCount = room.players.filter((p) => p.type === "ONLINE").length;
  return AVATARS[onlineCount % AVATARS.length];
}

function makePlayer(partial: Partial<Player> & { displayName: string }): Player {
  return {
    id: crypto.randomUUID(),
    token: crypto.randomUUID(),
    avatar: "👤",
    type: "ONLINE",
    isHost: false,
    role: "CIVILIAN",
    word: "",
    revealed: false,
    seat: 0,
    ...partial,
  };
}

// 白名单过滤：公共状态绝不包含 token / word / 未翻开的 role
function toPublicState(room: Room): PublicRoomState {
  const gameEnd = room.status === "GAME_END";
  const players: PublicPlayer[] = room.players.map((p) => {
    const pp: PublicPlayer = {
      id: p.id,
      nickname: p.displayName,
      avatar: p.avatar,
      type: p.type,
      isHost: p.isHost,
      revealed: p.revealed,
    };
    if (p.revealed || gameEnd) pp.revealedRole = p.role;
    return pp;
  });
  const state: PublicRoomState = {
    roomCode: room.roomCode,
    status: room.status,
    topicCategory: room.topicCategory,
    spyCount: room.spyCount,
    players,
  };
  if (gameEnd) {
    state.civilianWord = room.civilianWord;
    state.spyWord = room.spyWord;
  }
  return state;
}

function dealCards(room: Room) {
  const { civilianWord, spyWord } = pickWordPair(room.topicCategory);
  room.civilianWord = civilianWord;
  room.spyWord = spyWord;
  // Fisher-Yates 洗牌玩家索引，前 spyCount 个为卧底
  const indices = room.players.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const spySet = new Set(indices.slice(0, room.spyCount));
  room.players.forEach((p, i) => {
    p.revealed = false;
    if (spySet.has(i)) {
      p.role = "SPY";
      p.word = spyWord;
    } else {
      p.role = "CIVILIAN";
      p.word = civilianWord;
    }
  });
}

export class PartyRoomDO extends DurableObject<CloudflareEnv> {
  private rooms = new Map<string, Room>();
  private loaded = false;

  private async ensureLoaded() {
    if (this.loaded) return;
    const stored = await this.ctx.storage.get<Array<[string, Room]>>(ROOMS_KEY);
    this.rooms = new Map(stored ?? []);
    this.loaded = true;
  }

  private async save() {
    await this.ctx.storage.put(ROOMS_KEY, [...this.rooms.entries()]);
  }

  private purgeExpired() {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (now - room.createdAt > ROOM_TTL_MS) this.rooms.delete(code);
    }
  }

  private getRoomOrThrow(code: string): Room {
    this.purgeExpired();
    const room = this.rooms.get(code);
    if (!room) throw new RoomError("房间不存在或已过期", 404);
    return room;
  }

  private assertHostOrThrow(room: Room, hostToken: string | null) {
    if (!hostToken || hostToken !== room.hostToken) {
      throw new RoomError("仅房主可执行此操作", 403);
    }
  }

  private findPlayerOrThrow(room: Room, token: string | null): Player {
    const player = room.players.find((p) => p.token === token && token);
    if (!player) throw new RoomError("身份已失效，请重新加入", 401);
    return player;
  }

  async createRoom(): Promise<DoResult<{ room: Room; host: Player }>> {
    try {
      await this.ensureLoaded();
      this.purgeExpired();
      let code = randomRoomCode();
      while (this.rooms.has(code)) code = randomRoomCode();
      const host = makePlayer({
        displayName: "玩家1",
        avatar: AVATARS[0],
        type: "ONLINE",
        isHost: true,
        seat: 0,
      });
      const room: Room = {
        roomCode: code,
        hostToken: crypto.randomUUID(),
        status: "WAITING",
        topicCategory: "mixed",
        spyCount: 1,
        players: [host],
        civilianWord: "",
        spyWord: "",
        createdAt: Date.now(),
      };
      this.rooms.set(code, room);
      await this.save();
      return ok({ room, host });
    } catch (e) {
      return toErr(e);
    }
  }

  async joinRoom(code: string): Promise<DoResult<{ room: Room; player: Player }>> {
    try {
      await this.ensureLoaded();
      const room = this.getRoomOrThrow(code);
      if (room.status !== "WAITING") throw new RoomError("游戏已开始，无法加入", 409);
      if (room.players.length >= MAX_PLAYERS) throw new RoomError("房间已满（16 人）", 409);
      const player = makePlayer({
        displayName: nextOnlineName(room),
        avatar: nextAvatar(room),
        type: "ONLINE",
        seat: room.players.length,
      });
      room.players.push(player);
      room.spyCount = defaultSpyCount(room.players.length);
      await this.save();
      return ok({ room, player });
    } catch (e) {
      return toErr(e);
    }
  }

  async addLocalPlayer(
    code: string,
    hostToken: string | null
  ): Promise<DoResult<Player>> {
    try {
      await this.ensureLoaded();
      const room = this.getRoomOrThrow(code);
      this.assertHostOrThrow(room, hostToken);
      if (room.status !== "WAITING") throw new RoomError("游戏已开始，无法添加", 409);
      if (room.players.length >= MAX_PLAYERS) throw new RoomError("房间已满（16 人）", 409);
      const player = makePlayer({
        displayName: nextLocalName(room),
        avatar: "👤",
        type: "LOCAL",
        seat: room.players.length,
      });
      room.players.push(player);
      room.spyCount = defaultSpyCount(room.players.length);
      await this.save();
      return ok(player);
    } catch (e) {
      return toErr(e);
    }
  }

  async removeLocalPlayer(
    code: string,
    hostToken: string | null,
    playerId: string
  ): Promise<DoResult<null>> {
    try {
      await this.ensureLoaded();
      const room = this.getRoomOrThrow(code);
      this.assertHostOrThrow(room, hostToken);
      if (room.status !== "WAITING") throw new RoomError("游戏已开始，无法删除", 409);
      const idx = room.players.findIndex((p) => p.id === playerId && p.type === "LOCAL");
      if (idx === -1) throw new RoomError("玩家不存在", 404);
      room.players.splice(idx, 1);
      room.spyCount = defaultSpyCount(room.players.length);
      await this.save();
      return ok(null);
    } catch (e) {
      return toErr(e);
    }
  }

  async renamePlayer(
    code: string,
    token: string | null,
    playerId: string,
    name: string
  ): Promise<DoResult<null>> {
    try {
      await this.ensureLoaded();
      const room = this.getRoomOrThrow(code);
      const player = this.findPlayerOrThrow(room, token);
      if (player.id !== playerId) throw new RoomError("只能修改自己的昵称", 403);
      const trimmed = name.trim().slice(0, 12);
      if (trimmed) player.displayName = trimmed;
      await this.save();
      return ok(null);
    } catch (e) {
      return toErr(e);
    }
  }

  async updateSettings(
    code: string,
    hostToken: string | null,
    settings: { topicCategory?: string; spyCount?: number }
  ): Promise<DoResult<null>> {
    try {
      await this.ensureLoaded();
      const room = this.getRoomOrThrow(code);
      this.assertHostOrThrow(room, hostToken);
      if (room.status !== "WAITING") throw new RoomError("游戏已开始，无法修改设置", 409);
      if (settings.topicCategory !== undefined) {
        room.topicCategory = settings.topicCategory;
      }
      if (settings.spyCount !== undefined) {
        const n = Math.floor(settings.spyCount);
        const count = room.players.length;
        if (n < 1 || n >= count || n > Math.floor(count / 2)) {
          throw new RoomError("卧底人数不合法", 400);
        }
        room.spyCount = n;
      }
      await this.save();
      return ok(null);
    } catch (e) {
      return toErr(e);
    }
  }

  async startGame(code: string, hostToken: string | null): Promise<DoResult<null>> {
    try {
      await this.ensureLoaded();
      const room = this.getRoomOrThrow(code);
      this.assertHostOrThrow(room, hostToken);
      if (room.status !== "WAITING") throw new RoomError("当前状态无法开始游戏", 409);
      if (room.players.length < MIN_PLAYERS) {
        throw new RoomError(`至少需要 ${MIN_PLAYERS} 名玩家`, 400);
      }
      dealCards(room);
      room.status = "PLAYING";
      await this.save();
      return ok(null);
    } catch (e) {
      return toErr(e);
    }
  }

  async revealPlayer(
    code: string,
    hostToken: string | null,
    playerId: string
  ): Promise<DoResult<null>> {
    try {
      await this.ensureLoaded();
      const room = this.getRoomOrThrow(code);
      this.assertHostOrThrow(room, hostToken);
      if (room.status !== "PLAYING") throw new RoomError("当前状态无法翻牌", 409);
      const player = room.players.find((p) => p.id === playerId);
      if (!player) throw new RoomError("玩家不存在", 404);
      if (!player.revealed) {
        player.revealed = true;
        const allSpiesRevealed = room.players
          .filter((p) => p.role === "SPY")
          .every((p) => p.revealed);
        if (allSpiesRevealed) room.status = "GAME_END";
        await this.save();
      }
      return ok(null);
    } catch (e) {
      return toErr(e);
    }
  }

  async restartGame(code: string, hostToken: string | null): Promise<DoResult<null>> {
    try {
      await this.ensureLoaded();
      const room = this.getRoomOrThrow(code);
      this.assertHostOrThrow(room, hostToken);
      if (room.status === "WAITING") throw new RoomError("游戏尚未开始", 409);
      dealCards(room);
      room.status = "PLAYING";
      await this.save();
      return ok(null);
    } catch (e) {
      return toErr(e);
    }
  }

  async resetToLobby(code: string, hostToken: string | null): Promise<DoResult<null>> {
    try {
      await this.ensureLoaded();
      const room = this.getRoomOrThrow(code);
      this.assertHostOrThrow(room, hostToken);
      room.status = "WAITING";
      room.civilianWord = "";
      room.spyWord = "";
      room.players.forEach((p) => {
        p.revealed = false;
        p.role = "CIVILIAN";
        p.word = "";
      });
      await this.save();
      return ok(null);
    } catch (e) {
      return toErr(e);
    }
  }

  async getMyWord(
    code: string,
    token: string | null
  ): Promise<DoResult<{ playerId: string; nickname: string; seat: number; word: string }>> {
    try {
      await this.ensureLoaded();
      const room = this.getRoomOrThrow(code);
      const player = this.findPlayerOrThrow(room, token);
      return ok({
        playerId: player.id,
        nickname: player.displayName,
        seat: player.seat,
        word: room.status === "WAITING" ? "" : player.word,
      });
    } catch (e) {
      return toErr(e);
    }
  }

  async getLocalPlayerWord(
    code: string,
    hostToken: string | null,
    playerId: string
  ): Promise<DoResult<{ playerId: string; nickname: string; word: string }>> {
    try {
      await this.ensureLoaded();
      const room = this.getRoomOrThrow(code);
      this.assertHostOrThrow(room, hostToken);
      const player = room.players.find((p) => p.id === playerId && p.type === "LOCAL");
      if (!player) throw new RoomError("玩家不存在", 404);
      return ok({
        playerId: player.id,
        nickname: player.displayName,
        word: player.word,
      });
    } catch (e) {
      return toErr(e);
    }
  }

  async getPublicState(code: string): Promise<DoResult<PublicRoomState>> {
    try {
      await this.ensureLoaded();
      const room = this.getRoomOrThrow(code);
      return ok(toPublicState(room));
    } catch (e) {
      return toErr(e);
    }
  }
}
