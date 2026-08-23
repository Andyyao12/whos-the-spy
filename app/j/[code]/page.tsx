"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, saveIdentity } from "@/lib/client";
import { cleanRoomCode, isValidRoomCode } from "@/lib/code";

export default function JoinLandingPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = cleanRoomCode(decodeURIComponent(params.code));
    if (!isValidRoomCode(code)) {
      setError("房间不存在或已过期");
      return;
    }
    api
      .joinRoom(code)
      .then((res) => {
        saveIdentity(res.roomCode, {
          playerToken: res.playerToken,
          playerId: res.playerId,
        });
        router.replace(`/room/${res.roomCode}`);
      })
      .catch((e) => {
        setError(e instanceof Error && e.message ? e.message : "房间不存在或已过期");
      });
  }, [params.code, router]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md flex flex-col items-center gap-6 animate-fade-in-up">
        {error ? (
          <>
            <div className="text-5xl">😢</div>
            <p className="text-xl font-semibold text-slate-700">{error}</p>
            <button
              onClick={() => router.replace("/")}
              className="w-full rounded-3xl bg-cyan-600 text-white text-xl font-bold py-4 shadow-lg shadow-cyan-200"
            >
              返回首页
            </button>
          </>
        ) : (
          <>
            <div className="text-5xl animate-bounce">🎉</div>
            <p className="text-xl font-semibold text-slate-700">正在加入房间…</p>
          </>
        )}
      </div>
    </main>
  );
}
