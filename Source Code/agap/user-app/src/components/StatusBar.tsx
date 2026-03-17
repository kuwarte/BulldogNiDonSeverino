"use client";

import React, { useState, useEffect } from "react";

export default function StatusBar() {
  const [time, setTime] = useState("09:41");

  // Keep the clock ticking in real-time
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="absolute top-0 left-0 right-0 w-full h-9 flex items-center justify-between px-5 
                    bg-white/90 backdrop-blur-md border-b border-zinc-200 text-[13px] font-semibold text-zinc-900 z-40 rounded-t-[40px]"
    >
      {/* Dynamic Time */}
      <span className="tracking-tight">{time}</span>

      <div className="flex items-center gap-2.5">
        {/* Signal Bars */}
        <svg
          width="18"
          height="12"
          viewBox="0 0 20 12"
          className="fill-current text-zinc-600"
        >
          <rect x="0" y="7" width="3" height="5" rx="1.5" />
          <rect x="4.5" y="5" width="3" height="7" rx="1.5" />
          <rect x="9" y="3" width="3" height="9" rx="1.5" />
          <rect
            x="13.5"
            y="1"
            width="3"
            height="11"
            rx="1.5"
            className="opacity-40"
          />
          <rect
            x="18"
            y="0"
            width="3"
            height="12"
            rx="1.5"
            className="opacity-40"
          />
        </svg>

        {/* WiFi - using stroke for a cleaner look */}
        <svg
          width="18"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M9 17.05a7 7 0 0 1 6 0" />
          <path d="M12 20h.01" />
        </svg>

        {/* Battery */}
        <div className="flex items-center gap-0.5">
          <div className="relative w-6 h-3 border-2 border-zinc-600 rounded-[4px] p-[1px]">
            {/* Battery Level Fill */}
            <div className="h-full bg-emerald-500 rounded-sm w-[70%]" />
            {/* Battery Tip */}
            <div className="absolute -right-[4px] top-[2px] w-[2.5px] h-[5px] bg-zinc-600 rounded-r-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
