import { revealPlayer } from "@/lib/room-store";
import { ok, fail, hostToken } from "@/lib/api";
import { cleanRoomCode } from "@/lib/code";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ code: string; playerId: string }> }
) {
  try {
    const { code: raw, playerId } = await ctx.params;
    await revealPlayer(cleanRoomCode(decodeURIComponent(raw)), hostToken(req), playerId);
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
