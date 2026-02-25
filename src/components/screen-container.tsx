import type { ReactNode } from "react";

type ScreenContainerProps = {
  children: ReactNode;
  size?: "wide" | "narrow";
};

export function ScreenContainer({ children, size = "wide" }: ScreenContainerProps) {
  const widthClass =
    size === "narrow"
      ? "max-w-md sm:max-w-xl"
      : "max-w-6xl";

  return (
    <main className={`mx-auto min-h-screen w-full px-4 py-6 sm:px-6 ${widthClass}`}>
      {children}
    </main>
  );
}
