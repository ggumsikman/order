'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Order } from '@/types/order'

type Step = 'loading' | 'ready' | 'error'

export default function PayPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [step, setStep] = useState<Step>('loading')

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(result => {
        if (result.success && result.order.payment_link) {
          setOrder(result.order)
          setStep('ready')
        } else {
          setStep('error')
        }
      })
      .catch(() => setStep('error'))
  }, [id])

  const qrUrl = order?.payment_link
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(order.payment_link)}`
    : null

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500">결제 링크를 찾을 수 없습니다.</p>
          <p className="text-gray-400 text-sm mt-2">링크가 올바른지 확인해주세요.</p>
        </div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-6 text-white text-center">
        <p className="text-sm opacity-80 mb-1">일비롱디자인</p>
        <h1 className="text-xl font-bold">카드 결제</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6 space-y-4">
        {/* 주문 정보 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">주문 정보</p>
          <p className="font-semibold text-gray-800">{order.customer_name} 고객님</p>
          <p className="text-sm text-gray-500">{order.product_type} · {order.width_cm}×{order.height_cm}cm · {order.quantity}개</p>
        </div>

        {/* QR 코드 */}
        {qrUrl && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-sm text-gray-500 mb-4">QR 코드로 결제하기</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="결제 QR 코드"
              className="w-48 h-48 mx-auto rounded-xl"
            />
            <p className="text-xs text-gray-400 mt-3">카메라로 QR 코드를 스캔하세요</p>
          </div>
        )}

        {/* 결제 링크 버튼 */}
        <a
          href={order.payment_link!}
          target="_blank"
          rel="noreferrer"
          className="block w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-base text-center hover:opacity-90 transition"
        >
          💳 결제하기
        </a>

        <p className="text-xs text-gray-400 text-center">
          결제 관련 문의는 일비롱디자인으로 연락주세요.
        </p>
      </div>
    </div>
  )
}
