import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess, getAuthenticatedActorName } from '@/lib/auth'
import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'
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
    nguoiXuLy: (row.nguoi_xu_ly as string) || 'Chưa có',
  }
}

async function getNguoiXuLy(request: NextRequest): Promise<string> {
  return (await getAuthenticatedActorName(request)) || 'Chưa có'
}

// POST: nhận danh sách id, điền vào template Excel, rồi chuyển trạng thái sang "Đã lên đơn"
export async function POST(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'don-hang')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const body = await request.json()
    const ids: string[] = body.ids || []

    if (!ids.length) {
      return NextResponse.json({ success: false, error: 'Không có đơn hàng nào được chọn' }, { status: 400 })
    }

    // Fetch các đơn hàng được chọn
    const { data, error } = await supabase
      .from('don_hang')
      .select('*')
      .in('id', ids)
      .order('thoi_gian', { ascending: true })

    if (error) throw error
    const orders = (data || []).map(mapRow)

    // Đọc file template gốc
    const templatePath = path.join(process.cwd(), 'template', 'ExcelTemplateVi.xlsx')
    const templateBuffer = fs.readFileSync(templatePath)

    const wb = new ExcelJS.Workbook()
    // @ts-expect-error - ExcelJS type conflict with Node.js Buffer in strict mode
    await wb.xlsx.load(templateBuffer)
    const ws = wb.getWorksheet(1)!

    // Xoá dữ liệu từ row 7 trở đi (giữ nguyên header row 6 và metadata row 1-5)
    const startRow = 7
    const maxRow = ws.rowCount || 500
    for (let r = maxRow; r >= startRow; r--) {
      ws.spliceRows(r, 1)
    }

    // Điền dữ liệu đơn hàng từ row 7
    orders.forEach((order, idx) => {
      const r = startRow + idx // 1-based

      const sanPhamText = order.sanPham
        .map((sp) => `${sp.ten}${sp.sizeChon ? ' (' + sp.sizeChon + ')' : ''} x${sp.soLuong}`)
        .join('; ')

      const rowData: (string | number)[] = [
        idx + 1,           // A: Số dòng
        order.tenKH,       // B: *Tên đầy đủ
        order.sdt,         // C: *Số điện thoại
        '',                // D: Hành chính
        order.diaChi,      // E: *Địa chỉ
        'Tiết kiệm',       // F: *Dịch vụ
        'Bên gửi trả phí', // G: *Phương thức thanh toán
        order.id,          // H: Mã ID đặt chỗ
        order.tongTien,    // I: Tiền COD
        0,                 // J: Bảo hiểm
        1,                 // K: Cân nặng kg
        '',                // L: Dài
        '',                // M: Rộng
        '',                // N: Cao
        'cloth',           // O: Phân loại hàng hoá
        sanPhamText,       // P: Lưu ý
      ]

      const newRow = ws.getRow(r)
      rowData.forEach((val, c) => {
        const cell = newRow.getCell(c + 1)
        cell.value = val
      })

      // Copy style từ row header (row 6) sang data row để giữ formatting
      const headerRow = ws.getRow(6)
      if (headerRow.height) newRow.height = headerRow.height
      for (let c = 1; c <= 16; c++) {
        const cell = newRow.getCell(c)
        const hCell = headerRow.getCell(c)
        if (hCell.font) cell.font = { ...hCell.font }
        if (hCell.alignment) cell.alignment = { ...hCell.alignment }
        if (hCell.numFmt) cell.numFmt = hCell.numFmt
        if (hCell.border) cell.border = { ...hCell.border }
        if (hCell.fill) cell.fill = { ...hCell.fill }
      }
    })

    // Export Excel
    const nguoiXuLy = await getNguoiXuLy(request)

    // Xuất buffer giữ nguyên style
    const buffer = await wb.xlsx.writeBuffer()

    // Cập nhật tất cả đơn sang "Đã lên đơn" và gán người xử lý
    await supabase
      .from('don_hang')
      .update({ trang_thai: 'Đã lên đơn', nguoi_xu_ly: nguoiXuLy })
      .in('id', ids)

    const date = new Date().toISOString().slice(0, 10)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="don-hang-${date}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('POST /api/don-hang/export-excel error:', error)
    return NextResponse.json({ success: false, error: 'Không thể xuất file' }, { status: 500 })
  }
}
