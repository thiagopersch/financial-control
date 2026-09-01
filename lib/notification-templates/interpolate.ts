/**
 * Single source of truth for turning a saved NotificationTemplate's
 * bodyHtml/bodyWhatsapp/subject into the final text sent to a recipient.
 * Used by lib/services/notification-delivery.ts, lib/services/conditional-rules.ts
 * and lib/actions/notification-template-test-send.ts — keep behavior identical
 * across all three call sites.
 */

/** Replaces flat `{{key}}` tokens. Missing/null/undefined keys become ''. */
export function interpolate(text: string, vars: Record<string, unknown>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = vars[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips `<!--cond:key-->...<!--endcond-->` markers emitted by
 * lib/notification-templates/render.ts for a Row block with `visibleIf`.
 * Keeps the inner content when `vars[key]` is truthy, drops the whole block
 * otherwise. Must run BEFORE `interpolate`, and only on bodyHtml — subject
 * and bodyWhatsapp are plain strings with no block tree, so they never
 * contain conditional markers.
 */
export function applyConditionals(html: string, vars: Record<string, unknown>): string {
  return html.replace(/<!--cond:(\w+)-->([\s\S]*?)<!--endcond-->/g, (_match, key, inner) =>
    vars[key] ? inner : '',
  );
}
