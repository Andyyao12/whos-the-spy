"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { GameStatus } from "@/lib/types";

interface Props {
  code: string;
  playerToken: string;
  status: GameStatus;
}

export default function MyWordCard({ code, playerToken, status }: Props) {
  const [word, setWord] = useState("");
  const [visible, setVisible] = useState(false);
  const prevStatus = useRef<GameStatus>(status);

  useEffect(() => {
    // 进入新一局（WAITING/GAME_END -> PLAYING）时重新取词并隐藏
    if (status === "PLAYING" && prevStatus.current !== "PLAYING") {
      setVisible(false);
      api
        .me(code, playerToken)
        .then((res) => setWord(res.word))
        .catch(() => setWord(""));
    }
    prevStatus.current = status;
  }, [status, code, playerToken]);

  useEffect(() => {
    if (status === "PLAYING" && !word) {
      api
        .me(code, playerToken)
        .then((res) => setWord(res.word))
        .catch(() => setWord(""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-slate-500 font-medium">我的牌</p>
      <button
        onClick={() => setVisible((v) => !v)}
        className="w-full aspect-[4/3] rounded-3xl bg-white shadow-lg shadow-cyan-100 border border-cyan-100 flex flex-col items-center justify-center gap-2 select-none"
      >
        {visible && word ? (
          <div className="animate-card-flip flex flex-col items-center gap-2 px-6">
            <span className="text-sm text-slate-400">你的词</span>
            <span className="text-4xl font-bold text-cyan-700 break-all">{word}</span>
            <span className="text-xs text-slate-300 mt-2">再次点击隐藏</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-6xl font-bold text-cyan-200">?</span>
            <span className="text-slate-400">点击查看</span>
          </div>
        )}
      </button>
    </div>
  );
}
