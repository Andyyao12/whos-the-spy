import { getMyWord } from "@/lib/room-store";
import { ok, fail, playerToken } from "@/lib/api";
import { cleanRoomCode } from "@/lib/code";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code: raw } = await ctx.params;
    const data = await getMyWord(cleanRoomCode(decodeURIComponent(raw)), playerToken(req));
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}
