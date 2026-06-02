export type ModuleSlug =
  | 'louvor'
  | 'financeiro'
  | 'kids'
  | 'escola-biblica'
  | 'acao-social'

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
}
