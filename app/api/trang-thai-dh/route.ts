import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAdminPassword } from '@/lib/auth'
import { CORS_HEADERS, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS() { return handleOptions(); }

const DEFAULT_COLORS = [
  { key: "Mới", ten: "Mới", mau: "#3B82F6", thuTu: 1 },
  { key: "Chốt để lên đơn", ten: "Chốt để lên đơn", mau: "#A855F7", thuTu: 2 },
  { key: "Đã lên đơn", ten: "Đã lên đơn", mau: "#14B8A6", thuTu: 3 },
  { key: "Đang xử lý", ten: "Đang xử lý", mau: "#F59E0B", thuTu: 4 },
  { key: "Đã giao", ten: "Đã giao", mau: "#22C55E", thuTu: 5 },
  { key: "Huỷ", ten: "Huỷ", mau: "#EF4444", thuTu: 6 },
];

// GET — công khai, trả default nếu bảng chưa tồn tại
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('trang_thai_don_hang')
      .select('*')
      .order('thu_tu', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, data: DEFAULT_COLORS }, { headers: CORS_HEADERS });
    }

    return NextResponse.json({
      success: true,
      data: data.map((row) => ({
        key: row.key,
        ten: row.ten,
        mau: row.mau,
        thuTu: row.thu_tu,
      })),
    }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ success: true, data: DEFAULT_COLORS }, { headers: CORS_HEADERS });
  }
}

// PUT — chỉ admin, cập nhật màu
export async function PUT(request: NextRequest) {
  try {
    const pw = request.headers.get('x-admin-password');
    if (!pw || !verifyAdminPassword(pw)) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const { key, mau } = body;

    if (!key || !mau) {
      return NextResponse.json({ success: false, error: 'Thiếu key hoặc màu' }, { status: 400, headers: CORS_HEADERS });
    }

    const { error } = await supabase
      .from('trang_thai_don_hang')
      .update({ mau })
      .eq('key', key);

    if (error) throw error;

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (e) {
    console.error('PUT /api/trang-thai-dh error:', e);
    return NextResponse.json({ success: false, error: 'Không thể cập nhật màu' }, { status: 500, headers: CORS_HEADERS });
  }
}

// POST — chỉ admin, thêm trạng thái mới
export async function POST(request: NextRequest) {
  try {
    const pw = request.headers.get('x-admin-password');
    if (!pw || !verifyAdminPassword(pw)) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const { ten, mau } = body;

    if (!ten?.trim()) {
      return NextResponse.json({ success: false, error: 'Thiếu tên trạng thái' }, { status: 400, headers: CORS_HEADERS });
    }

    // Kiểm tra trùng key
    const { data: existing } = await supabase
      .from('trang_thai_don_hang')
      .select('key')
      .eq('key', ten.trim())
      .single();

    if (existing) {
      return NextResponse.json({ success: false, error: 'Trạng thái đã tồn tại' }, { status: 409, headers: CORS_HEADERS });
    }

    // Lấy thu_tu cao nhất + 1
    const { data: all } = await supabase
      .from('trang_thai_don_hang')
      .select('thu_tu')
      .order('thu_tu', { ascending: false })
      .limit(1);

    const nextThuTu = (all?.[0]?.thu_tu ?? 0) + 1;

    const { data, error } = await supabase
      .from('trang_thai_don_hang')
      .insert({
        key: ten.trim(),
        ten: ten.trim(),
        mau: mau || '#6B7280',
        thu_tu: nextThuTu,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { key: data.key, ten: data.ten, mau: data.mau, thuTu: data.thu_tu },
    }, { headers: CORS_HEADERS });
  } catch (e) {
    console.error('POST /api/trang-thai-dh error:', e);
    return NextResponse.json({ success: false, error: 'Không thể thêm trạng thái' }, { status: 500, headers: CORS_HEADERS });
  }
}

// DELETE — chỉ admin, xóa trạng thái
export async function DELETE(request: NextRequest) {
  try {
    const pw = request.headers.get('x-admin-password');
    if (!pw || !verifyAdminPassword(pw)) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ success: false, error: 'Thiếu key' }, { status: 400, headers: CORS_HEADERS });
    }

    const { error } = await supabase
      .from('trang_thai_don_hang')
      .delete()
      .eq('key', key);

    if (error) throw error;

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (e) {
    console.error('DELETE /api/trang-thai-dh error:', e);
    return NextResponse.json({ success: false, error: 'Không thể xóa trạng thái' }, { status: 500, headers: CORS_HEADERS });
  }
}
