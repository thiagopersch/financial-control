import { resolveAppLink } from '@/lib/notification-templates/app-link';
import { resolveThemeColor } from '@/lib/notification-templates/theme-color';
import type {
  AlignItems,
  Block,
  BlockAlign,
  BlockTree,
  ButtonBlock,
  ColumnChildBlock,
  ContainerBlock,
  DividerBlock,
  FlexDirection,
  GapUnit,
  ImageBlock,
  JustifyContent,
  RowBlock,
  TableBlock,
  TextBlock,
} from './block-types';

const alignToTextAlign: Record<BlockAlign, string> = {
  left: 'left',
  center: 'center',
  right: 'right',
};

// Email-safe styles for every tag the rich-text editor (Tiptap) can emit, keyed
// by tag name. Email clients ignore stylesheets/classes, so the typography that
// makes the editor/preview look right (Tailwind's `prose` classes) must be
// inlined by hand here — mirroring the inline-style approach every other block
// renderer in this file already uses.
const TEXT_BLOCK_TAG_STYLES: Record<string, string> = {
  h1: 'font-size:28px;font-weight:700;line-height:1.3;margin:16px 0 8px;',
  h2: 'font-size:24px;font-weight:700;line-height:1.3;margin:16px 0 8px;',
  h3: 'font-size:20px;font-weight:700;line-height:1.3;margin:16px 0 8px;',
  p: 'margin:0 0 12px;line-height:1.6;',
  ul: 'margin:0 0 12px;padding-left:20px;',
  ol: 'margin:0 0 12px;padding-left:20px;',
  li: 'margin:0 0 4px;line-height:1.6;',
  blockquote: 'margin:0 0 12px;padding-left:12px;border-left:3px solid #e2e8f0;color:#555555;',
  a: 'color:#2563eb;text-decoration:underline;',
  img: 'max-width:100%;border-radius:6px;display:block;',
};

function applyEmailTypography(html: string): string {
  return Object.entries(TEXT_BLOCK_TAG_STYLES).reduce((result, [tag, css]) => {
    const openTagRe = new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi');
    return result.replace(openTagRe, (match, attrs: string | undefined) => {
      // Strip a self-closing slash (e.g. `<img ... />`) before rebuilding the tag —
      // leaving it in place would land it before the injected style attribute,
      // producing malformed markup that the browser's HTML parser silently drops
      // while parsing SSR output but that the client's raw re-computed string still
      // contains, causing a hydration text mismatch.
      const rest = (attrs || '').replace(/\/\s*$/, '').trim();
      if (/style\s*=\s*"/.test(rest)) {
        const merged = rest.replace(
          /style\s*=\s*"([^"]*)"/,
          (_m, existing) => `style="${existing};${css}"`,
        );
        return `<${tag} ${merged}>`;
      }
      return `<${tag}${rest ? ` ${rest}` : ''} style="${css}">`;
    });
  }, html);
}

function renderTextBlock(block: TextBlock): string {
  return `<td style="padding:8px 0;">${applyEmailTypography(block.props.html)}</td>`;
}

function renderImageBlock(block: ImageBlock): string {
  const {
    src,
    alt,
    width,
    height,
    widthUnit = 'px',
    heightUnit = 'px',
    align,
    borderRadius,
    href,
  } = block.props;
  // The HTML width/height attributes only accept plain integers (px) per spec —
  // percentage sizing is applied via inline style instead, which email clients honor.
  const dimensions = [
    width && widthUnit === 'px' ? `width="${width}"` : '',
    height && heightUnit === 'px' ? `height="${height}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const widthStyle = width ? `width:${width}${widthUnit === '%' ? '%' : 'px'};` : '';
  const heightStyle = height ? `height:${height}${heightUnit === '%' ? '%' : 'px'};` : '';
  const img = `<img src="${src}" alt="${alt}" ${dimensions} style="display:block;max-width:100%;border-radius:${borderRadius}px;${widthStyle}${heightStyle}">`;
  const linked = href
    ? `<a href="${resolveAppLink(href)}" target="_blank" rel="noopener noreferrer">${img}</a>`
    : img;
  return `<td style="padding:8px 0;text-align:${alignToTextAlign[align]};">${linked}</td>`;
}

function renderButtonBlock(block: ButtonBlock): string {
  const { label, href, bgColor, textColor, radius, paddingY, paddingX, align } = block.props;
  return `<td style="padding:8px 0;text-align:${alignToTextAlign[align]};">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:${align === 'center' ? '0 auto' : align === 'right' ? '0 0 0 auto' : '0'};">
    <tr>
      <td style="background-color:${resolveThemeColor(bgColor)};border-radius:${radius}px;">
        <a href="${resolveAppLink(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:${paddingY}px ${paddingX}px;color:${resolveThemeColor(textColor)};text-decoration:none;font-weight:600;">${label}</a>
      </td>
    </tr>
  </table>
</td>`;
}

function renderDividerBlock(block: DividerBlock): string {
  const { color, thickness, marginY } = block.props;
  return `<td style="padding:0;"><hr style="border:none;border-top:${thickness}px solid ${resolveThemeColor(color)};margin:${marginY}px 0;"></td>`;
}

function renderTableBlock(block: TableBlock): string {
  const { cells, hasHeader } = block.props;
  const rowsHtml = cells
    .map((row, rowIndex) => {
      const isHeaderRow = hasHeader && rowIndex === 0;
      const cellTag = isHeaderRow ? 'th' : 'td';
      const cellsHtml = row
        .map(
          (cell) =>
            `<${cellTag} style="border:1px solid #e2e8f0;padding:8px;text-align:left;${isHeaderRow ? 'background-color:#f8fafc;font-weight:600;' : ''}">${cell}</${cellTag}>`,
        )
        .join('');
      return `<tr>${cellsHtml}</tr>`;
    })
    .join('');
  return `<td style="padding:8px 0;"><table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rowsHtml}</table></td>`;
}

function renderColumnChildBlock(block: ColumnChildBlock): string {
  switch (block.type) {
    case 'text':
      return renderTextBlock(block);
    case 'image':
      return renderImageBlock(block);
    case 'button':
      return renderButtonBlock(block);
    case 'divider':
      return renderDividerBlock(block);
    case 'table':
      return renderTableBlock(block);
  }
}

function renderRowBlock(block: RowBlock): string {
  const { paddingY, paddingX, backgroundColor, visibleIf } = block.props;
  const columnsHtml = block.children
    .map((column) => {
      const innerRows = column.children.map(renderColumnChildBlock).join('');
      const innerTable = `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">${innerRows}</table>`;
      return `<td width="${column.props.widthPercent}%" style="vertical-align:top;padding:0 8px;">${innerTable}</td>`;
    })
    .join('');
  const rowHtml = `<tr><td style="padding:${paddingY}px ${paddingX}px;background-color:${resolveThemeColor(backgroundColor)};">
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>${columnsHtml}</tr></table>
  </td></tr>`;
  return visibleIf ? `<!--cond:${visibleIf}-->${rowHtml}<!--endcond-->` : rowHtml;
}

function renderColumnChildAsMiniTable(block: ColumnChildBlock, align?: string): string {
  // `text-align` on the containing `<td>` only centers inline content — it has
  // no effect on this nested `<table>`, which is a block-level box. The `align`
  // attribute is what actually centers/right-aligns a block-level table within
  // its parent cell across e-mail clients.
  const alignAttr = align ? ` align="${align}"` : '';
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0"${alignAttr}>${`<tr>${renderColumnChildBlock(block)}</tr>`}</table>`;
}

// Email clients (Gmail included) strip unsupported CSS properties such as
// `flex-direction`, `justify-content` and `gap` from inline `style` attributes,
// leaving a bare `display:flex` that defaults to a row with no spacing — so a
// real CSS flexbox layout can't be sent by e-mail. These maps translate the
// builder's flex properties into their closest table-based equivalent instead.
const ALIGN_ITEMS_TO_VALIGN: Record<AlignItems, string> = {
  'flex-start': 'top',
  'flex-end': 'bottom',
  center: 'middle',
  stretch: 'top',
  baseline: 'baseline',
};

const ALIGN_ITEMS_TO_TEXT_ALIGN: Record<AlignItems, string> = {
  'flex-start': 'left',
  'flex-end': 'right',
  center: 'center',
  stretch: 'left',
  baseline: 'left',
};

const JUSTIFY_TO_TABLE_ALIGN: Record<JustifyContent, string> = {
  'flex-start': 'left',
  'flex-end': 'right',
  center: 'center',
  // No table-based equivalent for distributing space between/around/evenly —
  // left-aligning is more predictable than the broken flex layout it replaces.
  'space-between': 'left',
  'space-around': 'left',
  'space-evenly': 'left',
};

function gapToPx(gap: number, unit: GapUnit): number {
  if (unit === 'rem') return gap * 16;
  // '%' has no meaningful translation into a static table's spacing — the raw
  // number is used as px, which is still closer than dropping the gap.
  return gap;
}

function renderFlexChildrenAsTable(
  children: ColumnChildBlock[],
  flexDirection: FlexDirection,
  justifyContent: JustifyContent,
  alignItems: AlignItems,
  gapPx: number,
): string {
  const reversed = flexDirection === 'row-reverse' || flexDirection === 'column-reverse';
  const ordered = reversed ? [...children].reverse() : children;

  if (flexDirection === 'column' || flexDirection === 'column-reverse') {
    const textAlign = ALIGN_ITEMS_TO_TEXT_ALIGN[alignItems];
    const rows = ordered
      .map((child, i) => {
        const gapStyle = i < ordered.length - 1 ? `padding-bottom:${gapPx}px;` : '';
        return `<tr><td style="text-align:${textAlign};${gapStyle}">${renderColumnChildAsMiniTable(child, textAlign)}</td></tr>`;
      })
      .join('');
    return `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">${rows}</table>`;
  }

  const valign = ALIGN_ITEMS_TO_VALIGN[alignItems];
  const tableAlign = JUSTIFY_TO_TABLE_ALIGN[justifyContent];
  const cells = ordered
    .map((child, i) => {
      const gapStyle = i < ordered.length - 1 ? `padding-right:${gapPx}px;` : '';
      return `<td style="vertical-align:${valign};${gapStyle}">${renderColumnChildAsMiniTable(child)}</td>`;
    })
    .join('');
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="${tableAlign}"><tr>${cells}</tr></table>`;
}

function renderContainerBlock(block: ContainerBlock): string {
  const {
    marginY,
    marginX,
    paddingY,
    paddingX,
    backgroundColor,
    visibleIf,
    display = 'block',
    flexDirection = 'row',
    justifyContent = 'flex-start',
    alignItems = 'stretch',
    gap = 0,
    gapUnit = 'px',
  } = block.props;

  // `margin` has no effect on table cells in most email clients, so "external
  // spacing" is simulated with an outer cell's padding wrapping an inner
  // "box" cell that carries the background color and internal padding.
  const innerContent =
    display === 'flex'
      ? renderFlexChildrenAsTable(
          block.children,
          flexDirection,
          justifyContent,
          alignItems,
          gapToPx(gap, gapUnit),
        )
      : `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">${block.children.map(renderColumnChildBlock).join('')}</table>`;

  const boxTable = `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="padding:${paddingY}px ${paddingX}px;background-color:${resolveThemeColor(backgroundColor)};">${innerContent}</td></tr></table>`;
  const containerHtml = `<tr><td style="padding:${marginY}px ${marginX}px;">${boxTable}</td></tr>`;
  return visibleIf ? `<!--cond:${visibleIf}-->${containerHtml}<!--endcond-->` : containerHtml;
}

function renderTopLevelBlock(block: Block): string {
  if (block.type === 'row') return renderRowBlock(block);
  if (block.type === 'container') return renderContainerBlock(block);
  return `<tr>${renderColumnChildBlock(block)}</tr>`;
}

/**
 * Converts a builder block tree into email-safe HTML: a table-based layout with
 * inline styles only (no Tailwind classes), since the output is sent via SMTP
 * to arbitrary email clients rather than rendered by this app's own CSS.
 */
export function renderBlockTreeToHtml(blocks: BlockTree): string {
  const rowsHtml = blocks.map(renderTopLevelBlock).join('');
  return `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">${rowsHtml}</table>`;
}

/**
 * `bodyHtml` is a denormalized cache of `content` (the block tree), written
 * once at save time — it goes stale whenever this file's rendering logic
 * changes, since only re-saving the template recomputes it. Delivery paths
 * (real sends and test sends) must always re-render from `content`, the
 * actual source of truth, so a fix here applies to every already-saved
 * template immediately instead of requiring every template to be re-saved.
 * Falls back to the stored `bodyHtml` only when there's no block tree to
 * render from.
 */
export function resolveEmailBodyHtml(template: { bodyHtml: string; content: unknown }): string {
  return Array.isArray(template.content)
    ? renderBlockTreeToHtml(template.content as BlockTree)
    : template.bodyHtml;
}

/**
 * Wraps rendered block HTML into a standalone document for the builder's
 * preview iframes (template preview, single-element preview). Pinned to a
 * light background regardless of the app's own dark/light theme, since real
 * email/WhatsApp clients don't inherit this app's theme — the surrounding
 * dialog chrome follows the app theme, but the content inside this iframe
 * must always look like the real, final message.
 */
export function wrapEmailPreviewDocument(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<style>
  html, body { margin: 0; padding: 16px; background: #ffffff; color-scheme: light; }
</style>
</head>
<body>${bodyHtml}
<script>
  document.addEventListener('click', function (e) {
    var link = e.target && e.target.closest ? e.target.closest('a') : null;
    if (link) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
</script>
</body>
</html>`;
}
