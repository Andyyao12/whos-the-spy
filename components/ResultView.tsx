"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { RoomCtx } from "./RoomCtx";

export default function ResultView({ code, state, identity, isHost, refresh }: RoomCtx) {
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const spies = state.players.filter((p) => p.revealedRole === "SPY");

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <div className="text-center pt-2">
        <div className="text-5xl mb-2">🏁</div>
        <h1 className="text-3xl font-bold text-slate-900">游戏结束</h1>
        {state.winner === "SPIES" && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-1.5">
            <span className="text-lg">🕵️</span>
            <span className="font-bold text-red-600">卧底胜利</span>
          </div>
        )}
        {state.winner === "CIVILIANS" && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-cyan-50 border border-cyan-200 px-4 py-1.5">
            <span className="text-lg">🎉</span>
            <span className="font-bold text-cyan-700">平民胜利</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-cyan-100 p-5 flex flex-col gap-3">
        <p className="font-semibold text-slate-700">卧底</p>
        {spies.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 border border-red-100"
          >
            <span className="text-3xl">{p.avatar}</span>
            <span className="text-lg font-semibold text-slate-800">{p.nickname}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-3xl shadow-sm border border-cyan-100 p-5 flex flex-col items-center gap-1">
          <span className="text-sm text-slate-400">平民词</span>
          <span className="text-xl font-bold text-cyan-700 break-all text-center">
            {state.civilianWord}
          </span>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-cyan-100 p-5 flex flex-col items-center gap-1">
          <span className="text-sm text-slate-400">卧底词</span>
          <span className="text-xl font-bold text-red-500 break-all text-center">
            {state.spyWord}
          </span>
        </div>
      </div>

      <button
        onClick={() => setShowAll((v) => !v)}
        className="w-full rounded-2xl bg-white text-slate-500 font-medium py-3 border border-cyan-100"
      >
        {showAll ? "收起全部身份" : "查看全部身份"}
      </button>

      {showAll && (
        <div className="bg-white rounded-3xl shadow-sm border border-cyan-100 p-5 flex flex-col gap-2">
          {state.players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-2 py-1.5">
              <span className="text-2xl">{p.avatar}</span>
              <span className="flex-1 font-medium text-slate-700">{p.nickname}</span>
              <span
                className={`text-xs font-bold rounded-full px-2.5 py-1 ${
                  p.revealedRole === "SPY"
                    ? "bg-red-500 text-white"
                    : "bg-slate-300 text-white"
                }`}
              >
                {p.revealedRole === "SPY" ? "卧底" : "平民"}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {isHost ? (
        <>
          <button
            onClick={() => run(() => api.restart(code, identity.hostToken!))}
            disabled={busy}
            className="w-full rounded-3xl bg-cyan-600 text-white text-2xl font-bold py-5 shadow-lg shadow-cyan-200 disabled:opacity-50"
          >
            再来一局
          </button>
          <button
            onClick={() => run(() => api.reset(code, identity.hostToken!))}
            disabled={busy}
            className="w-full rounded-2xl bg-white text-cyan-700 font-semibold py-3.5 border border-cyan-100"
          >
            返回房间
          </button>
        </>
      ) : (
        <p className="text-center text-slate-400 py-2">等待房主再来一局…</p>
      )}
    </div>
  );
}
