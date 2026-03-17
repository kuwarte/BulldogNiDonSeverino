"use client";

import React from "react";

export default function PhoneNavBar() {
  return (
    <nav
      className="absolute bottom-0 left-0 right-0 w-full h-12 flex items-center justify-around 
                    bg-white/90 backdrop-blur-md border-t border-zinc-200 text-zinc-600 z-40 rounded-b-[40px]"
    >
      {/* Back Button */}
      <button
        aria-label="Back"
        className="group flex items-center justify-center h-12 w-12 rounded-full 
                   transition-all duration-200 active:bg-zinc-800 active:scale-90"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-active:text-white"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Home Button */}
      <button
        aria-label="Home"
        className="group flex items-center justify-center h-12 w-12 rounded-full 
                   transition-all duration-200 active:bg-zinc-800 active:scale-90"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-active:text-white"
        >
          <circle cx="12" cy="12" r="8" />
        </svg>
      </button>

      {/* Tabs Button */}
      <button
        aria-label="Tabs"
        className="group flex items-center justify-center h-12 w-12 rounded-full 
                   transition-all duration-200 active:bg-zinc-800 active:scale-90"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-active:text-white"
        >
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      </button>
    </nav>
  );
}
