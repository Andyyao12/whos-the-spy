"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/client";
import { PublicPlayer } from "@/lib/types";
import { RoomCtx } from "./RoomCtx";
import MyWordCard from "./MyWordCard";

export default function GameView({ code, state, identity, isHost, refresh }: RoomCtx) {
  const [confirmTarget, setConfirmTarget] = useState<PublicPlayer | null>(null);
  const [error, setError] = useState("");
  const [localTarget, setLocalTarget] = useState<PublicPlayer | null>(null);
  const [localWord, setLocalWord] = useState("");
  const lastTap = useRef(0);

  const spiesFound = state.players.filter(
    (p) => p.revealed && p.revealedRole === "SPY"
  ).length;
  const localPlayers = state.players.filter((p) => p.type === "LOCAL");

  function handleCardTap(p: PublicPlayer) {
    if (!isHost || p.revealed) return;
    const now = Date.now();
    if (now - lastTap.current < 350) setConfirmTarget(p);
    lastTap.current = now;
  }

  async function doReveal() {
    if (!confirmTarget) return;
    const target = confirmTarget;
    setConfirmTarget(null);
    setError("");
    try {
      await api.reveal(code, identity.hostToken!, target.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "翻牌失败");
    }
  }

  async function showLocalWord() {
    if (!localTarget) return;
    try {
      const res = await api.localWord(code, identity.hostToken!, localTarget.id);
      setLocalWord(res.word);
    } catch (e) {
      setError(e instanceof Error ? e.message : "获取失败");
      setLocalTarget(null);
    }
  }

  function closeLocalMask() {
    setLocalTarget(null);
    setLocalWord("");
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">谁是卧底</h1>
        <p className="text-slate-400 text-sm mt-1">房间 {code}</p>
        {spiesFound > 0 && spiesFound < state.spyCount && (
          <p className="mt-2 inline-block rounded-full bg-amber-50 text-amber-600 text-sm font-medium px-4 py-1.5 border border-amber-100">
            已找到 {spiesFound} 名卧底，游戏继续
          </p>
        )}
      </div>

      <MyWordCard code={code} playerToken={identity.playerToken} status={state.status} />

      <div className="bg-white rounded-3xl shadow-sm border border-cyan-100 p-5 flex flex-col gap-3">
        <p className="font-semibold text-slate-700">
          玩家卡牌{isHost && <span className="ml-2 text-xs text-slate-400">双击翻身份</span>}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {state.players.map((p) => (
            <button
              key={p.id}
              onClick={() => handleCardTap(p)}
              className={`rounded-2xl py-4 flex flex-col items-center gap-1 border transition-colors select-none ${
                p.revealed
                  ? p.revealedRole === "SPY"
                    ? "bg-red-50 border-red-200"
                    : "bg-slate-100 border-slate-200 opacity-80"
                  : "bg-cyan-50/60 border-cyan-100"
              } ${isHost && !p.revealed ? "cursor-pointer" : "cursor-default"}`}
            >
              <span className="text-3xl">{p.avatar}</span>
              <span className="text-sm font-medium text-slate-700 max-w-full truncate px-1">
                {p.nickname}
              </span>
              {p.revealed && (
                <span
                  className={`text-xs font-bold rounded-full px-2 py-0.5 ${
                    p.revealedRole === "SPY"
                      ? "bg-red-500 text-white"
                      : "bg-slate-400 text-white"
                  }`}
                >
                  {p.revealedRole === "SPY" ? "卧底" : "平民"}
                </span>
              )}
            </button>
          ))}
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </div>

      {isHost && localPlayers.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-cyan-100 p-5 flex flex-col gap-3">
          <p className="font-semibold text-slate-700">线下玩家</p>
          {localPlayers.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-2xl bg-cyan-50/60 px-4 py-3"
            >
              <span className="text-2xl">{p.avatar}</span>
              <span className="flex-1 font-semibold text-slate-800">{p.nickname}</span>
              <button
                onClick={() => setLocalTarget(p)}
                className="rounded-xl bg-cyan-600 text-white font-semibold px-4 py-2"
              >
                查看
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center px-8">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 flex flex-col gap-5 animate-fade-in-up">
            <p className="text-lg font-semibold text-slate-800 text-center">
              翻开“{confirmTarget.nickname}”的身份？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                className="flex-1 rounded-2xl bg-slate-100 text-slate-600 font-semibold py-3.5"
              >
                取消
              </button>
              <button
                onClick={doReveal}
                className="flex-1 rounded-2xl bg-cyan-600 text-white font-bold py-3.5"
              >
                翻牌
              </button>
            </div>
          </div>
        </div>
      )}

      {localTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/90 flex items-center justify-center px-8"
          onClick={localWord ? closeLocalMask : undefined}
        >
          <div className="w-full max-w-sm flex flex-col items-center gap-6">
            {localWord ? (
              <div className="bg-white rounded-3xl w-full p-8 flex flex-col items-center gap-3 animate-card-flip">
                <span className="text-sm text-slate-400">{localTarget.nickname} 的词</span>
                <span className="text-4xl font-bold text-cyan-700 break-all">{localWord}</span>
                <span className="text-xs text-slate-300 mt-3">点击空白处关闭</span>
              </div>
            ) : (
              <>
                <p className="text-white text-xl font-semibold text-center">
                  请把手机交给“{localTarget.nickname}”
                </p>
                <button
                  onClick={showLocalWord}
                  className="w-full rounded-3xl bg-cyan-500 text-white text-xl font-bold py-4"
                >
                  显示词语
                </button>
                <button
                  onClick={closeLocalMask}
                  className="text-slate-400 text-sm underline"
                >
                  取消
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
