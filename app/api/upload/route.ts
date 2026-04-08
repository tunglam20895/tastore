import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'san-pham')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ success: false, error: 'Không có file' }, { status: 400 })
    }

    const bucket = formData.get('bucket') as string || 'san-pham-images'
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

    return NextResponse.json({ success: true, data: { url: publicUrl } })
  } catch (error) {
    console.error('POST /api/upload error:', error)
    return NextResponse.json({ success: false, error: 'Không thể upload ảnh' }, { status: 500 })
  }
}
