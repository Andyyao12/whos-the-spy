import { getPublicState } from "@/lib/room-store";
import { ok, fail } from "@/lib/api";
import { cleanRoomCode } from "@/lib/code";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code: raw } = await ctx.params;
    const state = await getPublicState(cleanRoomCode(decodeURIComponent(raw)));
    return ok(state);
  } catch (err) {
    return fail(err);
  }
}
