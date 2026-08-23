import { restartGame } from "@/lib/room-store";
import { ok, fail, hostToken } from "@/lib/api";
import { cleanRoomCode } from "@/lib/code";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code: raw } = await ctx.params;
    await restartGame(cleanRoomCode(decodeURIComponent(raw)), hostToken(req));
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
