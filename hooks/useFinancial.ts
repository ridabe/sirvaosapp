import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export type FinancialTransaction = {
  id: string
  type: string
  amount: number
  description: string
  date: string
  payment_method: string
  notes: string | null
  category: { id: string; name: string; color: string | null } | null
}

export function useFinancial() {
  const { member } = useAuth()
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!member?.id) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await (supabase as any)
        .from('financial_transactions')
        .select(`
          id, type, amount, description, date, payment_method, notes,
          financial_categories!category_id (id, name, color)
        `)
        .eq('member_id', member.id)
        .order('date', { ascending: false })

      if (err) throw err

      setTransactions((data ?? []).map((row: any) => ({
        ...row,
        category: row.financial_categories ?? null,
      })))
    } catch {
      setError('Não foi possível carregar seu histórico financeiro.')
    } finally {
      setLoading(false)
    }
  }, [member?.id])

  useEffect(() => { fetch() }, [fetch])

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0)

  return { transactions, total, loading, error, refetch: fetch }
}
