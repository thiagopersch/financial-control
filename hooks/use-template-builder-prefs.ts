import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TemplateBuilderPrefsState {
  /** Canvas da montagem segue o tema do app (claro/escuro). Padrão: folha branca, como o e-mail real. */
  useAppTheme: boolean;
  setUseAppTheme: (value: boolean) => void;
}

export const useTemplateBuilderPrefs = create<TemplateBuilderPrefsState>()(
  persist(
    (set) => ({
      useAppTheme: false,
      setUseAppTheme: (value) => set({ useAppTheme: value }),
    }),
    { name: 'template-builder-prefs' },
  ),
);
