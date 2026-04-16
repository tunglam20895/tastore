import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
import { CORS_HEADERS, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

export async function POST(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'san-pham')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS })
    }

    const formData = await request.formData() as unknown as FormData
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ success: false, error: 'Không có file' }, { status: 400, headers: CORS_HEADERS })
    }

    const bucket = (formData.get('bucket') as string | null) || 'san-pham-images'
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}.${ext}`
    const buffer = await file.arrayBuffer()

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({ success: true, data: { url: publicUrl } }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('POST /api/upload error:', error)
    return NextResponse.json({ success: false, error: 'Không thể upload ảnh' }, { status: 500, headers: CORS_HEADERS })
  }
}
