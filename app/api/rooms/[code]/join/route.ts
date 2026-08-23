import { joinRoom, RoomError } from "@/lib/room-store";
import { ok, fail } from "@/lib/api";
import { cleanRoomCode, isValidRoomCode } from "@/lib/code";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code: raw } = await ctx.params;
    const code = cleanRoomCode(decodeURIComponent(raw));
    if (!isValidRoomCode(code)) throw new RoomError("房间码必须是 6 位数字", 400);
    const { room, player } = await joinRoom(code);
    return ok({
      roomCode: room.roomCode,
      playerToken: player.token,
      playerId: player.id,
      nickname: player.displayName,
      avatar: player.avatar,
    });
  } catch (err) {
    return fail(err);
  }
}
