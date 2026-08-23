import { updateSettings } from "@/lib/room-store";
import { ok, fail, hostToken } from "@/lib/api";
import { cleanRoomCode } from "@/lib/code";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code: raw } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    await updateSettings(cleanRoomCode(decodeURIComponent(raw)), hostToken(req), {
      topicCategory:
        typeof body.topicCategory === "string" ? body.topicCategory : undefined,
      spyCount:
        typeof body.spyCount === "number" ? body.spyCount : undefined,
    });
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
