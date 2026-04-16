import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
import { CORS_HEADERS, handleOptions } from "@/lib/cors";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return handleOptions(); }

export async function GET(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'dashboard')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS })
    }

    const limit = 50;
    const { data, error } = await supabase
      .from('thong_bao')
      .select('*')
      .order('thoi_gian', { ascending: false })
      .limit(limit);

    if (error) {
      // Bảng chưa tồn tại → trả mảng rỗng, không báo lỗi
      return NextResponse.json({ success: true, data: [] }, { headers: CORS_HEADERS });
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
    }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ success: true, data: [] }, { headers: CORS_HEADERS });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'dashboard')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS })
    }

    let body;
    try { body = await request.json(); } catch { body = {}; }
    const { ids, markAll } = body;

    // Mark ALL as read when no specific ids or markAll flag
    let error;
    if (markAll || !ids || !Array.isArray(ids) || ids.length === 0) {
      ({ error } = await supabase
        .from('thong_bao')
        .update({ da_doc: true })
        .eq('da_doc', false));
    } else {
      ({ error } = await supabase
        .from('thong_bao')
        .update({ da_doc: true })
        .in('id', ids));
    }

    if (error) throw error;
    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (e) {
    console.error('PUT /api/thong-bao error:', e);
    return NextResponse.json({ success: false, error: 'Không thể đánh dấu đã đọc' }, { status: 500, headers: CORS_HEADERS });
  }
}
