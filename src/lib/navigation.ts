export function normalizeNextPath(nextValue: string | null | undefined) {
  if (!nextValue || !nextValue.startsWith("/")) return "/dashboard";
  if (nextValue.startsWith("//")) return "/dashboard";

  if (nextValue === "/onboarding/stripe") return "/dashboard";
  if (nextValue === "/pools/new") return "/chips/new";

  if (nextValue.startsWith("/pools/")) {
    const publicCode = nextValue.replace("/pools/", "").split("/")[0];
    return publicCode ? `/chips/${publicCode}` : "/dashboard";
  }

  if (nextValue.startsWith("/join/")) {
    const publicCode = nextValue.replace("/join/", "").split("/")[0];
    return publicCode ? `/chips/${publicCode}` : "/dashboard";
  }

  return nextValue;
}
