export function normaliseBasePath(base: string): string {
  if (!base || base === "/") return "/";
  const leading = base.startsWith("/") ? base : `/${base}`;
  return leading.endsWith("/") ? leading : `${leading}/`;
}

export function routerBasename(base: string): string | undefined {
  const normalised = normaliseBasePath(base);
  return normalised === "/" ? undefined : normalised.slice(0, -1);
}

export function routeHref(base: string, route: "/" | "/my"): string {
  const normalised = normaliseBasePath(base);
  return route === "/" ? normalised : `${normalised}${route.slice(1)}`;
}
