"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, loadIdentity, clearIdentity, StoredIdentity } from "@/lib/client";
import { cleanRoomCode } from "@/lib/code";
import { PublicRoomState } from "@/lib/types";
import Lobby from "@/components/Lobby";
import GameView from "@/components/GameView";
import ResultView from "@/components/ResultView";

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = cleanRoomCode(decodeURIComponent(params.code));

  const [identity, setIdentity] = useState<StoredIdentity | null>(null);
  const [state, setState] = useState<PublicRoomState | null>(null);
  const [fatal, setFatal] = useState("");
  const [checked, setChecked] = useState(false);
  const stateRef = useRef<PublicRoomState | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await api.state(code);
      stateRef.current = s;
      setState(s);
    } catch (e) {
      if (e instanceof Error && "status" in e && (e as { status: number }).status === 404) {
        clearIdentity(code);
        setFatal("房间不存在或已过期");
      }
    }
  }, [code]);

  useEffect(() => {
    const id = loadIdentity(code);
    if (!id) {
      router.replace(`/j/${code}`);
      return;
    }
    setIdentity(id);
    setChecked(true);
    refresh();
    const timer = setInterval(refresh, 1000);
    return () => clearInterval(timer);
  }, [code, router, refresh]);

  if (fatal) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <div className="text-5xl">😢</div>
          <p className="text-xl font-semibold text-slate-700">{fatal}</p>
          <button
            onClick={() => router.replace("/")}
            className="w-full rounded-3xl bg-cyan-600 text-white text-xl font-bold py-4 shadow-lg shadow-cyan-200"
          >
            返回首页
          </button>
        </div>
      </main>
    );
  }

  if (!checked || !identity) return null;

  if (!state) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-slate-400 text-lg">加载中…</p>
      </main>
    );
  }

  const me = state.players.find((p) => p.id === identity.playerId);
  if (!me) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <div className="text-5xl">🔒</div>
          <p className="text-xl font-semibold text-slate-700">身份已失效，请重新加入</p>
          <button
            onClick={() => {
              clearIdentity(code);
              router.replace(`/j/${code}`);
            }}
            className="w-full rounded-3xl bg-cyan-600 text-white text-xl font-bold py-4 shadow-lg shadow-cyan-200"
          >
            重新加入
          </button>
        </div>
      </main>
    );
  }

  const isHost = me.isHost && !!identity.hostToken;
  const ctx = { code, state, identity, isHost, refresh };

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-6 pb-10">
      <div className="w-full max-w-md">
        {state.status === "WAITING" && <Lobby {...ctx} myId={me.id} />}
        {state.status === "PLAYING" && <GameView {...ctx} myId={me.id} />}
        {state.status === "GAME_END" && <ResultView {...ctx} myId={me.id} />}
      </div>
    </main>
  );
}
