import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'dashboard')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const limit = 50;
    const { data, error } = await supabase
      .from('thong_bao')
      .select('*')
      .order('thoi_gian', { ascending: false })
      .limit(limit);

    if (error) {
      // Bảng chưa tồn tại → trả mảng rỗng, không báo lỗi
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map((row) => ({
        id: row.id,
        loai: row.loai,
        donHangId: row.don_hang_id,
        tenKH: row.ten_kh,
        tenSP: row.ten_sp,
        nguoiXuLy: row.nguoi_xu_ly,
        trangThaiCu: row.trang_thai_cu,
        trangThaiMoi: row.trang_thai_moi,
        daDoc: row.da_doc,
        thoiGian: row.thoi_gian,
      })),
    });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'dashboard')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ success: false, error: 'Thiếu IDs' }, { status: 400 });
    }

    const { error } = await supabase
      .from('thong_bao')
      .update({ da_doc: true })
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('PUT /api/thong-bao error:', e);
    return NextResponse.json({ success: false, error: 'Không thể đánh dấu đã đọc' }, { status: 500 });
  }
}
