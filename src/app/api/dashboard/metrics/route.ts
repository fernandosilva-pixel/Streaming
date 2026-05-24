import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TEST_TITLES = ['55', '4', '1 real', 'tester', 'Testa cashback', 'Teste Pag']

export async function GET() {
  const [{ data: pays }, { data: plans }] = await Promise.all([
    supabase.from('payments').select('stream_id, stream_title, user_phone, amount, status, created_at').eq('status', 'PAID'),
    supabase.from('plan_payments').select('user_email, amount, status, plan_type, created_at').eq('status', 'PAID'),
  ])

  const allPays = pays ?? []
  const allPlans = plans ?? []

  const isTest = (p: { stream_title?: string | null; amount?: number | null }) =>
    TEST_TITLES.includes(p.stream_title ?? '') || (p.amount != null && p.amount <= 1.20 && p.stream_title == null)

  const realPays = allPays.filter(p => !isTest(p))
  const testPays = allPays.filter(p => isTest(p))

  const pixRevenue = realPays.reduce((s, p) => s + (p.amount ?? 0), 0)
  const planRevenue = allPlans.reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalRevenue = pixRevenue + planRevenue

  const testRevenue = testPays.reduce((s, p) => s + (p.amount ?? 0), 0)

  // Receita por live
  const byStream: Record<string, { title: string; vendas: number; receita: number }> = {}
  for (const p of realPays) {
    const key = p.stream_id ?? 'sem_id'
    const title = p.stream_title ?? '(sem título)'
    if (!byStream[key]) byStream[key] = { title, vendas: 0, receita: 0 }
    byStream[key].vendas++
    byStream[key].receita += p.amount ?? 0
  }
  const streamBreakdown = Object.values(byStream).sort((a, b) => b.receita - a.receita)

  // Planos
  const planBreakdown = { mensal: { vendas: 0, receita: 0 }, semanal: { vendas: 0, receita: 0 } }
  for (const p of allPlans) {
    const key = p.plan_type === 'semanal' ? 'semanal' : 'mensal'
    planBreakdown[key].vendas++
    planBreakdown[key].receita += p.amount ?? 0
  }

  return NextResponse.json({
    total_revenue: totalRevenue,
    pix_revenue: pixRevenue,
    pix_count: realPays.length,
    plan_revenue: planRevenue,
    plan_count: allPlans.length,
    test_revenue: testRevenue,
    test_count: testPays.length,
    stream_breakdown: streamBreakdown,
    plan_breakdown: planBreakdown,
  })
}
