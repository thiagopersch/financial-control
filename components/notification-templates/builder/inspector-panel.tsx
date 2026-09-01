'use client';

import { Button } from '@/components/ui/button';
import { DestinationLinkInput } from '@/components/ui/destination-link-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ThemeColorInput } from '@/components/ui/theme-color-input';
import type { Block, BlockAlign, ColumnChildBlock } from '@/lib/notification-templates/block-types';
import { flattenVariableCatalog } from '@/lib/notification-templates/variable-catalog';
import { Minus, Plus } from 'lucide-react';
import { VariablePicker } from './variable-picker';

interface InspectorPanelProps {
  block: Block | ColumnChildBlock;
  onChange: (updater: (b: Block | ColumnChildBlock) => Block | ColumnChildBlock) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function AlignSelect({
  value,
  onChange,
}: {
  value: BlockAlign;
  onChange: (v: BlockAlign) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as BlockAlign)}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="left">Esquerda</SelectItem>
        <SelectItem value="center">Centro</SelectItem>
        <SelectItem value="right">Direita</SelectItem>
      </SelectContent>
    </Select>
  );
}

function UnitToggle<U extends string>({
  unit,
  units,
  onChange,
}: {
  unit: U;
  units: readonly U[];
  onChange: (u: U) => void;
}) {
  return (
    <div className="border-input flex shrink-0 items-center gap-0.5 rounded-md border p-0.5">
      {units.map((u) => (
        <Button
          key={u}
          type="button"
          size="sm"
          variant={unit === u ? 'default' : 'ghost'}
          className="h-5 px-1.5 text-[10px]"
          onClick={() => onChange(u)}
        >
          {u}
        </Button>
      ))}
    </div>
  );
}

export function InspectorPanel({ block, onChange: update }: InspectorPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {block.type === 'text' && (
        <div className="text-muted-foreground text-xs">
          Este elemento não possui propriedades adicionais além do texto editado acima.
        </div>
      )}

      {block.type === 'image' && (
        <>
          <Field label="Texto alternativo">
            <Input
              value={block.props.alt}
              onChange={(e) =>
                update((b) => ({ ...b, props: { ...(b as any).props, alt: e.target.value } }))
              }
            />
          </Field>
          <Field label="Link (opcional)">
            <div className="flex flex-col gap-2">
              <DestinationLinkInput
                value={block.props.href ?? ''}
                onChange={(href) => update((b) => ({ ...b, props: { ...(b as any).props, href } }))}
              />
              <VariablePicker
                onInsert={(key) =>
                  update((b) => ({
                    ...b,
                    props: {
                      ...(b as any).props,
                      href: `${(b as any).props.href || ''}{{${key}}}`,
                    },
                  }))
                }
              />
            </div>
          </Field>
          <Field label="Alinhamento">
            <AlignSelect
              value={block.props.align}
              onChange={(align) => update((b) => ({ ...b, props: { ...(b as any).props, align } }))}
            />
          </Field>
          <Field
            label={`Largura (${block.props.width ?? 'auto'}${block.props.widthUnit === '%' ? '%' : 'px'})`}
          >
            <div className="flex items-center gap-2">
              <Slider
                min={0}
                max={block.props.widthUnit === '%' ? 100 : 600}
                step={block.props.widthUnit === '%' ? 1 : 10}
                value={[block.props.width ?? 0]}
                onValueChange={([w]) =>
                  update((b) => ({
                    ...b,
                    props: { ...(b as any).props, width: w === 0 ? undefined : w },
                  }))
                }
                className="flex-1"
              />
              <UnitToggle
                unit={block.props.widthUnit ?? 'px'}
                units={['px', '%']}
                onChange={(widthUnit) =>
                  update((b) => ({ ...b, props: { ...(b as any).props, widthUnit } }))
                }
              />
            </div>
          </Field>
          <Field
            label={`Altura (${block.props.height ?? 'auto'}${block.props.heightUnit === '%' ? '%' : 'px'})`}
          >
            <div className="flex items-center gap-2">
              <Slider
                min={0}
                max={block.props.heightUnit === '%' ? 100 : 600}
                step={block.props.heightUnit === '%' ? 1 : 10}
                value={[block.props.height ?? 0]}
                onValueChange={([h]) =>
                  update((b) => ({
                    ...b,
                    props: { ...(b as any).props, height: h === 0 ? undefined : h },
                  }))
                }
                className="flex-1"
              />
              <UnitToggle
                unit={block.props.heightUnit ?? 'px'}
                units={['px', '%']}
                onChange={(heightUnit) =>
                  update((b) => ({ ...b, props: { ...(b as any).props, heightUnit } }))
                }
              />
            </div>
          </Field>
          <Field label={`Borda arredondada (${block.props.borderRadius}px)`}>
            <Slider
              min={0}
              max={48}
              step={2}
              value={[block.props.borderRadius]}
              onValueChange={([r]) =>
                update((b) => ({ ...b, props: { ...(b as any).props, borderRadius: r } }))
              }
            />
          </Field>
        </>
      )}

      {block.type === 'row' && (
        <>
          <Field label="Cor de fundo">
            <ThemeColorInput
              value={block.props.backgroundColor}
              onChange={(backgroundColor) =>
                update((b) => ({ ...b, props: { ...(b as any).props, backgroundColor } }))
              }
            />
          </Field>
          <Field label={`Espaçamento vertical (${block.props.paddingY}px)`}>
            <Slider
              min={0}
              max={64}
              step={2}
              value={[block.props.paddingY]}
              onValueChange={([v]) =>
                update((b) => ({ ...b, props: { ...(b as any).props, paddingY: v } }))
              }
            />
          </Field>
          <Field label={`Espaçamento horizontal (${block.props.paddingX}px)`}>
            <Slider
              min={0}
              max={64}
              step={2}
              value={[block.props.paddingX]}
              onValueChange={([v]) =>
                update((b) => ({ ...b, props: { ...(b as any).props, paddingX: v } }))
              }
            />
          </Field>
          <Field label="Visibilidade condicional">
            <Select
              value={block.props.visibleIf ?? '__always__'}
              onValueChange={(v) =>
                update((b) => ({
                  ...b,
                  props: { ...(b as any).props, visibleIf: v === '__always__' ? undefined : v },
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__always__">Sempre visível</SelectItem>
                {flattenVariableCatalog().map((field) => (
                  <SelectItem key={field.key} value={field.key}>
                    Só se {field.label} estiver preenchido
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </>
      )}

      {block.type === 'container' && (
        <>
          <Field label="Cor de fundo">
            <ThemeColorInput
              value={block.props.backgroundColor}
              onChange={(backgroundColor) =>
                update((b) => ({ ...b, props: { ...(b as any).props, backgroundColor } }))
              }
            />
          </Field>
          <Field label={`Margem externa vertical (${block.props.marginY}px)`}>
            <Slider
              min={0}
              max={64}
              step={2}
              value={[block.props.marginY]}
              onValueChange={([v]) =>
                update((b) => ({ ...b, props: { ...(b as any).props, marginY: v } }))
              }
            />
          </Field>
          <Field label={`Margem externa horizontal (${block.props.marginX}px)`}>
            <Slider
              min={0}
              max={64}
              step={2}
              value={[block.props.marginX]}
              onValueChange={([v]) =>
                update((b) => ({ ...b, props: { ...(b as any).props, marginX: v } }))
              }
            />
          </Field>
          <Field label={`Espaçamento interno vertical (${block.props.paddingY}px)`}>
            <Slider
              min={0}
              max={64}
              step={2}
              value={[block.props.paddingY]}
              onValueChange={([v]) =>
                update((b) => ({ ...b, props: { ...(b as any).props, paddingY: v } }))
              }
            />
          </Field>
          <Field label={`Espaçamento interno horizontal (${block.props.paddingX}px)`}>
            <Slider
              min={0}
              max={64}
              step={2}
              value={[block.props.paddingX]}
              onValueChange={([v]) =>
                update((b) => ({ ...b, props: { ...(b as any).props, paddingX: v } }))
              }
            />
          </Field>

          <Field label="Display">
            <Select
              value={block.props.display ?? 'block'}
              onValueChange={(display) =>
                update((b) => ({
                  ...b,
                  props: { ...(b as any).props, display: display as 'block' | 'flex' },
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Bloco</SelectItem>
                <SelectItem value="flex">Flexível</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {block.props.display === 'flex' && (
            <>
              <Field label="Direção do conteúdo">
                <Select
                  value={block.props.flexDirection ?? 'row'}
                  onValueChange={(flexDirection) =>
                    update((b) => ({ ...b, props: { ...(b as any).props, flexDirection } }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="row">Linha</SelectItem>
                    <SelectItem value="column">Coluna</SelectItem>
                    <SelectItem value="row-reverse">Linha invertida</SelectItem>
                    <SelectItem value="column-reverse">Coluna invertida</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Quebra de linha">
                <Select
                  value={block.props.flexWrap ?? 'nowrap'}
                  onValueChange={(flexWrap) =>
                    update((b) => ({ ...b, props: { ...(b as any).props, flexWrap } }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nowrap">Não quebrar</SelectItem>
                    <SelectItem value="wrap">Quebrar</SelectItem>
                    <SelectItem value="wrap-reverse">Quebrar invertido</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Alinhamento horizontal">
                <Select
                  value={block.props.justifyContent ?? 'flex-start'}
                  onValueChange={(justifyContent) =>
                    update((b) => ({ ...b, props: { ...(b as any).props, justifyContent } }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flex-start">Início</SelectItem>
                    <SelectItem value="flex-end">Fim</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="space-between">Espaço entre</SelectItem>
                    <SelectItem value="space-around">Espaço ao redor</SelectItem>
                    <SelectItem value="space-evenly">Espaço uniforme</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Alinhamento vertical">
                <Select
                  value={block.props.alignItems ?? 'stretch'}
                  onValueChange={(alignItems) =>
                    update((b) => ({ ...b, props: { ...(b as any).props, alignItems } }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flex-start">Início</SelectItem>
                    <SelectItem value="flex-end">Fim</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="stretch">Esticar</SelectItem>
                    <SelectItem value="baseline">Linha de base</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label={`Espaçamento entre itens (${block.props.gap ?? 0}${block.props.gapUnit ?? 'px'})`}
              >
                <div className="flex items-center gap-2">
                  <Slider
                    min={0}
                    max={
                      block.props.gapUnit === 'rem' ? 10 : block.props.gapUnit === '%' ? 100 : 64
                    }
                    step={block.props.gapUnit === 'rem' ? 0.25 : 2}
                    value={[block.props.gap ?? 0]}
                    onValueChange={([gap]) =>
                      update((b) => ({ ...b, props: { ...(b as any).props, gap } }))
                    }
                    className="flex-1"
                  />
                  <UnitToggle
                    unit={block.props.gapUnit ?? 'px'}
                    units={['px', '%', 'rem']}
                    onChange={(gapUnit) =>
                      update((b) => ({ ...b, props: { ...(b as any).props, gapUnit } }))
                    }
                  />
                </div>
              </Field>
            </>
          )}

          <Field label="Visibilidade condicional">
            <Select
              value={block.props.visibleIf ?? '__always__'}
              onValueChange={(v) =>
                update((b) => ({
                  ...b,
                  props: { ...(b as any).props, visibleIf: v === '__always__' ? undefined : v },
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__always__">Sempre visível</SelectItem>
                {flattenVariableCatalog().map((field) => (
                  <SelectItem key={field.key} value={field.key}>
                    Só se {field.label} estiver preenchido
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </>
      )}

      {block.type === 'button' && (
        <>
          <Field label="Texto do botão">
            <div className="flex gap-2">
              <Input
                value={block.props.label}
                onChange={(e) =>
                  update((b) => ({ ...b, props: { ...(b as any).props, label: e.target.value } }))
                }
              />
              <VariablePicker
                onInsert={(key) =>
                  update((b) => ({
                    ...b,
                    props: {
                      ...(b as any).props,
                      label: `${(b as any).props.label || ''}{{${key}}}`,
                    },
                  }))
                }
              />
            </div>
          </Field>
          <Field label="Link de destino">
            <div className="flex flex-col gap-2">
              <DestinationLinkInput
                value={block.props.href}
                onChange={(href) => update((b) => ({ ...b, props: { ...(b as any).props, href } }))}
              />
              <VariablePicker
                onInsert={(key) =>
                  update((b) => ({
                    ...b,
                    props: {
                      ...(b as any).props,
                      href: `${(b as any).props.href || ''}{{${key}}}`,
                    },
                  }))
                }
              />
            </div>
          </Field>
          <Field label="Cor de fundo">
            <ThemeColorInput
              value={block.props.bgColor}
              onChange={(bgColor) =>
                update((b) => ({ ...b, props: { ...(b as any).props, bgColor } }))
              }
            />
          </Field>
          <Field label="Cor do texto">
            <ThemeColorInput
              value={block.props.textColor}
              onChange={(textColor) =>
                update((b) => ({ ...b, props: { ...(b as any).props, textColor } }))
              }
              customSeedColor="#ffffff"
            />
          </Field>
          <Field label="Alinhamento">
            <AlignSelect
              value={block.props.align}
              onChange={(align) => update((b) => ({ ...b, props: { ...(b as any).props, align } }))}
            />
          </Field>
          <Field label={`Borda arredondada (${block.props.radius}px)`}>
            <Slider
              min={0}
              max={32}
              step={1}
              value={[block.props.radius]}
              onValueChange={([r]) =>
                update((b) => ({ ...b, props: { ...(b as any).props, radius: r } }))
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Espaçamento vertical (${block.props.paddingY}px)`}>
              <Slider
                min={0}
                max={40}
                step={1}
                value={[block.props.paddingY]}
                onValueChange={([v]) =>
                  update((b) => ({ ...b, props: { ...(b as any).props, paddingY: v } }))
                }
              />
            </Field>
            <Field label={`Espaçamento Horizontal (${block.props.paddingX}px)`}>
              <Slider
                min={0}
                max={60}
                step={1}
                value={[block.props.paddingX]}
                onValueChange={([v]) =>
                  update((b) => ({ ...b, props: { ...(b as any).props, paddingX: v } }))
                }
              />
            </Field>
          </div>
        </>
      )}

      {block.type === 'divider' && (
        <>
          <Field label="Cor">
            <ThemeColorInput
              value={block.props.color}
              onChange={(color) => update((b) => ({ ...b, props: { ...(b as any).props, color } }))}
            />
          </Field>
          <Field label={`Espessura (${block.props.thickness}px)`}>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[block.props.thickness]}
              onValueChange={([v]) =>
                update((b) => ({ ...b, props: { ...(b as any).props, thickness: v } }))
              }
            />
          </Field>
          <Field label={`Margem vertical (${block.props.marginY}px)`}>
            <Slider
              min={0}
              max={64}
              step={2}
              value={[block.props.marginY]}
              onValueChange={([v]) =>
                update((b) => ({ ...b, props: { ...(b as any).props, marginY: v } }))
              }
            />
          </Field>
        </>
      )}

      {block.type === 'table' && (
        <>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Cabeçalho</Label>
            <Switch
              checked={block.props.hasHeader}
              onCheckedChange={(hasHeader) =>
                update((b) => ({ ...b, props: { ...(b as any).props, hasHeader } }))
              }
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() =>
                update((b: any) => {
                  const cols = b.props.cells[0]?.length ?? 1;
                  const cells = [...b.props.cells, Array(cols).fill('')];
                  return { ...b, props: { ...b.props, cells, rows: cells.length } };
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> Linha
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() =>
                update((b: any) => {
                  if (b.props.cells.length <= 1) return b;
                  const cells = b.props.cells.slice(0, -1);
                  return { ...b, props: { ...b.props, cells, rows: cells.length } };
                })
              }
            >
              <Minus className="h-3.5 w-3.5" /> Linha
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() =>
                update((b: any) => {
                  const cells = b.props.cells.map((row: string[]) => [...row, '']);
                  return { ...b, props: { ...b.props, cells, cols: cells[0]?.length ?? 0 } };
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> Coluna
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() =>
                update((b: any) => {
                  if ((b.props.cells[0]?.length ?? 0) <= 1) return b;
                  const cells = b.props.cells.map((row: string[]) => row.slice(0, -1));
                  return { ...b, props: { ...b.props, cells, cols: cells[0]?.length ?? 0 } };
                })
              }
            >
              <Minus className="h-3.5 w-3.5" /> Coluna
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">Edite o texto das células acima.</p>
        </>
      )}
    </div>
  );
}
