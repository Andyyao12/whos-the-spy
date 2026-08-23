"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearIdentity } from "@/lib/client";

interface Props {
  code: string;
  playerToken: string;
  label?: string;
  message?: string;
}

export default function LeaveRoomButton({
  code,
  playerToken,
  label = "退出房间",
  message = "确定退出房间吗？",
}: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doLeave() {
    setBusy(true);
    try {
      await api.leave(code, playerToken);
    } catch {
      // 后端失败（如房间已解散/身份失效）也照常本地退出，避免卡死
    }
    clearIdentity(code);
    router.replace("/");
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-2xl bg-white text-slate-400 font-medium py-3 border border-cyan-100 hover:text-red-500 hover:border-red-200 transition-colors"
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
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-2xl bg-slate-100 text-slate-600 font-semibold py-3"
              >
                取消
              </button>
              <button
                onClick={doLeave}
                disabled={busy}
                className="flex-1 rounded-2xl bg-red-500 text-white font-bold py-3 shadow-lg shadow-red-200 disabled:opacity-50"
              >
                {busy ? "退出中…" : "退出"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
