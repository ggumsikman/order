'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Order } from '@/types/order'

type Step = 'loading' | 'review' | 'submitting' | 'done' | 'error'

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [step, setStep] = useState<Step>('loading')
  const [action, setAction] = useState<'approve' | 'revise' | null>(null)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [doneMessage, setDoneMessage] = useState('')

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          setOrder(result.order)
          setStep('review')
        } else {
          setStep('error')
        }
      })
      .catch(() => setStep('error'))
  }, [id])

  const handleSubmit = async () => {
    if (!order) return
    if (action === 'revise' && !revisionNotes.trim()) return

    setStep('submitting')
    try {
      const res = await fetch(`/api/orders/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, revision_notes: revisionNotes }),
      })
      const result = await res.json()
      if (result.success) {
        setDoneMessage(
          action === 'approve'
            ? '시안을 확정해 주셨습니다. 감사합니다! 🎉\n곧 생산이 진행됩니다.'
            : '수정 요청이 전달되었습니다.\n일비롱디자인이 확인 후 수정 시안을 보내드릴게요.'
        )
        setStep('done')
      } else {
        setStep('review')
        alert('처리 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } catch {
      setStep('review')
      alert('처리 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

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
          <p className="text-gray-500">시안을 찾을 수 없습니다.</p>
          <p className="text-gray-400 text-sm mt-2">링크가 올바른지 확인해주세요.</p>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm text-center">
          <div className="text-4xl mb-4">{action === 'approve' ? '✅' : '🔄'}</div>
          <p className="text-gray-800 font-semibold whitespace-pre-line">{doneMessage}</p>
        </div>
      </div>
    )
  }

  if (!order) return null

  const isReviewable = order.status === '시안 확인 요청중'
  const hasDrafts = order.draft_images?.length > 0
  const overFreeLimit = order.revision_count >= 2

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-6 text-white text-center">
        <p className="text-sm opacity-80 mb-1">일비롱디자인</p>
        <h1 className="text-xl font-bold">시안 확인 요청</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6 space-y-4">
        {/* 주문 정보 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">주문 정보</p>
          <p className="font-semibold text-gray-800">{order.customer_name} 고객님</p>
          <p className="text-sm text-gray-500">{order.product_type} · {order.width_cm}×{order.height_cm}cm · {order.quantity}개</p>
        </div>

        {/* 시안 이미지 */}
        {hasDrafts ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-3">시안 이미지</p>
            <div className="space-y-3">
              {order.draft_images.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`시안 ${i + 1}`}
                    className="w-full rounded-xl border hover:opacity-90 transition"
                  />
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">이미지를 탭하면 크게 볼 수 있어요</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-gray-400 text-sm">
            시안 이미지가 아직 등록되지 않았습니다.
          </div>
        )}

        {/* 수정 횟수 안내 */}
        {order.revision_count > 0 && (
          <div className={`rounded-2xl p-4 text-sm ${overFreeLimit ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
            {overFreeLimit
              ? `⚠️ 무료 수정 2회를 모두 사용하셨습니다. 추가 수정 요청 시 별도 요금이 발생합니다.`
              : `현재 ${order.revision_count}차 수정 시안입니다. (무료 수정 ${2 - order.revision_count}회 남음)`
            }
          </div>
        )}

        {/* 응답 영역 */}
        {isReviewable ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-sm text-gray-500">시안을 확인하시고 아래에서 선택해주세요.</p>

            {/* 선택 버튼 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAction('approve')}
                className={`py-3 rounded-xl text-sm font-semibold border-2 transition ${action === 'approve' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-green-300'}`}
              >
                ✅ 시안 확정
              </button>
              <button
                onClick={() => setAction('revise')}
                className={`py-3 rounded-xl text-sm font-semibold border-2 transition ${action === 'revise' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-orange-300'}`}
              >
                🔄 수정 요청
              </button>
            </div>

            {/* 수정 요청 시 추가금 경고 */}
            {action === 'revise' && overFreeLimit && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                ⚠️ 무료 수정 2회를 모두 사용하셨습니다.<br />
                추가 수정 요청 시 <strong>별도 요금이 발생</strong>합니다.<br />
                일비롱디자인으로 문의 후 진행해주세요.
              </div>
            )}

            {/* 수정 내용 입력 */}
            {action === 'revise' && (
              <textarea
                value={revisionNotes}
                onChange={e => setRevisionNotes(e.target.value)}
                placeholder="수정 요청 내용을 자세히 적어주세요. (예: 글씨 색상을 파란색으로, 로고 위치를 왼쪽 상단으로)"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                rows={4}
              />
            )}

            {/* 제출 버튼 */}
            {action && (
              <button
                onClick={handleSubmit}
                disabled={step === 'submitting' || (action === 'revise' && !revisionNotes.trim())}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 transition disabled:opacity-40"
              >
                {step === 'submitting' ? '처리 중...' : action === 'approve' ? '시안 확정하기' : '수정 요청 보내기'}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center text-sm text-gray-500">
            {order.status === '시안 확정' && '✅ 이미 확정된 시안입니다.'}
            {order.status === '시안 수정 요청' && '수정 요청이 접수되었습니다. 잠시만 기다려주세요.'}
            {order.status === '완료' && '주문이 완료되었습니다. 감사합니다!'}
            {!['시안 확정', '시안 수정 요청', '완료'].includes(order.status) && '현재 응답할 수 없는 상태입니다.'}
          </div>
        )}
      </div>
    </div>
  )
}
