import * as z from 'zod';

const alignSchema = z.enum(['left', 'center', 'right']);

const textBlockSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.literal('text'),
  props: z.object({
    html: z.string(),
  }),
});

const imageBlockSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.literal('image'),
  props: z.object({
    src: z.string(),
    alt: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    widthUnit: z.enum(['px', '%']).optional(),
    heightUnit: z.enum(['px', '%']).optional(),
    align: alignSchema,
    borderRadius: z.number(),
    href: z.string().optional(),
  }),
});

const buttonBlockSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.literal('button'),
  props: z.object({
    label: z.string(),
    href: z.string(),
    bgColor: z.string(),
    textColor: z.string(),
    radius: z.number(),
    paddingY: z.number(),
    paddingX: z.number(),
    align: alignSchema,
  }),
});

const dividerBlockSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.literal('divider'),
  props: z.object({
    color: z.string(),
    thickness: z.number(),
    marginY: z.number(),
  }),
});

const tableBlockSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.literal('table'),
  props: z.object({
    rows: z.number(),
    cols: z.number(),
    hasHeader: z.boolean(),
    cells: z.array(z.array(z.string())),
  }),
});

/** Blocks allowed inside a column (no row/column nesting — max depth = 2). */
const columnChildBlockSchema = z.discriminatedUnion('type', [
  textBlockSchema,
  imageBlockSchema,
  buttonBlockSchema,
  dividerBlockSchema,
  tableBlockSchema,
]);

const columnBlockSchema = z.object({
  id: z.string(),
  type: z.literal('column'),
  props: z.object({
    widthPercent: z.number().min(1).max(100),
  }),
  children: z.array(columnChildBlockSchema).max(30),
});

const rowBlockSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.literal('row'),
  props: z.object({
    paddingY: z.number(),
    paddingX: z.number(),
    backgroundColor: z.string(),
    visibleIf: z.string().max(64).optional(),
  }),
  children: z.array(columnBlockSchema).max(6),
});

const containerBlockSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.literal('container'),
  props: z.object({
    marginY: z.number(),
    marginX: z.number(),
    paddingY: z.number(),
    paddingX: z.number(),
    backgroundColor: z.string(),
    visibleIf: z.string().max(64).optional(),
    display: z.enum(['block', 'flex']).optional(),
    flexDirection: z.enum(['row', 'column', 'row-reverse', 'column-reverse']).optional(),
    flexWrap: z.enum(['nowrap', 'wrap', 'wrap-reverse']).optional(),
    justifyContent: z
      .enum(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'])
      .optional(),
    alignItems: z.enum(['flex-start', 'flex-end', 'center', 'stretch', 'baseline']).optional(),
    gap: z.number().optional(),
    gapUnit: z.enum(['px', '%', 'rem']).optional(),
  }),
  children: z.array(columnChildBlockSchema).max(30),
});

export const blockSchema = z.discriminatedUnion('type', [
  textBlockSchema,
  imageBlockSchema,
  buttonBlockSchema,
  dividerBlockSchema,
  tableBlockSchema,
  rowBlockSchema,
  containerBlockSchema,
]);

export const blockTreeSchema = z.array(blockSchema).max(60);

export type BlockTreeInput = z.infer<typeof blockTreeSchema>;
