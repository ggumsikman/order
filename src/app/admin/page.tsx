'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Order, OrderItem, OrderStatus, DraftRevision } from '@/types/order'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '1234'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ilbirong.vercel.app'

const ALL_STATUSES: OrderStatus[] = ['접수', '작업중', '시안 확인 요청중', '시안 수정 요청', '시안 수정 작업중', '시안 확정', '완료', '취소']

const STATUS_COLORS: Record<OrderStatus, string> = {
  '접수': 'bg-blue-100 text-blue-700',
  '작업중': 'bg-purple-100 text-purple-700',
  '시안 확인 요청중': 'bg-yellow-100 text-yellow-700',
  '시안 수정 요청': 'bg-orange-100 text-orange-700',
  '시안 수정 작업중': 'bg-pink-100 text-pink-700',
  '시안 확정': 'bg-teal-100 text-teal-700',
  '완료': 'bg-green-100 text-green-700',
  '취소': 'bg-gray-100 text-gray-500',
}

const FILTER_TABS = ['전체', '접수', '작업중', '시안 확인 요청중', '시안 수정 요청', '시안 수정 작업중', '시안 확정', '완료', '취소'] as const

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<typeof FILTER_TABS[number]>('전체')
  const [selected, setSelected] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)

  // 시안 업로드 상태
  const [draftUploading, setDraftUploading] = useState(false)
  const [draftSending, setDraftSending] = useState(false)
  const [draftUploadError, setDraftUploadError] = useState('')
  const [newDraftUrls, setNewDraftUrls] = useState<string[]>([])
  const [replacingDraft, setReplacingDraft] = useState(false)
  const [copied, setCopied] = useState(false)
  const [payCopied, setPayCopied] = useState(false)
  const [paymentLinkInput, setPaymentLinkInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders')
      const result = await res.json()
      if (result.success) setOrders(result.orders)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) fetchOrders()
  }, [isLoggedIn, fetchOrders])

  // 선택된 주문이 바뀔 때 시안 업로드 상태 초기화
  useEffect(() => {
    setNewDraftUrls([])
    setCopied(false)
    setPayCopied(false)
    setDraftUploadError('')
    setReplacingDraft(false)
    setPaymentLinkInput(selected?.payment_link || '')
  }, [selected?.id, selected?.payment_link])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true)
    } else {
      setLoginError('비밀번호가 틀렸습니다.')
    }
  }

  const updateOrder = async (id: string, patch: Partial<Order>) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const result = await res.json()
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...result.order } : o))
      if (selected?.id === id) setSelected(result.order)
    }
    return result
  }

  const deleteOrder = async (id: string) => {
    if (!confirm('이 주문을 완전히 삭제하시겠습니까? 복구할 수 없습니다.')) return
    const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) {
      setOrders(prev => prev.filter(o => o.id !== id))
      setSelected(null)
    }
  }

  const uploadDraftFiles = async (files: FileList) => {
    setDraftUploading(true)
    setDraftUploadError('')
    const urls: string[] = []
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          setDraftUploadError(`"${file.name}" 파일이 너무 큽니다. 10MB 이하만 가능합니다.`)
          continue
        }
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          setDraftUploadError('업로드 실패: 서버 오류가 발생했습니다.')
          continue
        }
        const result = await res.json()
        if (result.success) {
          urls.push(result.url)
        } else {
          setDraftUploadError(`업로드 실패: ${result.error || '알 수 없는 오류'}`)
        }
      }
      if (urls.length > 0) setNewDraftUrls(prev => [...prev, ...urls])
    } catch {
      setDraftUploadError('업로드 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setDraftUploading(false)
    }
  }

  const sendDraft = async () => {
    if (!selected || newDraftUrls.length === 0) return
    setDraftSending(true)
    try {
      const revisionCount = selected.revision_count ?? 0
      const label = revisionCount === 0 ? '최초 시안' : `${revisionCount}차 수정 시안`
      const newEntry: DraftRevision = { revision: revisionCount, label, images: newDraftUrls }
      const history = [...(selected.draft_history || []), newEntry]
      const result = await updateOrder(selected.id, {
        draft_images: newDraftUrls,
        draft_history: history,
        status: '시안 확인 요청중',
      })
      if (result.success) {
        setNewDraftUrls([])
        setDraftUploadError('')
      } else {
        alert(`시안 발송에 실패했습니다.\n오류: ${result.error || '알 수 없는 오류'}`)
      }
    } catch {
      alert('오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setDraftSending(false)
    }
  }

  const copyReviewLink = (id: string) => {
    navigator.clipboard.writeText(`${BASE_URL}/review/${id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyPayLink = (id: string) => {
    navigator.clipboard.writeText(`${BASE_URL}/pay/${id}`)
    setPayCopied(true)
    setTimeout(() => setPayCopied(false), 2000)
  }

  const savePaymentLink = async () => {
    if (!selected) return
    await updateOrder(selected.id, { payment_link: paymentLinkInput.trim() || null } as Partial<Order>)
  }

  const filtered = filter === '전체' ? orders : orders.filter(o => o.status === filter)
  const counts = FILTER_TABS.reduce((acc, tab) => {
    acc[tab] = tab === '전체' ? orders.length : orders.filter(o => o.status === tab).length
    return acc
  }, {} as Record<string, number>)

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl mx-auto mb-3 flex items-center justify-center text-white text-xl">🔒</div>
            <h1 className="text-lg font-bold text-gray-800">관리자 페이지</h1>
            <p className="text-sm text-gray-500 mt-1">일비롱디자인</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setLoginError('') }}
              placeholder="비밀번호"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition">
              로그인
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-800">일비롱디자인 관리자</h1>
            <p className="text-xs text-gray-400">주문 관리 페이지</p>
          </div>
          <button onClick={fetchOrders} className="text-sm text-pink-500 hover:text-pink-700 font-medium">
            새로고침
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 탭 필터 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${filter === tab ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              {tab} <span className="ml-1 opacity-70">({counts[tab] ?? 0})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">주문이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <div
                key={order.id}
                onClick={() => setSelected(order)}
                className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                      {order.revision_count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.revision_count > 2 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                          {order.revision_count > 2 ? `💰 ${order.revision_count}차 수정` : `${order.revision_count}차 수정`}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="font-semibold text-gray-800">{order.customer_name} <span className="font-normal text-gray-500 text-sm">({order.phone})</span></p>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{order.product_type} · {order.width_cm}×{order.height_cm}cm · {order.quantity}개</p>
                    {order.status === '시안 수정 요청' && order.revision_notes && (
                      <p className="text-xs text-orange-600 mt-1 truncate">✏️ {order.revision_notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="font-bold text-gray-800">{selected.customer_name} 님 주문</h2>
                <p className="text-xs text-gray-400">{new Date(selected.created_at).toLocaleString('ko-KR')}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-6 space-y-3">
              {/* 상태 + 수정 횟수 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                {selected.revision_count > 0 && (
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${selected.revision_count > 2 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                    {selected.revision_count > 2 ? `💰 ${selected.revision_count}차 수정 (추가금 발생)` : `${selected.revision_count}차 수정 (무료)`}
                  </span>
                )}
              </div>

              {/* 수정 요청 내용 */}
              {selected.status === '시안 수정 요청' && selected.revision_notes && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-orange-700 mb-1">✏️ 고객 수정 요청 내용</p>
                  <p className="text-sm text-orange-800">{selected.revision_notes}</p>
                </div>
              )}

              <DetailRow label="연락처" value={selected.phone} />

              {/* 다중 항목 표시 */}
              {selected.items && selected.items.length > 0 ? (
                <div className="space-y-2">
                  {selected.items.map((item: OrderItem, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 text-sm">
                      {selected.items!.length > 1 && <p className="text-xs text-gray-400 mb-1 font-medium">항목 {i + 1}</p>}
                      <p className="text-gray-800 font-medium">{item.product_type}</p>
                      <p className="text-gray-500">{item.design_type}{item.design_name ? ` · ${item.design_name}` : ''}{item.design_sub_name ? ` > ${item.design_sub_name}` : ''} · {item.width_cm}×{item.height_cm}cm · {item.quantity}개</p>
                      {item.handwriting_change && (
                        <p className="text-amber-600 text-xs mt-0.5 font-semibold">✍️ 손글씨 문구 변경 요청 (+5,000원)</p>
                      )}
                      {item.finishing?.length > 0 && (
                        <p className="text-pink-600 text-xs mt-0.5">후가공: {item.finishing.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <DetailRow label="제품 종류" value={selected.product_type} />
                  <DetailRow label="디자인 방식" value={selected.design_type} />
                  <DetailRow label="사이즈" value={`가로 ${selected.width_cm}cm × 세로 ${selected.height_cm}cm`} />
                  <DetailRow label="수량" value={`${selected.quantity}개`} />
                </>
              )}

              {(selected.text_top || selected.text_main || selected.text_bottom) && (
                <div className="space-y-1">
                  {selected.text_top && <DetailRow label="상단 문구" value={selected.text_top} />}
                  {selected.text_main && <DetailRow label="메인 문구" value={selected.text_main} />}
                  {selected.text_bottom && <DetailRow label="하단 문구" value={selected.text_bottom} />}
                </div>
              )}
              {selected.text_corrections && <DetailRow label="기타 문구 수정" value={selected.text_corrections} />}
              <DetailRow label="배송주소" value={selected.shipping_address} />
              <DetailRow label="결제방법" value={selected.payment_method} />
              {selected.receipt_type && <DetailRow label="세금계산서/영수증" value={selected.receipt_type} />}
              {selected.business_number && <DetailRow label="사업자등록번호" value={selected.business_number} />}
              {selected.email && <DetailRow label="이메일" value={selected.email} />}
              {selected.card_phone && <DetailRow label="카드결제 연락처" value={selected.card_phone} />}
              {selected.needs_statement && <DetailRow label="거래명세서/견적서" value={`요청 · ${selected.statement_email || '이메일 미입력'}`} />}
              <DetailRow label="기타 요청" value={selected.other_requests || '-'} />

              {/* 고객 첨부 이미지 */}
              {selected.image_urls?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">고객 첨부 이미지</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.image_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`이미지${i + 1}`} className="w-full aspect-square object-cover rounded-lg hover:opacity-80 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 시안 이력 */}
              {(selected.draft_history?.length > 0) ? (
                <div className="space-y-4">
                  {[...selected.draft_history].reverse().map((entry: DraftRevision, i: number) => (
                    <div key={i}>
                      <p className="text-xs font-semibold mb-1.5 px-1" style={{ color: i === 0 ? '#7c3aed' : '#6b7280' }}>
                        {i === 0 ? `▶ ${entry.label} (최신)` : entry.label}
                      </p>
                      <div className="space-y-2">
                        {entry.images.map((url, j) => (
                          <a key={j} href={url} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`${entry.label} ${j + 1}`} className={`w-full rounded-xl border hover:opacity-90 transition ${i !== 0 ? 'opacity-50' : ''}`} />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : selected.draft_images?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">현재 시안</p>
                  <div className="space-y-2">
                    {selected.draft_images.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`시안${i + 1}`} className="w-full rounded-xl border hover:opacity-90 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 파일 input (항상 DOM에 존재해야 함) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => { if (e.target.files) uploadDraftFiles(e.target.files); e.target.value = '' }}
              />

              {/* === 액션 영역 === */}
              <div className="pt-2 space-y-3">

                {/* 시안 업로드 + 발송 (작업중 / 시안 수정 작업중) */}
                {(selected.status === '작업중' || selected.status === '시안 수정 작업중') && (
                  <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">시안 이미지 업로드</p>
                      <p className="text-xs text-gray-400 mt-0.5">이미지 선택 후 &apos;시안 확인 요청 보내기&apos;를 눌러야 고객에게 전달됩니다. (파일당 10MB 이하)</p>
                    </div>

                    {newDraftUrls.length > 0 && (
                      <div className="space-y-2">
                        {newDraftUrls.map((url, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={url} alt={`새 시안${i + 1}`} className="w-full rounded-xl border" />
                        ))}
                        <p className="text-xs text-green-600">✓ {newDraftUrls.length}개 업로드 완료 — 아래 버튼을 눌러 발송하세요</p>
                      </div>
                    )}

                    {draftUploadError && (
                      <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{draftUploadError}</p>
                    )}

                    {newDraftUrls.length === 0 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={draftUploading}
                        className="w-full py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
                      >
                        {draftUploading ? '⏳ 업로드 중...' : '+ 이미지 선택'}
                      </button>
                    )}

                    {newDraftUrls.length > 0 && (
                      <button
                        onClick={sendDraft}
                        disabled={draftSending}
                        className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
                      >
                        {draftSending ? '⏳ 발송 중...' : '📤 시안 확인 요청 보내기'}
                      </button>
                    )}
                  </div>
                )}

                {/* 시안 확인 요청중 - 링크 복사 + 시안 교체 */}
                {selected.status === '시안 확인 요청중' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-yellow-800">⏳ 고객 응답 대기중</p>
                    <p className="text-xs text-yellow-700">아래 링크를 고객에게 카톡으로 전달해주세요.</p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={`${BASE_URL}/review/${selected.id}`}
                        className="flex-1 text-xs bg-white border border-yellow-300 rounded-lg px-3 py-2 text-gray-600"
                      />
                      <button
                        onClick={() => copyReviewLink(selected.id)}
                        className="px-3 py-2 bg-yellow-400 text-white rounded-lg text-xs font-medium hover:bg-yellow-500 transition whitespace-nowrap"
                      >
                        {copied ? '복사됨 ✓' : '복사'}
                      </button>
                    </div>

                    {!replacingDraft ? (
                      <button
                        onClick={() => { setReplacingDraft(true); setNewDraftUrls([]); setDraftUploadError('') }}
                        className="w-full py-2 border border-yellow-300 rounded-xl text-xs text-yellow-700 hover:bg-yellow-100 transition"
                      >
                        🔄 시안 교체하기
                      </button>
                    ) : (
                      <div className="border border-dashed border-yellow-300 rounded-xl p-3 space-y-2 bg-white">
                        <p className="text-xs text-gray-500">새 시안을 업로드하면 기존 시안이 교체됩니다.</p>
                        {newDraftUrls.length > 0 && (
                          <div className="space-y-2">
                            {newDraftUrls.map((url, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={i} src={url} alt={`새 시안${i + 1}`} className="w-full rounded-xl border" />
                            ))}
                            <p className="text-xs text-green-600">✓ {newDraftUrls.length}개 업로드 완료</p>
                          </div>
                        )}
                        {draftUploadError && (
                          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{draftUploadError}</p>
                        )}
                        {newDraftUrls.length === 0 && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={draftUploading}
                            className="w-full py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
                          >
                            {draftUploading ? '⏳ 업로드 중...' : '+ 이미지 선택'}
                          </button>
                        )}
                        {newDraftUrls.length > 0 && (
                          <button
                            onClick={async () => {
                              setDraftSending(true)
                              try {
                                const result = await updateOrder(selected.id, { draft_images: newDraftUrls })
                                if (result.success) {
                                  setNewDraftUrls([])
                                  setReplacingDraft(false)
                                  setDraftUploadError('')
                                } else {
                                  alert(`교체 실패: ${result.error || '알 수 없는 오류'}`)
                                }
                              } catch {
                                alert('오류가 발생했습니다. 다시 시도해주세요.')
                              } finally {
                                setDraftSending(false)
                              }
                            }}
                            disabled={draftSending}
                            className="w-full py-2 bg-yellow-400 text-white rounded-xl text-sm font-semibold hover:bg-yellow-500 transition disabled:opacity-60"
                          >
                            {draftSending ? '⏳ 교체 중...' : '✅ 시안 교체 완료'}
                          </button>
                        )}
                        <button
                          onClick={() => { setReplacingDraft(false); setNewDraftUrls([]); setDraftUploadError('') }}
                          className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 시안 수정 요청 - 수정 시작 */}
                {selected.status === '시안 수정 요청' && (
                  <button
                    onClick={() => updateOrder(selected.id, { status: '시안 수정 작업중' })}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition"
                  >
                    ✏️ 수정 작업 시작
                  </button>
                )}

                {/* 접수 → 작업중 */}
                {selected.status === '접수' && (
                  <button
                    onClick={() => updateOrder(selected.id, { status: '작업중' })}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition"
                  >
                    작업 시작
                  </button>
                )}

                {/* 시안 확정 → 완료 */}
                {selected.status === '시안 확정' && (
                  <button
                    onClick={() => updateOrder(selected.id, { status: '완료' })}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition"
                  >
                    ✅ 생산 완료 처리
                  </button>
                )}

                {/* 카드결제 링크 관리 */}
                {selected.payment_method === '카드결제' && (
                  <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-blue-800">💳 카드 결제 링크</p>
                    <div className="flex gap-2">
                      <input
                        value={paymentLinkInput}
                        onChange={e => setPaymentLinkInput(e.target.value)}
                        placeholder="결제 링크 URL을 붙여넣으세요"
                        className="flex-1 text-xs bg-white border border-blue-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
                      />
                      <button
                        onClick={savePaymentLink}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition whitespace-nowrap"
                      >
                        저장
                      </button>
                    </div>
                    {selected.payment_link && (
                      <div className="space-y-2">
                        <p className="text-xs text-blue-700">고객 결제 페이지 링크를 복사해서 전달하세요.</p>
                        <div className="flex gap-2">
                          <input
                            readOnly
                            value={`${BASE_URL}/pay/${selected.id}`}
                            className="flex-1 text-xs bg-white border border-blue-300 rounded-lg px-3 py-2 text-gray-600"
                          />
                          <button
                            onClick={() => copyPayLink(selected.id)}
                            className="px-3 py-2 bg-blue-400 text-white rounded-lg text-xs font-medium hover:bg-blue-500 transition whitespace-nowrap"
                          >
                            {payCopied ? '복사됨 ✓' : '복사'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 취소 / 삭제 버튼 */}
                <div className="flex gap-2">
                  {!['완료', '취소'].includes(selected.status) && (
                    <button
                      onClick={() => updateOrder(selected.id, { status: '취소' })}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition"
                    >
                      주문 취소
                    </button>
                  )}
                  <button
                    onClick={() => deleteOrder(selected.id)}
                    className="px-4 py-3 border border-red-300 text-red-500 rounded-xl text-sm hover:bg-red-50 transition"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-gray-800 break-all">{value}</span>
    </div>
  )
}
