import { useEffect, useState } from "react";

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    done: ms === 0,
  };
}

export function Countdown({ target }: { target: Date }) {
  const [t, setT] = useState(() => diff(target));
  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const Box = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center rounded-xl bg-card/95 backdrop-blur px-4 py-3 sm:px-6 sm:py-4 shadow-soft min-w-[68px] sm:min-w-[88px]">
      <span className="text-2xl sm:text-4xl font-bold text-primary tabular-nums">
        {String(v).padStart(2, "0")}
      </span>
      <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mt-1">
        {l}
      </span>
    </div>
  );

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      <Box v={t.d} l="Hari" />
      <Box v={t.h} l="Jam" />
      <Box v={t.m} l="Menit" />
      <Box v={t.s} l="Detik" />
    </div>
  );
}
