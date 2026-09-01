/**
 * Lets color properties in the template builder (row background, button
 * colors, divider color) be pinned to "the app's primary color" instead of
 * a hand-picked hex. Since emails are static HTML with no access to this
 * app's CSS custom properties, the sentinel below is resolved to a fixed hex
 * (matching `--primary` in app/globals.css, light theme) wherever the color
 * is actually rendered — in the builder's live preview (block-renderer.tsx),
 * in the saved bodyHtml (render.ts), and in the property picker itself.
 *
 * Keep APP_PRIMARY_COLOR_HEX in sync with `--primary` in app/globals.css if
 * the app's brand color ever changes.
 */
export const APP_PRIMARY_COLOR_SENTINEL = 'app-primary';
export const APP_PRIMARY_COLOR_HEX = '#007a55';

export function isAppPrimaryColor(value: string): boolean {
  return value === APP_PRIMARY_COLOR_SENTINEL;
}

export function resolveThemeColor(value: string): string {
  return isAppPrimaryColor(value) ? APP_PRIMARY_COLOR_HEX : value;
}
