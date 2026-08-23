import { renamePlayer } from "@/lib/room-store";
import { ok, fail, playerToken } from "@/lib/api";
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
      playerToken(req),
      playerId,
      typeof body.nickname === "string" ? body.nickname : ""
    );
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
