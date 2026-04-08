import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { generateMoTa } from '@/lib/openrouter'
import { verifyAccess } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'san-pham')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const { tenSanPham, danhMuc } = await request.json()

    if (!tenSanPham) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tên sản phẩm' },
        { status: 400 }
      )
    }

    const moTa = await generateMoTa(tenSanPham, danhMuc || 'thời trang nữ')
    return NextResponse.json({ success: true, data: moTa })
  } catch (error) {
    console.error('POST /api/generate-mo-ta error:', error)
    return NextResponse.json(
      { success: false, error: 'Không thể tạo mô tả' },
      { status: 500 }
    )
  }
}
