// src/lib/z-index.ts

/**
 * Sistema de z-index centralizado
 * Organizado por camadas de prioridade
 */

export const zIndex = {
  // Base layers
  base: 0,
  background: 1,
  particles: 5,
  
  // Content layers
  content: 10,
  card: 20,
  modal: 30,
  
  // Navigation layers
  navbar: 50,
  dropdown: 60,
  mobileMenuOverlay: 70,
  mobileMenu: 80,
  
  // Overlay layers
  tooltip: 90,
  popover: 100,
  toast: 110,
  
  // Highest layers
  loading: 120,
  alert: 130,
  dialog: 140,
  
  // Maximum
  max: 9999,
} as const;

// Helper para usar em Tailwind
export const zIndexClasses = {
  base: 'z-[0]',
  background: 'z-[1]',
  particles: 'z-[5]',
  
  content: 'z-[10]',
  card: 'z-[20]',
  modal: 'z-[30]',
  
  navbar: 'z-[50]',
  dropdown: 'z-[60]',
  mobileMenuOverlay: 'z-[70]',
  mobileMenu: 'z-[80]',
  
  tooltip: 'z-[90]',
  popover: 'z-[100]',
  toast: 'z-[110]',
  
  loading: 'z-[120]',
  alert: 'z-[130]',
  dialog: 'z-[140]',
  
  max: 'z-[9999]',
} as const;

export type ZIndexKey = keyof typeof zIndex;