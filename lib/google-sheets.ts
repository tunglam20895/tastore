import { google } from 'googleapis'
import type { DonHang } from '@/types'

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ'
}

function formatDateVN(isoString: string): string {
  const d = new Date(isoString)
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  const dd = String(vn.getUTCDate()).padStart(2, '0')
  const mm = String(vn.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = vn.getUTCFullYear()
  const hh = String(vn.getUTCHours()).padStart(2, '0')
  const min = String(vn.getUTCMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

export async function appendDonHangToSheet(donHang: DonHang): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  if (!spreadsheetId) {
    console.error('[google-sheets] GOOGLE_SHEET_ID not set')
    return
  }

  const sheets = google.sheets({ version: 'v4', auth })

  const sanPhamStr = donHang.sanPham
    .map((sp) => `${sp.ten} x${sp.soLuong} - ${formatVND(sp.giaHienThi)}`)
    .join(', ')

  const tamTinh = donHang.tongTien + donHang.giaTriGiam

  const row = [
    donHang.id,
    formatDateVN(donHang.thoiGian),
    donHang.tenKH,
    donHang.sdt,
    donHang.diaChi,
    sanPhamStr,
    formatVND(tamTinh),
    donHang.maGiamGia || '',
    donHang.giaTriGiam > 0 ? `-${formatVND(donHang.giaTriGiam)}` : '',
    formatVND(donHang.tongTien),
    donHang.trangThai,
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'DonHang!A:K',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
}
