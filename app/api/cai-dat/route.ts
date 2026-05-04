import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
import type { CaiDat } from '@/types'
import { CORS_HEADERS, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

export const dynamic = 'force-dynamic'

async function getSettings(): Promise<CaiDat> {
  const { data, error } = await supabase.from('cai_dat').select('key, value')
  console.log('RAW DATA FROM SUPABASE:', JSON.stringify(data))
  console.log('ERROR:', error)
  if (error) throw error
  const map: Record<string, string> = {}
  for (const row of data || []) map[row.key] = row.value || ''
  console.log('MAP:', JSON.stringify(map))
  return {
    logoURL: map['LogoURL'] || '',
    tenShop: map['TenShop'] || 'TRANH ANH STORE',
    sdt: map['SDT'] || '',
    diaChi: map['DiaChi'] || '',
    email: map['Email'] || '',
  }
}

export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json(
        { success: true, data: settings },
        { headers: { 'Cache-Control': 'no-store', ...CORS_HEADERS } }
    )
  } catch (error) {
    console.error('GET /api/cai-dat error:', error)
    return NextResponse.json({ success: false, error: 'Không thể lấy cài đặt' }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!await verifyAccess(request)) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS })
    }

    const body = await request.json() as Partial<CaiDat>
    const keyMap: Record<keyof CaiDat, string> = {
      logoURL: 'LogoURL',
      tenShop: 'TenShop',
      sdt: 'SDT',
      diaChi: 'DiaChi',
      email: 'Email',
    }

    const upserts = Object.entries(body)
        .filter(([k]) => k in keyMap)
        .map(([k, v]) => ({ key: keyMap[k as keyof CaiDat], value: v as string }))

    if (upserts.length > 0) {
      const { error } = await supabase.from('cai_dat').upsert(upserts, { onConflict: 'key' })
      if (error) throw error
    }

    const settings = await getSettings()
    return NextResponse.json(
        { success: true, data: settings },
        { headers: { 'Cache-Control': 'no-store', ...CORS_HEADERS } }
    )
  } catch (error) {
    console.error('PUT /api/cai-dat error:', error)
    return NextResponse.json({ success: false, error: 'Không thể cập nhật cài đặt' }, { status: 500, headers: CORS_HEADERS })
  }
}