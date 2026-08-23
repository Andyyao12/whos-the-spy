import { removeLocalPlayer } from "@/lib/room-store";
import { ok, fail, hostToken } from "@/lib/api";
import { cleanRoomCode } from "@/lib/code";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ code: string; playerId: string }> }
) {
  try {
    const { code: raw, playerId } = await ctx.params;
    await removeLocalPlayer(cleanRoomCode(decodeURIComponent(raw)), hostToken(req), playerId);
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
