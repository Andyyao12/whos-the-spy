"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "@/lib/client";
import { TOPICS } from "@/lib/word-bank";
import { PublicPlayer } from "@/lib/types";
import { RoomCtx } from "./RoomCtx";

export default function Lobby({ code, state, identity, isHost, myId, refresh }: RoomCtx) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const joinUrl =
    typeof window !== "undefined" ? `${window.location.origin}/j/${code}` : `/j/${code}`;
  const count = state.players.length;
  const maxSpy = Math.max(1, Math.floor(count / 2));

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

  function copyLink() {
    navigator.clipboard
      .writeText(joinUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => setError("复制失败，请手动复制"));
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title: "谁是卧底", url: joinUrl }).catch(() => {});
    } else {
      copyLink();
    }
  }

  function saveNickname() {
    const name = nameInput.trim();
    setEditingName(false);
    if (!name) return;
    run(() => api.rename(code, identity.playerToken, myId, name));
  }

  function renderPlayer(p: PublicPlayer) {
    const isMe = p.id === myId;
    return (
      <div
        key={p.id}
        className="flex items-center gap-3 rounded-2xl bg-cyan-50/60 px-4 py-3"
      >
        <span className="text-3xl">{p.avatar}</span>
        {isMe && editingName ? (
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={saveNickname}
            onKeyDown={(e) => e.key === "Enter" && saveNickname()}
            maxLength={12}
            className="flex-1 bg-white rounded-xl px-3 py-1.5 text-lg font-semibold text-slate-800 outline-none border-2 border-cyan-400"
          />
        ) : (
          <button
            onClick={() => {
              if (isMe) {
                setNameInput(p.nickname);
                setEditingName(true);
              }
            }}
            className={`flex-1 text-left text-lg font-semibold text-slate-800 ${
              isMe ? "cursor-pointer" : "cursor-default"
            }`}
          >
            {p.nickname}
            {isMe && <span className="ml-2 text-xs text-cyan-500">点按改名</span>}
          </button>
        )}
        {p.isHost && (
          <span className="text-xs font-bold text-white bg-cyan-600 rounded-full px-2.5 py-1">
            房主
          </span>
        )}
        {isHost && p.type === "LOCAL" && (
          <button
            onClick={() => run(() => api.removeLocal(code, identity.hostToken!, p.id))}
            className="text-slate-300 hover:text-red-400 text-xl leading-none px-1"
            aria-label="删除"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <div className="bg-white rounded-3xl shadow-sm border border-cyan-100 p-6 flex flex-col items-center gap-4">
        <p className="text-slate-500">
          房间号 <span className="text-3xl font-bold text-slate-900 tracking-widest">{code}</span>
        </p>
        <div className="bg-white p-3 rounded-2xl border border-cyan-100">
          <QRCodeSVG value={joinUrl} size={180} level="M" />
        </div>
        <p className="text-slate-400 text-sm">让朋友扫码加入</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={copyLink}
            className="flex-1 rounded-2xl bg-cyan-50 text-cyan-700 font-semibold py-3 border border-cyan-100"
          >
            {copied ? "已复制 ✓" : "复制链接"}
          </button>
          <button
            onClick={share}
            className="flex-1 rounded-2xl bg-cyan-50 text-cyan-700 font-semibold py-3 border border-cyan-100"
          >
            分享
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-cyan-100 p-5 flex flex-col gap-3">
        <p className="font-semibold text-slate-700">玩家（{count}）</p>
        {state.players.map(renderPlayer)}
        {isHost && (
          <button
            onClick={() => run(() => api.addLocal(code, identity.hostToken!))}
            disabled={busy}
            className="rounded-2xl border-2 border-dashed border-cyan-300 text-cyan-600 font-semibold py-3 disabled:opacity-50"
          >
            + 添加线下玩家
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-cyan-100 p-5 flex flex-col gap-4">
        <p className="font-semibold text-slate-700">话题</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              disabled={!isHost || busy}
              onClick={() =>
                run(() => api.settings(code, identity.hostToken!, { topicCategory: t.id }))
              }
              className={`shrink-0 rounded-full px-4 py-2 font-medium border transition-colors ${
                state.topicCategory === t.id
                  ? "bg-cyan-600 text-white border-cyan-600"
                  : "bg-white text-slate-600 border-cyan-100"
              } ${!isHost ? "cursor-default opacity-80" : ""}`}
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-700">卧底</p>
          <div className="flex items-center gap-4">
            <button
              disabled={!isHost || busy || state.spyCount <= 1}
              onClick={() =>
                run(() => api.settings(code, identity.hostToken!, { spyCount: state.spyCount - 1 }))
              }
              className="w-11 h-11 rounded-2xl bg-cyan-50 text-cyan-700 text-2xl font-bold border border-cyan-100 disabled:opacity-40"
            >
              −
            </button>
            <span className="text-2xl font-bold text-slate-900 w-6 text-center">
              {state.spyCount}
            </span>
            <button
              disabled={!isHost || busy || state.spyCount >= maxSpy}
              onClick={() =>
                run(() => api.settings(code, identity.hostToken!, { spyCount: state.spyCount + 1 }))
              }
              className="w-11 h-11 rounded-2xl bg-cyan-50 text-cyan-700 text-2xl font-bold border border-cyan-100 disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {isHost ? (
        <button
          onClick={() => run(() => api.start(code, identity.hostToken!))}
          disabled={busy || count < 3}
          className="w-full rounded-3xl bg-cyan-600 text-white text-2xl font-bold py-5 shadow-lg shadow-cyan-200 disabled:opacity-50"
        >
          {count < 3 ? `开始游戏（至少 3 人）` : "开始游戏"}
        </button>
      ) : (
        <p className="text-center text-slate-400 py-3">等待房主开始游戏…</p>
      )}
    </div>
  );
}
