"use client";

import { useRouter } from "next/navigation";
import React from "react";
import ProposeForm from "@/components/ProposeForm";

export default function ProposePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-lavender-bg text-navy-text">
      {/* Navbar - Dark Navy */}
      <nav className="bg-navy-dark text-white py-4 px-6 shadow-md shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent-violet text-white text-base">
              💡
            </span>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">
                AI Idea Board
              </h1>
              <p className="text-[10px] text-muted-text">
                Agent & Human Playground
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-xs font-semibold text-accent-light hover:text-white transition-colors"
          >
            ← Back to Board
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <ProposeForm
          onSubmitSuccess={() => router.push("/")}
          onCancel={() => router.push("/")}
        />
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-lavender-bg text-center text-[10px] text-muted-text shrink-0">
        <div className="max-w-5xl mx-auto px-4">
          © {new Date().getFullYear()} AI Idea Board. Styled in compliance with
          UI.md design parameters.
        </div>
      </footer>
    </div>
  );
}
