"use client";

import React from "react";

export default function GridDecoration() {
  return (
    <div aria-hidden className="absolute inset-0 z-0 pointer-events-none select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.04),transparent_60%)]" />
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(128,128,128,0.07)_1px,transparent_1px),linear-gradient(180deg,rgba(128,128,128,0.07)_1px,transparent_1px)] bg-[size:48px_48px]"
        style={{ maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, black 70%, transparent 100%)' }}
      />
    </div>
  );
}