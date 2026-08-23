import { getLocalPlayerWord } from "@/lib/room-store";
import { ok, fail, hostToken } from "@/lib/api";
import { cleanRoomCode } from "@/lib/code";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ code: string; playerId: string }> }
) {
  try {
    const { code: raw, playerId } = await ctx.params;
    const data = await getLocalPlayerWord(
      cleanRoomCode(decodeURIComponent(raw)),
      hostToken(req),
      playerId
    );
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}
