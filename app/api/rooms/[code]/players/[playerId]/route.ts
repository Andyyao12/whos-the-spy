import { renamePlayer } from "@/lib/room-store";
import { ok, fail, playerToken, hostToken } from "@/lib/api";
import { cleanRoomCode } from "@/lib/code";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ code: string; playerId: string }> }
) {
  try {
    const { code: raw, playerId } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    await renamePlayer(
      cleanRoomCode(decodeURIComponent(raw)),
      playerToken(req) ?? hostToken(req),
      playerId,
      typeof body.nickname === "string" ? body.nickname : "",
      typeof body.avatar === "string" ? body.avatar : null
    );
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
