"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "@/lib/client";
import { TOPICS } from "@/lib/word-bank";
import { AVATARS } from "@/lib/avatars";
import { PublicPlayer } from "@/lib/types";
import { RoomCtx } from "./RoomCtx";
import LeaveRoomButton from "./LeaveRoomButton";

export default function Lobby({ code, state, identity, isHost, myId, refresh }: RoomCtx) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<PublicPlayer | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [avatarSel, setAvatarSel] = useState("");

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

  function legacyCopy(text: string) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }

  function copyLink() {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    const fail = () => setError("复制失败，请手动复制");

    // Clipboard API 仅在安全上下文且非受限 iframe 中可用，需判空
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(joinUrl)
        .then(done)
        .catch(() => (legacyCopy(joinUrl) ? done() : fail()));
    } else {
      try {
        if (legacyCopy(joinUrl)) done();
        else fail();
      } catch {
        fail();
      }
    }
  }

  function share() {
    if (navigator.share) {
      navigator.share({
        title: "谁是卧底",
        text: `来和我一起玩"谁是卧底"，房间号 ${code}`,
        url: joinUrl,
      }).catch((e) => {
        // 用户主动取消（AbortError）不处理，其余情况降级为复制链接
        if (e?.name !== "AbortError") copyLink();
      });
    } else {
      copyLink();
    }
  }

  function openEditor(p: PublicPlayer) {
    setNameInput(p.nickname);
    setAvatarSel(p.avatar);
    setEditing(p);
  }

  function saveProfile() {
    if (!editing) return;
    const name = nameInput.trim();
    if (!name && avatarSel === editing.avatar) {
      setEditing(null);
      return;
    }
    const finalName = name || editing.nickname;
    const isSelf = editing.id === myId;
    setEditing(null);
    if (isSelf) {
      run(() => api.rename(code, identity.playerToken, myId, finalName, avatarSel));
    } else {
      run(() => api.renameLocal(code, identity.hostToken!, editing.id, finalName, avatarSel));
    }
  }

  function renderPlayer(p: PublicPlayer) {
    const isMe = p.id === myId;
    const editable = isMe || (isHost && p.type === "LOCAL");
    return (
      <div
        key={p.id}
        className="flex items-center gap-3 rounded-2xl bg-cyan-50/60 px-4 py-3"
      >
        <button
          onClick={() => editable && openEditor(p)}
          disabled={!editable}
          className="flex items-center gap-3 flex-1 text-left disabled:cursor-default"
        >
          <span className="text-3xl">{p.avatar}</span>
          <span className="flex-1 text-lg font-semibold text-slate-800">
            {p.nickname}
            {editable && (
              <span
                className={`ml-2 text-xs font-normal ${
                  p.type === "LOCAL" ? "text-amber-500" : "text-cyan-500"
                }`}
              >
                点按编辑
              </span>
            )}
          </span>
        </button>
        {p.type === "LOCAL" && (
          <span className="text-xs font-bold text-white bg-amber-500 rounded-full px-2.5 py-1">
            线下
          </span>
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

      {editing && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center px-6"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 flex flex-col gap-5 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-semibold text-slate-800 text-center">
              {editing.id === myId ? "编辑资料" : "编辑线下玩家"}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-5xl shrink-0">{avatarSel || "👤"}</span>
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveProfile()}
                maxLength={12}
                placeholder="昵称"
                className="flex-1 bg-cyan-50 rounded-xl px-4 py-2.5 text-lg font-semibold text-slate-800 outline-none border-2 border-cyan-400 focus:border-cyan-500"
              />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-2">选择头像</p>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatarSel(a)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-2xl border-2 transition-colors ${
                      avatarSel === a
                        ? "bg-cyan-100 border-cyan-400"
                        : "bg-cyan-50/40 border-transparent hover:border-cyan-200"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 rounded-2xl bg-slate-100 text-slate-600 font-semibold py-3"
              >
                取消
              </button>
              <button
                onClick={saveProfile}
                disabled={busy}
                className="flex-1 rounded-2xl bg-cyan-600 text-white font-semibold py-3 shadow-lg shadow-cyan-200 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

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

      <LeaveRoomButton
        code={code}
        playerToken={identity.playerToken}
        message={
          isHost
            ? "你是房主，退出将解散房间，所有玩家会被移出。确定退出吗？"
            : "确定退出房间吗？"
        }
      />
    </div>
  );
}
