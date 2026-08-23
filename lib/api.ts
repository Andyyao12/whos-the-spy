import { NextResponse } from "next/server";
import { RoomError } from "./room-store";

export function ok(data: unknown) {
  return NextResponse.json(data);
}

export function fail(err: unknown) {
  if (err instanceof RoomError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "服务器错误" }, { status: 500 });
}

export function hostToken(req: Request): string | null {
  return req.headers.get("x-host-token");
}

export function playerToken(req: Request): string | null {
  return req.headers.get("x-player-token");
}
