"use client";

import { useState } from "react";

export function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ url });
      return;
    }
    await copyLink();
  }

  return (
    <div className="flex gap-2">
      <button type="button" className="chip-button chip-button-secondary" onClick={copyLink}>
        {copied ? "Copied" : "Copy Link"}
      </button>
      <button type="button" className="chip-button" onClick={nativeShare}>
        Share Via
      </button>
    </div>
  );
}
