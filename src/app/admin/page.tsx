'use client'

import { useState, useEffect, useCallback } from 'react'
import { Order, OrderStatus } from '@/types/order'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '1234'
const STATUS_TABS: OrderStatus[] = ['접수', '작업중', '완료', '취소']
const STATUS_COLORS: Record<OrderStatus, string> = {
  '접수': 'bg-blue-100 text-blue-700',
  '작업중': 'bg-yellow-100 text-yellow-700',
  '완료': 'bg-green-100 text-green-700',
  '취소': 'bg-gray-100 text-gray-500',
}
const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  '접수': '작업중',
  '작업중': '완료',
  '완료': null,
  '취소': null,
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<'전체' | OrderStatus>('전체')
  const [selected, setSelected] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true)
    } else {
      setLoginError('비밀번호가 틀렸습니다.')
    }
  }

  const updateStatus = async (id: string, status: OrderStatus) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const result = await res.json()
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
    }
  }

  const cancelOrder = async (id: string) => {
    if (!confirm('이 주문을 취소하시겠습니까?')) return
    updateStatus(id, '취소')
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

  const filtered = filter === '전체' ? orders : orders.filter(o => o.status === filter)

  const counts: Record<string, number> = {
    전체: orders.length,
    ...STATUS_TABS.reduce((acc, s) => ({ ...acc, [s]: orders.filter(o => o.status === s).length }), {} as Record<string, number>)
  }

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
      {/* Header */}
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
          {(['전체', ...STATUS_TABS] as const).map(tab => (
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                      <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="font-semibold text-gray-800">{order.customer_name} <span className="font-normal text-gray-500 text-sm">({order.phone})</span></p>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{order.product_type} · {order.width_cm}×{order.height_cm}cm · {order.quantity}개</p>
                  </div>
                  {NEXT_STATUS[order.status] && (
                    <button
                      onClick={e => { e.stopPropagation(); updateStatus(order.id, NEXT_STATUS[order.status]!) }}
                      className="text-xs bg-pink-500 text-white px-3 py-1.5 rounded-lg hover:bg-pink-600 transition whitespace-nowrap"
                    >
                      → {NEXT_STATUS[order.status]}
                    </button>
                  )}
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
              <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>

              <DetailRow label="연락처" value={selected.phone} />
              <DetailRow label="제품 종류" value={selected.product_type} />
              <DetailRow label="디자인 방식" value={selected.design_type} />
              <DetailRow label="사이즈" value={`가로 ${selected.width_cm}cm × 세로 ${selected.height_cm}cm`} />
              <DetailRow label="수량" value={`${selected.quantity}개`} />
              <DetailRow label="문구 수정" value={selected.text_corrections || '-'} />
              <DetailRow label="배송주소" value={selected.shipping_address} />
              <DetailRow label="결제방법" value={selected.payment_method} />
              <DetailRow label="기타 요청" value={selected.other_requests || '-'} />

              {selected.image_urls?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">참고 이미지</p>
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

              {/* 상태 변경 버튼 */}
              <div className="pt-4 flex gap-2">
                {NEXT_STATUS[selected.status] && (
                  <button
                    onClick={() => updateStatus(selected.id, NEXT_STATUS[selected.status]!)}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition"
                  >
                    {NEXT_STATUS[selected.status]}(으)로 변경
                  </button>
                )}
                {selected.status !== '취소' && selected.status !== '완료' && (
                  <button
                    onClick={() => cancelOrder(selected.id)}
                    className="px-4 py-3 border border-gray-300 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition"
                  >
                    취소
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
