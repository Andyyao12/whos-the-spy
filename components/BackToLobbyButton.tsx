"use client";

import { useState } from "react";
import { api } from "@/lib/client";

interface Props {
  code: string;
  hostToken: string;
  onBack: () => void | Promise<void>;
  label?: string;
  message?: string;
}

export default function BackToLobbyButton({
  code,
  hostToken,
  onBack,
  label = "返回房间",
  message = "返回房间后本局将重新洗牌，房间和玩家都会保留。确定返回吗？",
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function doBack() {
    setBusy(true);
    setError("");
    try {
      await api.reset(code, hostToken);
      setConfirming(false);
      await onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败，请重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-2xl bg-white text-cyan-700 font-semibold py-3 border border-cyan-100 hover:bg-cyan-50 transition-colors"
      >
        {label}
      </button>
      {confirming && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center px-6"
          onClick={() => setConfirming(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 flex flex-col gap-5 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-semibold text-slate-800 text-center">{message}</p>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-2xl bg-slate-100 text-slate-600 font-semibold py-3"
              >
                取消
              </button>
              <button
                onClick={doBack}
                disabled={busy}
                className="flex-1 rounded-2xl bg-cyan-600 text-white font-bold py-3 shadow-lg shadow-cyan-200 disabled:opacity-50"
              >
                {busy ? "返回中…" : "返回房间"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
