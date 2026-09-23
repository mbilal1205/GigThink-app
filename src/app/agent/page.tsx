// src/app/agent/page.tsx
"use client";

import { useState } from "react";
import ChatPanel from "@/components/agent/chat-panel";

export default function AgentPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  );
}