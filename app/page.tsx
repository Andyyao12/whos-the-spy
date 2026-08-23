"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveIdentity, loadIdentity, lastRoom } from "@/lib/client";
import { cleanRoomCode, isValidRoomCode } from "@/lib/code";

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resumeCode, setResumeCode] = useState<string | null>(null);

  useEffect(() => {
    const code = lastRoom();
    if (code && loadIdentity(code)) setResumeCode(code);
  }, []);

  async function handleCreate() {
    setBusy(true);
    setError("");
    try {
      const res = await api.createRoom();
      saveIdentity(res.roomCode, {
        playerToken: res.playerToken,
        playerId: res.playerId,
        hostToken: res.hostToken,
      });
      router.push(`/room/${res.roomCode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败，请重试");
      setBusy(false);
    }
  }

  function handleJoin() {
    const code = cleanRoomCode(joinCode);
    if (!isValidRoomCode(code)) {
      setError("请输入 6 位数字房间码");
      return;
    }
    router.push(`/j/${code}`);
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md flex flex-col items-center gap-8 animate-fade-in-up">
        <div className="text-center">
          <div className="text-6xl mb-4">🕵️</div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-wide">谁是卧底</h1>
          <p className="mt-2 text-lg text-slate-500">和朋友快速开一局</p>
        </div>

        {resumeCode && (
          <button
            onClick={() => router.push(`/room/${resumeCode}`)}
            className="w-full rounded-2xl bg-white border-2 border-cyan-200 text-cyan-700 text-lg font-semibold py-3 shadow-sm"
          >
            回到房间 {resumeCode}
          </button>
        )}

        <button
          onClick={handleCreate}
          disabled={busy}
          className="w-full rounded-3xl bg-cyan-600 text-white text-2xl font-bold py-5 shadow-lg shadow-cyan-200 disabled:opacity-60"
        >
          {busy ? "创建中…" : "创建房间"}
        </button>

        {!showJoin ? (
          <button
            onClick={() => setShowJoin(true)}
            className="w-full rounded-3xl bg-white text-cyan-700 text-xl font-semibold py-4 border border-cyan-100 shadow-sm"
          >
            加入房间
          </button>
        ) : (
          <div className="w-full bg-white rounded-3xl p-5 shadow-sm border border-cyan-100 flex flex-col gap-3">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              inputMode="numeric"
              maxLength={12}
              placeholder="输入 6 位房间码"
              className="w-full text-center text-3xl tracking-[0.4em] font-bold text-slate-800 bg-cyan-50 rounded-2xl py-4 outline-none border-2 border-transparent focus:border-cyan-400"
            />
            <button
              onClick={handleJoin}
              className="w-full rounded-2xl bg-cyan-600 text-white text-xl font-bold py-4"
            >
              加入
            </button>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <p className="text-sm text-slate-400">无需下载 · 手机浏览器直接玩</p>
      </div>
    </main>
  );
}
