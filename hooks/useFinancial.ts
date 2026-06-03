import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cacheGet, cacheSet, cacheGetStale } from '@/lib/cache'

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

export type MonthlyBar = {
  label: string
  income: number
  expense: number
}

// Módulo financeiro é exclusivo de admins — quem acessa esta tela já tem permissão.
// O hook busca TODAS as transações do tenant sem filtro por membro.
export function useFinancial() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [categories, setCategories] = useState<FinancialCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!profile?.tenant_id) return
    setLoading(true)
    setError(null)
    const cacheKey = `financial:${profile.tenant_id}`

    const cached = await cacheGet<{ transactions: FinancialTransaction[]; categories: FinancialCategory[] }>(cacheKey)
    if (cached) { setTransactions(cached.transactions); setCategories(cached.categories) }

    try {
      const [txRes, catRes] = await Promise.all([
        (supabase as any)
          .from('financial_transactions')
          .select(`
            id, type, amount, description, date, payment_method, notes, member_id,
            financial_categories!category_id (id, name, type, color)
          `)
          .order('date', { ascending: false }),
        (supabase as any)
          .from('financial_categories')
          .select('id, name, type, color')
          .order('type')
          .order('sort_order'),
      ])

      if (txRes.error) throw txRes.error

      setTransactions((txRes.data ?? []).map((row: any) => ({
        ...row,
        amount: Number(row.amount),
        category: row.financial_categories ?? null,
      })))
      const cats = catRes.data ?? []
      setCategories(cats)
      await cacheSet(cacheKey, { transactions: (txRes.data ?? []).map((row: any) => ({
        ...row, amount: Number(row.amount), category: row.financial_categories ?? null,
      })), categories: cats })
    } catch {
      const stale = await cacheGetStale<{ transactions: FinancialTransaction[]; categories: FinancialCategory[] }>(cacheKey)
      if (stale) {
        setTransactions(stale.transactions)
        setCategories(stale.categories)
        setError('Sem conexão — exibindo dados salvos.')
      } else {
        setError('Não foi possível carregar o financeiro.')
      }
    } finally {
      setLoading(false)
    }
  }, [profile?.tenant_id])

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

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense
  const monthlyData = buildMonthlyData(transactions)

  return {
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

function buildMonthlyData(transactions: FinancialTransaction[]): MonthlyBar[] {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const label = d.toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '').replace(/^\w/, c => c.toUpperCase())
    const inMonth = transactions.filter(t => {
      const td = new Date(t.date)
      return td.getFullYear() === year && td.getMonth() === month
    })
    return {
      label,
      income: inMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: inMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  })
}
