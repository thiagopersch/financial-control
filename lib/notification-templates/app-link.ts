/**
 * Lets "link de destino" properties (button href, image href) in the template
 * builder point at a path inside this app instead of a hand-typed absolute
 * URL. Since the stored value has no schema of its own (it's just a string
 * prop), a prefix sentinel marks "slug" mode; the real absolute URL is only
 * resolved where the link is actually used — in the builder's live preview
 * (block-renderer.tsx has no href-rendering surface today, so this only
 * matters in render.ts) and in the saved bodyHtml.
 */
export const APP_LINK_SLUG_PREFIX = 'app-slug:';

export function isAppSlugLink(value: string): boolean {
  return value.startsWith(APP_LINK_SLUG_PREFIX);
}

export function getAppSlugValue(value: string): string {
  return value.slice(APP_LINK_SLUG_PREFIX.length);
}

export function makeAppSlugLink(slug: string): string {
  return `${APP_LINK_SLUG_PREFIX}${slug}`;
}

/**
 * Resolves to this app's own origin — the browser's, when run client-side
 * (always accurate for whatever domain the template is actually being
 * authored/sent from). Server-side (e-mail delivery has no `window`), falls
 * back to `NEXTAUTH_URL` — already required for NextAuth to work at all, so
 * it's guaranteed to be set per-environment (localhost in dev, the real
 * domain in production) without needing any extra configuration.
 * `NEXT_PUBLIC_APP_URL` remains available as an explicit override for the
 * rare case where the public URL differs from the NextAuth one.
 */
function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '';
}

export function resolveAppLink(value: string): string {
  if (!isAppSlugLink(value)) return value;
  const slug = getAppSlugValue(value);
  const base = getAppBaseUrl().replace(/\/$/, '');
  const path = slug.startsWith('/') ? slug : `/${slug}`;
  return `${base}${path}`;
}
