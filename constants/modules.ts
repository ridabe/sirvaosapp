import { Ionicons } from '@expo/vector-icons'

export type ModuleSlug =
  | 'louvor'
  | 'financeiro'
  | 'kids'
  | 'escola-biblica'
  | 'acao-social'
  | 'intercessao'

export const MODULE_CONFIG: Record<ModuleSlug, { label: string; route: string; icon: string }> = {
  louvor: {
    label: 'Louvor',
    route: '/(app)/modulos/louvor',
    icon: 'music',
  },
  financeiro: {
    label: 'Financeiro',
    route: '/(app)/modulos/financeiro',
    icon: 'dollar-sign',
  },
  kids: {
    label: 'Kids',
    route: '/(app)/modulos/kids',
    icon: 'users',
  },
  'escola-biblica': {
    label: 'Escola Bíblica',
    route: '/(app)/modulos/escola-biblica',
    icon: 'book-open',
  },
  'acao-social': {
    label: 'Ação Social',
    route: '/(app)/modulos/acao-social',
    icon: 'heart',
  },
  intercessao: {
    label: 'Intercessão',
    route: '/(app)/modulos/intercessao',
    icon: 'hand-right',
  },
}

// Mapeia platform_modules.code (inglês) → rota e ícone do app
export type ModuleCode =
  | 'worship'
  | 'financial'
  | 'kids'
  | 'bible-school'
  | 'social_media'
  | 'announcements'
  | 'events'
  | 'members'
  | 'intercession'

type ModuleRouteConfig = {
  routeSlug: string                             // nome da pasta em app/(app)/modulos/
  icon: keyof typeof Ionicons.glyphMap
  accentColor: string
}

export const MODULE_ROUTE_MAP: Partial<Record<string, ModuleRouteConfig>> = {
  // Ministérios
  worship: {
    routeSlug: 'louvor',
    icon: 'musical-notes-outline',
    accentColor: '#7C3AED',
  },
  financial: {
    routeSlug: 'financeiro',
    icon: 'wallet-outline',
    accentColor: '#059669',
  },
  kids: {
    routeSlug: 'kids',
    icon: 'happy-outline',
    accentColor: '#D97706',
  },
  'bible-school': {
    routeSlug: 'escola-biblica',
    icon: 'book-outline',
    accentColor: '#2563EB',
  },
  members: {
    routeSlug: 'membros',
    icon: 'people-outline',
    accentColor: '#0891B2',
  },
  intercession: {
    routeSlug: 'intercessao',
    icon: 'hand-right-outline',
    accentColor: '#8B5CF6',
  },
  // social_action: não existe no sistema web — removido do MVP

  // Funcionalidades gerais do app
  announcements: {
    routeSlug: 'comunicados',
    icon: 'megaphone-outline',
    accentColor: '#0E6B68',
  },
  events: {
    routeSlug: 'eventos',
    icon: 'calendar-outline',
    accentColor: '#0E6B68',
  },
  social_media: {
    routeSlug: 'midias-sociais',
    icon: 'play-circle-outline',
    accentColor: '#EF4444',
  },
}

/** Retorna a config de rota para um code do banco, ou null se não tiver tela ainda */
export function getModuleRoute(code: string): ModuleRouteConfig | null {
  return MODULE_ROUTE_MAP[code] ?? null
}
