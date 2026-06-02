import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type AppModule = {
  id: string
  slug: string
  name: string
  icon: string | null
  isAdmin: boolean
}

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
    try {
      const { data, error: err } = await supabase
        .from('tenant_modules')
        .select('id, platform_modules (id, slug, name, icon)')
        .eq('tenant_id', tenantId as string)
        .eq('status', 'active')

      if (err) throw err

      const result: AppModule[] = (data ?? []).flatMap((row: any) => {
        const pm = row.platform_modules
        if (!pm) return []
        return [{ id: pm.id, slug: pm.slug, name: pm.name, icon: pm.icon, isAdmin: false }]
      })

      // Verifica papel de admin por módulo (tabela opcional — ignora se não existir)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: adminRows } = await supabase
          .from('tenant_module_admins')
          .select('module_id')
          .eq('profile_id', user.id)

        if (adminRows) {
          const adminIds = new Set(adminRows.map((r: any) => r.module_id))
          result.forEach(m => { m.isAdmin = adminIds.has(m.id) })
        }
      }

      setModules(result)
    } catch {
      setError('Não foi possível carregar os módulos.')
    } finally {
      setLoading(false)
    }
  }

  return { modules, loading, error, refetch: fetchModules }
}
