"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type SiteHeaderProps = {
  isSignedIn: boolean;
  displayName?: string;
};

const navItems = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`rounded-md px-2 py-1 text-sm font-semibold ${active ? "bg-[#e2f3f6] text-[#155e75]" : "text-[#334155]"}`}
    >
      {label}
    </Link>
  );
}

export function SiteHeader({ isSignedIn, displayName }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const initial = (displayName?.trim().charAt(0) || "A").toUpperCase();
  const actionHref = isSignedIn ? "/dashboard" : "/auth/sign-in";
  const actionLabel = isSignedIn ? "Dashboard" : "Sign In";

  return (
    <header className="mb-10">
      <div className="chip-card flex items-center justify-between px-4 py-3">
        <Link href="/" className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-sm font-bold tracking-wide">
          CHIPIN
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="hidden md:flex">
          <Link
            href={actionHref}
            className="flex items-center gap-2 rounded-lg border border-[#0e7490] px-3 py-2 text-sm font-semibold"
          >
            {isSignedIn ? (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0e7490] text-xs font-bold text-white">
                {initial}
              </span>
            ) : null}
            <span>{actionLabel}</span>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg border border-[#cbd5e1] px-3 py-2 text-lg font-semibold leading-none md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open ? (
        <div className="chip-card mt-2 space-y-2 p-3 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm font-semibold"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={actionHref}
            className="block rounded-lg bg-[#0e7490] px-3 py-2 text-center text-sm font-semibold text-white"
            onClick={() => setOpen(false)}
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </header>
  );
}
