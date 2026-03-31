import nodemailer from 'nodemailer'
import { Order } from '@/types/order'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendOrderNotification(order: Order) {
  const mailOptions = {
    from: `"일비롱디자인 주문시스템" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `[일비롱디자인] 새 주문 접수 - ${order.customer_name} 고객님`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899, #a855f7); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">새 주문이 접수되었습니다!</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; overflow: hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr style="background: #f9fafb;">
              <td style="padding: 12px 16px; font-weight: bold; width: 140px; border-bottom: 1px solid #e5e7eb;">고객명</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">${order.customer_name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">연락처</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">${order.phone}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">제품 종류</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">${order.product_type}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">디자인 방식</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">${order.design_type}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">사이즈</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">가로 ${order.width_cm ?? '-'}cm × 세로 ${order.height_cm ?? '-'}cm</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">수량</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">${order.quantity}개</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">문구 수정</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">${order.text_corrections || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">배송주소</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">${order.shipping_address}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">결제방법</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">${order.payment_method}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-weight: bold;">기타 요청</td>
              <td style="padding: 12px 16px;">${order.other_requests || '-'}</td>
            </tr>
          </table>
        </div>
        <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 16px;">
          관리자 페이지에서 주문 상태를 확인하고 업데이트하세요.
        </p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}
