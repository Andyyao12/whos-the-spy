import { createRoom } from "@/lib/room-store";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { room, host } = await createRoom();
    return ok({
      roomCode: room.roomCode,
      hostToken: room.hostToken,
      playerToken: host.token,
      playerId: host.id,
    });
  } catch (err) {
    return fail(err);
  }
}
