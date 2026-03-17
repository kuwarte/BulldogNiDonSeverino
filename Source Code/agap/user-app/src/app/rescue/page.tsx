"use client";

import dynamic from "next/dynamic";

const RescuePage = dynamic(() => import("./RescuePage"), {
  ssr: false,
});

export default function Page() {
  return <RescuePage />;
}
