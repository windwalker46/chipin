import type { ReactNode } from "react";

export function ScreenContainer({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-6 sm:max-w-xl sm:px-6">
      {children}
    </main>
  );
}
