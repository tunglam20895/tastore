import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const trang = (body.trang as string) || '/'
    const userAgent = (body.user_agent as string) || null
    const ref = (body.ref as string) || null

    // Bỏ qua các route admin và api
    if (trang.startsWith('/admin') || trang.startsWith('/api')) {
      return NextResponse.json({ success: true })
    }

    await supabase.from('luot_truy_cap').insert({ trang, user_agent: userAgent, ref })
    return NextResponse.json({ success: true })
  } catch {
    // Tracking không block
    return NextResponse.json({ success: true })
  }
}
