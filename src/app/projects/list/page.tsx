// src/app/projects/list/page.tsx
"use client";

import DashboardPage from "@/components/projects/ProjectsListContent";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <DashboardPage/>
    </Suspense>
  );
}