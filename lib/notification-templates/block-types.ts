export type BlockType =
  'text' | 'image' | 'row' | 'column' | 'container' | 'table' | 'button' | 'divider';

export type BlockAlign = 'left' | 'center' | 'right';

interface BaseBlock {
  id: string;
  type: BlockType;
  /** User-editable label shown in the canvas/dialog. Auto-generated (e.g. "text1") when absent. */
  name?: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  props: {
    html: string;
  };
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  props: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    /** Unit for `width`. Absent means 'px' (backward-compatible with templates saved before this field existed). */
    widthUnit?: 'px' | '%';
    /** Unit for `height`. Absent means 'px'. */
    heightUnit?: 'px' | '%';
    align: BlockAlign;
    borderRadius: number;
    href?: string;
  };
}

export interface RowBlock extends BaseBlock {
  type: 'row';
  props: {
    paddingY: number;
    paddingX: number;
    backgroundColor: string;
    /** Variable key gating this row's visibility at delivery time — hidden when the value is falsy/empty. */
    visibleIf?: string;
  };
  children: ColumnBlock[];
}

export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
export type JustifyContent =
  'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
export type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
export type GapUnit = 'px' | '%' | 'rem';

export interface ContainerBlock extends BaseBlock {
  type: 'container';
  props: {
    marginY: number;
    marginX: number;
    paddingY: number;
    paddingX: number;
    backgroundColor: string;
    /** Variable key gating this container's visibility at delivery time — hidden when the value is falsy/empty. */
    visibleIf?: string;
    /** Absent means 'block' — the original stacked-rows layout, unchanged for templates saved before this field existed. */
    display?: 'block' | 'flex';
    flexDirection?: FlexDirection;
    flexWrap?: FlexWrap;
    justifyContent?: JustifyContent;
    alignItems?: AlignItems;
    gap?: number;
    gapUnit?: GapUnit;
  };
  children: ColumnChildBlock[];
}

export interface ColumnBlock extends BaseBlock {
  type: 'column';
  props: {
    widthPercent: number;
  };
  children: ColumnChildBlock[];
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  props: {
    rows: number;
    cols: number;
    hasHeader: boolean;
    cells: string[][];
  };
}

export interface ButtonBlock extends BaseBlock {
  type: 'button';
  props: {
    label: string;
    href: string;
    bgColor: string;
    textColor: string;
    radius: number;
    paddingY: number;
    paddingX: number;
    align: BlockAlign;
  };
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  props: {
    color: string;
    thickness: number;
    marginY: number;
  };
}

/** Blocks allowed inside a column: everything except row/column (max nesting depth = 2). */
export type ColumnChildBlock = TextBlock | ImageBlock | TableBlock | ButtonBlock | DividerBlock;

/** Blocks allowed at the top level of a template. */
export type Block =
  TextBlock | ImageBlock | RowBlock | ContainerBlock | TableBlock | ButtonBlock | DividerBlock;

export type BlockTree = Block[];

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: 'Texto',
  image: 'Imagem',
  row: 'Linha',
  column: 'Coluna',
  container: 'Contêiner',
  table: 'Tabela',
  button: 'Botão',
  divider: 'Divisor',
};
