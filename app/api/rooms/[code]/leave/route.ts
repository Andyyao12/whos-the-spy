import { leaveRoom } from "@/lib/room-store";
import { ok, fail, playerToken } from "@/lib/api";
import { cleanRoomCode } from "@/lib/code";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code: raw } = await ctx.params;
    await leaveRoom(cleanRoomCode(decodeURIComponent(raw)), playerToken(req));
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
