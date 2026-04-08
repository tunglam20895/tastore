import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { appendDonHangToSheet } from '@/lib/google-sheets'
import { sendOrderNotification } from '@/lib/telegram'
import { verifyAccess } from '@/lib/auth'
import type { DonHang } from '@/types'

function mapRow(row: Record<string, unknown>): DonHang {
  return {
    id: row.id as string,
    tenKH: row.ten_kh as string,
    sdt: row.sdt as string,
    diaChi: row.dia_chi as string,
    sanPham: row.san_pham as DonHang['sanPham'],
    tongTien: Number(row.tong_tien),
    thoiGian: row.thoi_gian as string,
    trangThai: row.trang_thai as DonHang['trangThai'],
    maGiamGia: row.ma_giam_gia as string | undefined,
    giaTriGiam: Number(row.gia_tri_giam ?? 0),
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'don-hang')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') ? Math.max(1, parseInt(searchParams.get('page')!)) : null
    const limit = page ? Math.max(1, parseInt(searchParams.get('limit') || '20')) : null
    const trangThai = searchParams.get('trang_thai') || ''
    const sdt = searchParams.get('sdt') || ''
    const searchTen = searchParams.get('search_ten') || ''
    const searchSdt = searchParams.get('search_sdt') || ''
    const tuNgay = searchParams.get('tu_ngay') || ''
    const denNgay = searchParams.get('den_ngay') || ''

    let query = supabase.from('don_hang').select('*', { count: page ? 'exact' : undefined }).order('thoi_gian', { ascending: false })
    if (trangThai) query = query.eq('trang_thai', trangThai)
    if (sdt) query = query.eq('sdt', sdt)
    if (searchTen) query = query.ilike('ten_kh', `%${searchTen}%`)
    if (searchSdt) query = query.ilike('sdt', `%${searchSdt}%`)
    if (tuNgay) query = query.gte('thoi_gian', tuNgay)
    if (denNgay) query = query.lte('thoi_gian', denNgay + 'T23:59:59Z')
    if (page && limit) {
      const from = (page - 1) * limit
      query = query.range(from, from + limit - 1)
    }

    const { data, error, count } = await query
    if (error) throw error

    if (page && limit) {
      const total = count ?? 0
      return NextResponse.json({
        success: true,
        data: (data || []).map(mapRow),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    }

    return NextResponse.json({ success: true, data: (data || []).map(mapRow) })
  } catch (error) {
    console.error('GET /api/don-hang error:', error)
    return NextResponse.json({ success: false, error: 'Không thể lấy danh sách đơn hàng' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let giaTriGiam = 0
    let maGiamGia: string | undefined

    // Validate và tính giá trị giảm nếu có mã
    if (body.maGiamGia) {
      const maMaUppercase = (body.maGiamGia as string).toUpperCase().trim()
      const { data: maData } = await supabase
          .from('ma_giam_gia')
          .select('*')
          .eq('ma', maMaUppercase)
          .single()

      if (
          maData &&
          maData.con_hieu_luc &&
          maData.da_dung < maData.so_luong &&
          (!maData.ngay_het_han || new Date(maData.ngay_het_han) >= new Date()) &&
          body.tongTien >= Number(maData.don_hang_toi_thieu)
      ) {
        if (maData.loai === 'phan_tram') {
          giaTriGiam = Math.round(body.tongTien * Number(maData.gia_tri) / 100)
          if (maData.gia_tri_toi_da) {
            giaTriGiam = Math.min(giaTriGiam, Number(maData.gia_tri_toi_da))
          }
        } else {
          giaTriGiam = Math.min(Number(maData.gia_tri), body.tongTien)
        }
        maGiamGia = maMaUppercase
      }
    }

    const tongTienSauGiam = Math.max(0, body.tongTien - giaTriGiam)

    const { data, error } = await supabase
        .from('don_hang')
        .insert({
          ten_kh: body.tenKH,
          sdt: body.sdt,
          dia_chi: body.diaChi,
          san_pham: body.sanPham,
          tong_tien: tongTienSauGiam,
          ma_giam_gia: maGiamGia || null,
          gia_tri_giam: giaTriGiam,
        })
        .select()
        .single()

    if (error) throw error
    const donHang = mapRow(data)

    // Tăng da_dung của mã giảm giá (fire-and-forget)
    if (maGiamGia) {
      const capturedMa = maGiamGia;
      (async () => {
        try {
          const { data: mgg } = await supabase
              .from('ma_giam_gia')
              .select('da_dung')
              .eq('ma', capturedMa)
              .single()
          if (mgg) {
            await supabase
                .from('ma_giam_gia')
                .update({ da_dung: Number(mgg.da_dung) + 1 })
                .eq('ma', capturedMa)
          }
        } catch {
          // fire-and-forget, bỏ qua lỗi
        }
      })()
    }

    // Trừ tồn kho (fire-and-forget)
    for (const item of donHang.sanPham) {
      (async () => {
        try {
          if (item.sizeChon) {
            await supabase.rpc('decrement_size_so_luong', {
              p_product_id: item.id,
              p_size_name: item.sizeChon,
              p_quantity: item.soLuong,
            })
          } else {
            await supabase.rpc('decrement_so_luong', {
              product_id: item.id,
              quantity: item.soLuong,
            })
          }
        } catch {
          // fire-and-forget, bỏ qua lỗi
        }
      })()
    }

    // Upsert khach_hang + gửi Telegram (fire-and-forget)
    ;(async () => {
      try {
        await supabase.rpc('upsert_khach_hang', {
          p_sdt: body.sdt,
          p_ten: body.tenKH,
          p_doanh_thu: tongTienSauGiam,
        })
        const { data: kh } = await supabase
          .from('khach_hang')
          .select('trang_thai, tong_don, tong_doanh_thu')
          .eq('sdt', body.sdt)
          .single()
        await sendOrderNotification(
          donHang,
          kh
            ? {
                trangThai: kh.trang_thai as string,
                tongDon: Number(kh.tong_don),
                tongDoanhThu: Number(kh.tong_doanh_thu),
              }
            : undefined
        )
      } catch {
        // fire-and-forget
        try { await sendOrderNotification(donHang) } catch { /* ignore */ }
      }
    })()

    // fire-and-forget sheets
    Promise.allSettled([
      appendDonHangToSheet(donHang),
    ]).catch(() => {})

    return NextResponse.json({ success: true, data: donHang })
  } catch (error) {
    console.error('POST /api/don-hang error:', error)
    return NextResponse.json({ success: false, error: 'Không thể tạo đơn hàng' }, { status: 500 })
  }
}