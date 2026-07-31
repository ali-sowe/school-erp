import { create } from 'zustand';

// ADR-009: Zustand owns local/client UI state only — things TanStack Query
// has no business caching, like whether a panel is open. Anything that
// comes from the API (user, students, attendance...) belongs in a query,
// not here. Kept intentionally small: add fields only for genuine
// client-only state, not as a general-purpose grab bag.
export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
