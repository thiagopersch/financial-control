import { create } from 'zustand';

interface SidebarStore {
  isCollapsed: boolean;
  isOpen: boolean; // para mobile
  onCollapse: () => void;
  onExpand: () => void;
  toggle: () => void;
  onOpen: () => void; // para mobile
  onClose: () => void; // para mobile
  toggleOpen: () => void; // para mobile
}

export const useSidebar = create<SidebarStore>((set) => ({
  isCollapsed: false,
  isOpen: false,
  onCollapse: () => set({ isCollapsed: true }),
  onExpand: () => set({ isCollapsed: false }),
  toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
