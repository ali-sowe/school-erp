import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  // Desktop sidebar
  sidebarCollapsed: false,

  // Mobile drawer state
  isMobileSidebarOpen: false,

  // Breakpoint detection
  isMobile: false,

  // Actions
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) =>
    set({ sidebarCollapsed: collapsed }),

  setMobileSidebarOpen: (open) =>
    set({ isMobileSidebarOpen: open }),

  setIsMobile: (isMobile) =>
    set({ isMobile }),

  // Handles resize events: auto‑closes mobile drawer on larger screens
  handleResize: () => {
    const isMobile = window.innerWidth < 768;
    const state = get();
    if (!isMobile && state.isMobileSidebarOpen) {
      set({ isMobileSidebarOpen: false });
    }
    set({ isMobile });
  },
}));

export { useUIStore };