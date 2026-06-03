import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export type FinancialCategory = {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string | null
}

export type FinancialTransaction = {
  id: string
  type: string
  amount: number
  description: string
  date: string
  payment_method: string
  notes: string | null
  member_id: string | null
  category: FinancialCategory | null
}

export type NewTransaction = {
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  payment_method: string
  category_id: string | null
  member_id: string | null
  notes: string | null
}

export function useFinancial() {
  const { profile, member } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [categories, setCategories] = useState<FinancialCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verifica se o usuário é admin do módulo financeiro
  const checkAdmin = useCallback(async () => {
    if (!profile?.member_id) return false
    const { data } = await (supabase as any)
      .from('tenant_module_admins')
      .select('id')
      .eq('member_id', profile.member_id)
      .in('module_id', [
        // Busca o id do platform_module 'financial'
        (await (supabase as any)
          .from('platform_modules')
          .select('id')
          .eq('code', 'financial')
          .single()
        ).data?.id,
      ])
      .limit(1)
    return (data?.length ?? 0) > 0
  }, [profile?.member_id])

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Resolve admin status
      const admin = await checkAdmin()
      setIsAdmin(admin)

      // Busca categorias
      const { data: cats } = await (supabase as any)
        .from('financial_categories')
        .select('id, name, type, color')
        .order('type')
        .order('sort_order')
      setCategories(cats ?? [])

      // Busca transações conforme papel
      let query = (supabase as any)
        .from('financial_transactions')
        .select(`
          id, type, amount, description, date, payment_method, notes, member_id,
          financial_categories!category_id (id, name, type, color)
        `)
        .order('date', { ascending: false })

      if (!admin && member?.id) {
        // Membro comum: só as suas
        query = query.eq('member_id', member.id)
      }
      // Admin: sem filtro → vê todas

      const { data, error: err } = await query
      if (err) throw err

      setTransactions((data ?? []).map((row: any) => ({
        ...row,
        amount: Number(row.amount),
        category: row.financial_categories ?? null,
      })))
    } catch {
      setError('Não foi possível carregar o financeiro.')
    } finally {
      setLoading(false)
    }
  }, [checkAdmin, member?.id])

  useEffect(() => { fetch() }, [fetch])

  async function addTransaction(tx: NewTransaction): Promise<void> {
    setSaving(true)
    try {
      const { error: err } = await (supabase as any)
        .from('financial_transactions')
        .insert({
          tenant_id: profile?.tenant_id,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          date: tx.date,
          payment_method: tx.payment_method,
          category_id: tx.category_id,
          member_id: tx.member_id,
          notes: tx.notes,
          created_by: profile?.id,
        })
      if (err) throw err
      await fetch()
    } finally {
      setSaving(false)
    }
  }

  // Totais
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  // Agrupado por mês (últimos 6) para o gráfico
  const monthlyData = buildMonthlyData(transactions)

  return {
    isAdmin,
    transactions,
    categories,
    totalIncome,
    totalExpense,
    balance,
    monthlyData,
    loading,
    saving,
    error,
    refetch: fetch,
    addTransaction,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export type MonthlyBar = {
  label: string   // "Jan", "Fev" ...
  income: number
  expense: number
}

function buildMonthlyData(transactions: FinancialTransaction[]): MonthlyBar[] {
  const now = new Date()
  const bars: MonthlyBar[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() // 0-indexed
    const label = d.toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '').replace(/^\w/, c => c.toUpperCase())

    const inMonth = transactions.filter(t => {
      const td = new Date(t.date)
      return td.getFullYear() === year && td.getMonth() === month
    })

    bars.push({
      label,
      income: inMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: inMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    })
  }
  return bars
}
