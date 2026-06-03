import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { cacheGet, cacheSet, cacheGetStale } from '@/lib/cache'

export type ModuleCategory = 'feature' | 'ministry'

export type AppModule = {
  id: string
  slug: string        // = platform_modules.code
  name: string
  icon: string | null // = platform_modules.icon_name
  isAdmin: boolean    // admin do módulo via tenant_module_admins
  isMember: boolean   // membro/participante do ministério (não admin)
  hasAccess: boolean  // isAdmin || isMember
  category: ModuleCategory
}

// Módulos que são funcionalidades gerais do app — visíveis para todos
const FEATURE_CODES = new Set(['announcements', 'events', 'social_media'])

// Módulos que só aparecem para quem é admin (não há "membro")
const ADMIN_ONLY_CODES = new Set(['financial', 'members'])

// Módulos que aparecem para admin OU para membro/participante do ministério
// A verificação de membership vem de tabelas específicas por módulo
const MEMBER_ACCESS_CODES = new Set(['worship', 'kids', 'bible-school', 'intercession'])

export function useModules(tenantId: string | null | undefined) {
  const [modules, setModules] = useState<AppModule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tenantId === undefined) return
    if (!tenantId) { setLoading(false); return }
    fetchModules()
  }, [tenantId])

  async function fetchModules() {
    setLoading(true)
    setError(null)
    const cacheKey = `modules:${tenantId}`

    // Serve cache fresco imediatamente enquanto busca
    const cached = await cacheGet<AppModule[]>(cacheKey)
    if (cached) setModules(cached)

    try {
      // 1. Módulos ativos do tenant
      const { data, error: err } = await (supabase as any)
        .from('tenant_modules')
        .select('module_id, platform_modules (id, code, name, icon_name)')
        .eq('tenant_id', tenantId as string)
        .eq('status', 'active')

      if (err) throw err

      const allModules: AppModule[] = (data ?? []).flatMap((row: any) => {
        const pm = row.platform_modules
        if (!pm) return []
        const cat: ModuleCategory = FEATURE_CODES.has(pm.code) ? 'feature' : 'ministry'
        return [{
          id: pm.id,
          slug: pm.code,
          name: pm.name,
          icon: pm.icon_name,
          isAdmin: false,
          isMember: false,
          hasAccess: false,
          category: cat,
        }]
      })

      // 2. Busca member_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setModules(allModules); return }

      const { data: profileData } = await (supabase as any)
        .from('profiles')
        .select('member_id')
        .eq('id', user.id)
        .single()

      const memberId: string | null = profileData?.member_id ?? null

      if (!memberId) {
        // Sem member_id: só mostra features
        setModules(allModules.filter(m => m.category === 'feature').map(m => ({ ...m, hasAccess: true })))
        return
      }

      // 3. Checks em paralelo
      const [adminRows, worshipRows, bibleRows, kidsRows, intercessionRows] = await Promise.all([
        // Admin de módulo
        (supabase as any)
          .from('tenant_module_admins')
          .select('module_id')
          .eq('member_id', memberId),

        // Membro do louvor (tem qualquer assignment)
        (supabase as any)
          .from('worship_assignments')
          .select('id')
          .eq('member_id', memberId)
          .limit(1),

        // Aluno da EBD
        (supabase as any)
          .from('bible_school_students')
          .select('id')
          .eq('member_id', memberId)
          .limit(1),

        // Responsável no Kids
        (supabase as any)
          .from('kids_guardians')
          .select('id')
          .eq('member_id', memberId)
          .limit(1),

        // Membro do ministério de intercessão (tem qualquer pedido designado)
        (supabase as any)
          .from('prayer_assignments')
          .select('id')
          .eq('assigned_member_id', memberId)
          .limit(1),
      ])

      const adminModuleIds = new Set((adminRows.data ?? []).map((r: any) => r.module_id))
      const isWorshipMember = (worshipRows.data ?? []).length > 0
      const isBibleStudent = (bibleRows.data ?? []).length > 0
      const isKidsGuardian = (kidsRows.data ?? []).length > 0
      const isIntercessionMember = (intercessionRows.data ?? []).length > 0

      // 4. Aplica regras por módulo
      const result = allModules
        .map(m => {
          const isAdmin = adminModuleIds.has(m.id)

          let isMember = false
          if (m.slug === 'worship') isMember = isWorshipMember
          else if (m.slug === 'bible-school') isMember = isBibleStudent
          else if (m.slug === 'kids') isMember = isKidsGuardian
          else if (m.slug === 'intercession') isMember = isIntercessionMember

          const hasAccess = isAdmin || isMember
          return { ...m, isAdmin, isMember, hasAccess }
        })
        .filter(m => {
          if (m.category === 'feature') return true           // features: sempre visível
          if (ADMIN_ONLY_CODES.has(m.slug)) return m.isAdmin  // admin-only: só admin
          if (MEMBER_ACCESS_CODES.has(m.slug)) return m.hasAccess // membership: admin ou membro
          return m.isAdmin                                    // demais: admin only por padrão
        })

      setModules(result)
      await cacheSet(cacheKey, result)
    } catch {
      const stale = await cacheGetStale<AppModule[]>(cacheKey)
      if (stale) {
        setModules(stale)
        setError('Sem conexão — exibindo dados salvos.')
      } else {
        setError('Não foi possível carregar os módulos.')
      }
    } finally {
      setLoading(false)
    }
  }

  return { modules, loading, error, refetch: fetchModules }
}
