'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Script from 'next/script'

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: { roadAddress: string; jibunAddress: string }) => void
      }) => { open: () => void }
    }
  }
}

const BANNER_TYPES = [
  {
    id: '일반현수막',
    pros: ['저렴한 가격'],
    cons: ['햇빛·바람 등 외부영향의 빛바램', '습기에 취약', '약한 내구도'],
  },
  {
    id: 'UV현수막',
    pros: ['장시간 노출시에도 변함없는 컬러', '은은한 광택', '습기에 강함', '튼튼한 내구도'],
    cons: ['일반현수막과 비교시 높은 가격'],
  },
]

const FINISHING_BANNER = [
  {
    id: '열재단',
    price: '추가금없음',
    badge: null,
    icon: '✂️',
    sub: '',
    desc: '기본 재단 마감. 실내에서 스템플러·테이프·자석으로 고정시 사용.',
  },
  {
    id: '아일렛타공',
    price: '2,000원',
    badge: 'BEST',
    icon: '⭕',
    sub: '기본 사방4개 · 로프 미포함',
    desc: '구멍으로 끈·못·피스 걸기용. 2·8개 선택 가능.',
  },
  {
    id: '아일렛타공+큐방',
    price: '4,000원',
    badge: null,
    icon: '🔲',
    sub: '큐방 4개 포함',
    desc: '흡착형 큐방으로 유리·타일 위에 고정. 추가 시 추가금 발생.',
  },
  {
    id: '끈고리가공',
    price: '4,000원',
    badge: 'BEST',
    icon: '🔗',
    sub: '로프 포함',
    desc: '모서리에 끈고리 달아 끈으로 고정. 외부 장기 거치에 추천.',
  },
  {
    id: '막대가공',
    price: '5,000원',
    badge: null,
    icon: '📏',
    sub: '로프 포함',
    desc: '양 끝 각목·로프로 팽팽하게 외부 게시. 세로 90cm까지 가능.',
  },
  {
    id: '봉미싱',
    price: '1,000원~',
    badge: null,
    icon: '🪡',
    sub: '한 방향당',
    desc: '각목·봉 끼워 사용. 사이즈에 따라 가격 다름, 별도 문의 필수.',
  },
  {
    id: '사방줄미싱',
    price: '2,000원×가로m',
    badge: null,
    icon: '🧵',
    sub: '현수막 가로 길이 기준',
    desc: '상하좌우 줄 재봉. 비바람에 강해 외부 장기 거치에 최적.',
  },
  {
    id: '로프(3m)',
    price: '1,000원',
    badge: null,
    icon: '🪢',
    sub: '',
    desc: '외부 현수막 고정용 로프 3m. 필요 길이 확인 후 수량 설정.',
  },
  {
    id: '원형겔양면테이프',
    price: '1,000원',
    badge: null,
    icon: '🔴',
    sub: '8개',
    desc: '열재단 현수막 임시 고정용.',
  },
]

const PRODUCT_TYPES = [
  { id: '현수막',    emoji: '🪧', desc: '야외·실내 행사용' },
  { id: '배너',      emoji: '🖼️', desc: '스탠드·벽걸이형' },
  { id: '어깨띠',   emoji: '🎀', desc: '입학·졸업·행사용' },
  { id: '환경구성판', emoji: '🌈', desc: '교실·복도 환경판' },
  { id: '포토판넬',  emoji: '📸', desc: '포토존·기념촬영' },
  { id: '명찰',      emoji: '🏷️', desc: '이름표·목걸이형' },
  { id: '팻말',      emoji: '📋', desc: '안내·좌석 팻말' },
]
const DESIGN_TYPES = ['기본 디자인 선택', '맞춤 디자인 요청', '직접 파일 제공']
const PAYMENT_METHODS = ['계좌이체', '카드결제']
const FINISHING_OPTIONS = ['열재단', '아일렛타공', '각목마감']

// 현수막 가격 계산 (ilbirong 견적 계산기 로직)
const BANNER_FINISHING_PRICES: Record<string, number> = {
  '열재단': 0, '아일렛타공': 2000, '아일렛타공+큐방': 4000,
  '끈고리가공': 4000, '막대가공': 5000, '봉미싱': 1000,
  '로프(3m)': 1000, '원형겔양면테이프': 1000,
}

function calcBannerBasePrice(widthCm: number, heightCm: number): number {
  if (widthCm <= 0 || heightCm <= 0) return 0
  const S = Math.min(widthCm, heightCm)
  const L = Math.max(widthCm, heightCm)
  const rates = [
    { h: 30, rate: 33 }, { h: 40, rate: 34 }, { h: 50, rate: 35 },
    { h: 60, rate: 38 }, { h: 70, rate: 40 }, { h: 80, rate: 42 },
    { h: 90, rate: 44 }, { h: 100, rate: 68 }, { h: 110, rate: 70 },
    { h: 120, rate: 73 }, { h: 130, rate: 76 }, { h: 140, rate: 78 },
    { h: 150, rate: 90 }, { h: 160, rate: 92 }, { h: 170, rate: 94 },
    { h: 180, rate: 94 }, { h: 190, rate: 136 }, { h: 200, rate: 140 },
  ]
  const effectiveLong = Math.max(Math.ceil(L / 50) * 50, 100)
  let rate = rates[0].rate
  if (S > rates[rates.length - 1].h) {
    rate = 0.72 * S - 4
  } else {
    for (let i = 0; i < rates.length - 1; i++) {
      if (S >= rates[i].h && S <= rates[i + 1].h) {
        const t = (S - rates[i].h) / (rates[i + 1].h - rates[i].h)
        rate = rates[i].rate + t * (rates[i + 1].rate - rates[i].rate)
        break
      }
    }
  }
  let rawCost = rate * effectiveLong + 2000
  if (S < 30) rawCost += 1400
  return Math.round(Math.max(rawCost * 1.55, 5000) / 100) * 100
}

interface ItemForm {
  product_type: string
  banner_type: string
  design_type: string
  design_name: string
  design_sub_name: string
  handwriting_change: boolean
  width_cm: string
  height_cm: string
  quantity: string
  finishing: string[]
  text_top: string
  text_main: string
  text_bottom: string
  text_corrections: string
}

const defaultItem = (): ItemForm => ({
  product_type: '',
  banner_type: '',
  design_type: '',
  design_name: '',
  design_sub_name: '',
  handwriting_change: false,
  width_cm: '',
  height_cm: '',
  quantity: '1',
  finishing: [],
  text_top: '',
  text_main: '',
  text_bottom: '',
  text_corrections: '',
})

export default function OrderPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [privacyAgreed, setPrivacyAgreed] = useState(false)

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    needs_statement: false,
    statement_email: '',
    shipping_address: '',
    shipping_address_detail: '',
    payment_method: '',
    receipt_type: '',
    business_number: '',
    email: '',
    card_phone: '',
    other_requests: '',
  })

  const [items, setItems] = useState<ItemForm[]>([defaultItem()])
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const updateItem = (index: number, field: keyof ItemForm, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
    if (errors[`item_${index}_${field}`]) setErrors(prev => ({ ...prev, [`item_${index}_${field}`]: '' }))
  }

  const toggleFinishing = (index: number, value: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const finishing = item.finishing.includes(value)
        ? item.finishing.filter(f => f !== value)
        : [...item.finishing, value]
      return { ...item, finishing }
    }))
  }

  const addItem = () => setItems(prev => [...prev, defaultItem()])

  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index))

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const MAX_SIZE = 3 * 1024 * 1024 // 3MB
    const oversized = files.filter(f => f.size > MAX_SIZE)
    if (oversized.length > 0) {
      alert(`이미지 용량은 파일당 3MB 이하만 가능합니다.\n(초과 파일: ${oversized.map(f => f.name).join(', ')})`)
      return
    }
    if (images.length + files.length > 5) {
      alert('이미지는 최대 5장까지 업로드 가능합니다.')
      return
    }
    setImages(prev => [...prev, ...files])
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.customer_name.trim()) newErrors.customer_name = '이름을 입력해주세요.'
    if (!form.phone.trim()) newErrors.phone = '연락처를 입력해주세요.'
    items.forEach((item, i) => {
      if (!item.product_type) newErrors[`item_${i}_product_type`] = '제품 종류를 선택해주세요.'
      if (!item.design_type) newErrors[`item_${i}_design_type`] = '디자인 방식을 선택해주세요.'
      if (!item.width_cm) newErrors[`item_${i}_width_cm`] = '가로 사이즈를 입력해주세요.'
      if (!item.height_cm) newErrors[`item_${i}_height_cm`] = '세로 사이즈를 입력해주세요.'
      if (!item.quantity || parseInt(item.quantity) < 1) newErrors[`item_${i}_quantity`] = '수량을 입력해주세요.'
    })
    if (!form.shipping_address.trim()) newErrors.shipping_address = '배송주소를 입력해주세요.'
    if (!form.payment_method) newErrors.payment_method = '결제방법을 선택해주세요.'
    if (form.payment_method === '계좌이체' && !form.receipt_type) newErrors.receipt_type = '현금영수증/세금계산서를 선택해주세요.'
    if (form.payment_method === '계좌이체' && form.receipt_type === '세금계산서' && !form.business_number.trim()) newErrors.business_number = '사업자등록번호를 입력해주세요.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const imageUrls: string[] = []
      for (const image of images) {
        try {
          const formData = new FormData()
          formData.append('file', image)
          const res = await fetch('/api/upload', { method: 'POST', body: formData })
          if (res.ok) {
            const result = await res.json()
            if (result.success) imageUrls.push(result.url)
          } else {
            console.error('이미지 업로드 실패:', res.status, res.statusText)
          }
        } catch (uploadErr) {
          console.error('이미지 업로드 오류:', uploadErr)
        }
      }

      const firstItem = items[0]
      const productType = firstItem.product_type

      const orderItems = items.map(item => ({
        product_type: item.product_type,
        banner_type: item.banner_type,
        design_type: item.design_type,
        design_name: item.design_name,
        design_sub_name: item.design_sub_name,
        handwriting_change: item.handwriting_change,
        width_cm: parseFloat(item.width_cm) || null,
        height_cm: parseFloat(item.height_cm) || null,
        quantity: parseInt(item.quantity),
        finishing: item.finishing,
        text_top: item.text_top,
        text_main: item.text_main,
        text_bottom: item.text_bottom,
        text_corrections: item.text_corrections,
      }))

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          product_type: productType,
          design_type: firstItem.design_type,
          width_cm: firstItem.width_cm,
          height_cm: firstItem.height_cm,
          quantity: firstItem.quantity,
          items: orderItems,
          image_urls: imageUrls,
        }),
      })

      const text = await res.text()
      let result
      try {
        result = JSON.parse(text)
      } catch {
        console.error('API 응답 파싱 실패:', text)
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        return
      }

      if (result.success) {
        router.push('/complete')
      } else {
        console.error('주문 접수 실패:', result.error)
        alert(`주문 접수에 실패했습니다.\n오류: ${result.error || '알 수 없는 오류'}`)
      }
    } catch (err) {
      console.error('주문 접수 예외:', err)
      alert('오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        setForm(prev => ({ ...prev, shipping_address: data.roadAddress, shipping_address_detail: '' }))
        if (errors.shipping_address) setErrors(prev => ({ ...prev, shipping_address: '' }))
      },
    }).open()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">일비롱디자인</h1>
        <p className="mt-1 text-pink-100 text-sm">주문서 작성</p>
        <div className="mt-4 flex flex-col items-center gap-1 text-xs text-pink-100">
          <p>🕐 영업시간 예) 평일 09:00 – 18:00</p>
          <p>📍 주소 예) 경기도 OO시 OO로 00</p>
          <p>📞 상담전화 예) 010-0000-0000</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-6 text-sm text-pink-800">
          안녕하세요! 아래 양식을 작성해주시면 빠르게 확인 후 연락드리겠습니다.<br />
          <span className="font-semibold">시안 작업 2회까지 무료</span>이며, 이후 회당 3,000원이 추가됩니다.
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <Section title="고객 정보">
            <Field label="기관명(담당자명)" required error={errors.customer_name}>
              <input name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="일비롱유치원(홍길동)" className={inputClass(errors.customer_name)} />
            </Field>
            <Field label="시안 확인 가능한 연락처" required error={errors.phone}>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="010-0000-0000" className={inputClass(errors.phone)} />
            </Field>
          </Section>

          {/* 주문 항목 (반복 추가 가능) */}
          {items.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 text-base">
                  주문 항목 {items.length > 1 ? index + 1 : ''}
                </h2>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 text-sm">
                    삭제
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    제품 종류 <span className="text-pink-500">*</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PRODUCT_TYPES.map(pt => {
                      const selected = item.product_type === pt.id
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => updateItem(index, 'product_type', selected ? '' : pt.id)}
                          className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition ${
                            selected
                              ? 'bg-pink-500 border-pink-500 text-white'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'
                          }`}
                        >
                          <span className="text-xl leading-none">{pt.emoji}</span>
                          <div>
                            <p className={`text-sm font-semibold leading-tight ${selected ? 'text-white' : 'text-gray-800'}`}>{pt.id}</p>
                            <p className={`text-xs mt-0.5 ${selected ? 'text-pink-100' : 'text-gray-400'}`}>{pt.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {errors[`item_${index}_product_type`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_product_type`]}</p>
                  )}
                  {/* 현수막 타입 선택 */}
                  {item.product_type === '현수막' && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">현수막 타입</p>
                      <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-gray-200">
                        {BANNER_TYPES.map((bt, i) => (
                          <button
                            key={bt.id}
                            type="button"
                            onClick={() => setItems(prev => prev.map((it, idx) => idx === index ? { ...it, banner_type: bt.id } : it))}
                            className={`py-4 text-sm font-bold transition ${
                              item.banner_type === bt.id
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                            } ${i === 0 ? 'border-r border-gray-200' : ''}`}
                          >
                            {item.banner_type === bt.id ? '✓ ' : ''}{bt.id}
                          </button>
                        ))}
                      </div>
                      {item.banner_type && (() => {
                        const selected = BANNER_TYPES.find(bt => bt.id === item.banner_type)!
                        return (
                          <div className="mt-2 border border-gray-200 rounded-xl p-3 grid grid-cols-2 gap-3 bg-gray-50">
                            <div>
                              <p className="text-sm font-bold text-green-600 mb-1.5">장점</p>
                              <ul className="space-y-1">
                                {selected.pros.map(p => (
                                  <li key={p} className="text-xs text-gray-600 flex gap-1"><span className="shrink-0">•</span><span>{p}</span></li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-red-500 mb-1.5">단점</p>
                              <ul className="space-y-1">
                                {selected.cons.map(c => (
                                  <li key={c} className="text-xs text-gray-600 flex gap-1"><span className="shrink-0">•</span><span>{c}</span></li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>

                {item.product_type && (<>
                <Field label="디자인 방식" required error={errors[`item_${index}_design_type`]}>
                  <select value={item.design_type} onChange={e => updateItem(index, 'design_type', e.target.value)} className={inputClass(errors[`item_${index}_design_type`])}>
                    <option value="">선택해주세요</option>
                    {DESIGN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                {item.design_type === '기본 디자인 선택' && (
                  <>
                    <Field label="디자인 이름" error={errors[`item_${index}_design_name`]}>
                      <input
                        value={item.design_name}
                        onChange={e => updateItem(index, 'design_name', e.target.value)}
                        placeholder="예) 식목일 생태체험, 크레파스밭기"
                        className={inputClass(errors[`item_${index}_design_name`])}
                      />
                      <p className="text-xs text-gray-400 mt-1">네이버 스마트스토어 상세페이지에서 확인하신 디자인 이름을 적어주세요.</p>
                    </Field>
                    <Field label="세부 디자인 (색상/버전)">
                      <input
                        value={item.design_sub_name}
                        onChange={e => updateItem(index, 'design_sub_name', e.target.value)}
                        placeholder="예) 초록나무, 핑크버전 (해당되는 경우만)"
                        className={inputClass()}
                      />
                    </Field>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-amber-800 mb-1">손글씨 문구 변경 여부</p>
                      <p className="text-xs text-amber-700 mb-3">기본 디자인의 손글씨 문구를 변경하실 경우 <span className="font-semibold">추가금 5,000원</span>이 발생합니다. 변경하지 않으시면 추가금이 없습니다.</p>
                      <div className="flex gap-3">
                        {[
                          { value: false, label: '변경 없음', sub: '추가금 없음' },
                          { value: true, label: '변경 원함', sub: '+5,000원' },
                        ].map(opt => (
                          <label key={String(opt.value)} className={`flex-1 border rounded-xl py-3 text-center text-sm cursor-pointer transition ${item.handwriting_change === opt.value ? 'bg-amber-500 border-amber-500 text-white font-semibold' : 'border-amber-300 text-amber-800 hover:border-amber-400 bg-white'}`}>
                            <input type="radio" className="hidden" checked={item.handwriting_change === opt.value} onChange={() => setItems(prev => prev.map((it, i) => i === index ? { ...it, handwriting_change: opt.value } : it))} />
                            <div>{opt.label}</div>
                            <div className={`text-xs mt-0.5 ${item.handwriting_change === opt.value ? 'text-amber-100' : 'text-amber-600'}`}>{opt.sub}</div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    사이즈 · 수량 <span className="text-pink-500">*</span>
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <input
                      value={item.width_cm}
                      onChange={e => updateItem(index, 'width_cm', e.target.value)}
                      type="number"
                      placeholder="가로"
                      className={`w-20 border ${errors[`item_${index}_width_cm`] ? 'border-red-400' : 'border-gray-300'} rounded-xl px-3 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-pink-300`}
                    />
                    <span className="text-sm text-gray-500">cm</span>
                    <span className="text-sm text-gray-300 font-bold">×</span>
                    <input
                      value={item.height_cm}
                      onChange={e => updateItem(index, 'height_cm', e.target.value)}
                      type="number"
                      placeholder="세로"
                      className={`w-20 border ${errors[`item_${index}_height_cm`] ? 'border-red-400' : 'border-gray-300'} rounded-xl px-3 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-pink-300`}
                    />
                    <span className="text-sm text-gray-500">cm</span>
                    <span className="text-sm text-gray-300 font-bold">×</span>
                    <input
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', e.target.value)}
                      type="number"
                      min="1"
                      className={`w-16 border ${errors[`item_${index}_quantity`] ? 'border-red-400' : 'border-gray-300'} rounded-xl px-3 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-pink-300`}
                    />
                    <span className="text-sm text-gray-500">장</span>
                  </div>
                  {(errors[`item_${index}_width_cm`] || errors[`item_${index}_height_cm`] || errors[`item_${index}_quantity`]) && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`item_${index}_width_cm`] || errors[`item_${index}_height_cm`] || errors[`item_${index}_quantity`]}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">후가공 마감 <span className="text-xs font-normal text-gray-400">(선택, 중복 가능)</span></p>
                  {item.product_type === '현수막' ? (
                    <>
                      <p className="text-xs text-gray-400 mb-2">미 선택 시 기본 열재단으로 제작됩니다.</p>
                      <div className="grid grid-cols-2 gap-2">
                        {FINISHING_BANNER.map(opt => {
                          const selected = item.finishing.includes(opt.id)
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => toggleFinishing(index, opt.id)}
                              className={`relative flex flex-col gap-1.5 p-3 rounded-xl border text-left transition ${
                                selected
                                  ? 'bg-pink-500 border-pink-500'
                                  : 'border-gray-200 bg-white hover:border-pink-300'
                              }`}
                            >
                              {opt.badge && (
                                <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                                  {opt.badge}
                                </span>
                              )}
                              <span className="text-2xl leading-none">{opt.icon}</span>
                              <div>
                                <p className={`text-sm font-bold leading-tight ${selected ? 'text-white' : 'text-gray-800'}`}>
                                  {opt.id}
                                </p>
                                {opt.sub && (
                                  <p className={`text-xs mt-0.5 ${selected ? 'text-pink-100' : 'text-gray-400'}`}>{opt.sub}</p>
                                )}
                                <p className={`text-xs font-semibold mt-0.5 ${selected ? 'text-pink-100' : 'text-pink-600'}`}>{opt.price}</p>
                              </div>
                              <p className={`text-xs leading-relaxed ${selected ? 'text-pink-100' : 'text-gray-500'}`}>{opt.desc}</p>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2 flex-wrap mt-1">
                      {FINISHING_OPTIONS.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleFinishing(index, opt)}
                          className={`px-4 py-2 rounded-xl text-sm border transition ${item.finishing.includes(opt) ? 'bg-pink-500 border-pink-500 text-white font-semibold' : 'border-gray-300 text-gray-600 hover:border-pink-300'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 현수막 예상 견적 */}
                {item.product_type === '현수막' && (() => {
                  const w = parseFloat(item.width_cm), h = parseFloat(item.height_cm)
                  if (!w || !h) return null
                  const basePrice = calcBannerBasePrice(w, h)
                  const widthM = Math.ceil(w / 100)
                  const finishingCosts = item.finishing
                    .map(f => ({ label: f, price: f === '사방줄미싱' ? 2000 * widthM : (BANNER_FINISHING_PRICES[f] ?? 0) }))
                    .filter(f => f.price > 0)
                  const finishingTotal = finishingCosts.reduce((s, f) => s + f.price, 0)
                  const qty = parseInt(item.quantity) || 1
                  const perUnit = basePrice + finishingTotal
                  const total = perUnit * qty
                  return (
                    <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
                      <p className="text-sm font-bold text-pink-800 mb-3">💰 예상 견적</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">현수막 인쇄비 ({w}×{h}cm)</span>
                          <span className="font-medium">{basePrice.toLocaleString()}원</span>
                        </div>
                        {finishingCosts.map(f => (
                          <div key={f.label} className="flex justify-between">
                            <span className="text-gray-600">{f.label}</span>
                            <span className="font-medium">+{f.price.toLocaleString()}원</span>
                          </div>
                        ))}
                        {qty > 1 && (
                          <div className="flex justify-between text-gray-400 text-xs pt-0.5">
                            <span>1장 소계</span>
                            <span>{perUnit.toLocaleString()}원</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-pink-200 pt-2 mt-1">
                          <span className="font-bold text-pink-800">{qty}장 합계</span>
                          <span className="font-bold text-pink-600 text-base">{total.toLocaleString()}원</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2.5">※ 예상 금액으로, 실제 견적은 주문 확인 후 안내드립니다.</p>
                    </div>
                  )
                })()}

                {/* 문구 내용 */}
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-bold text-gray-800 mb-3">
                    문구 내용 <span className="text-xs font-normal text-gray-400">(선택)</span>
                  </p>
                  <div className="mb-3 rounded-xl overflow-hidden border border-gray-200">
                    <Image
                      src="/banner-example.jpg"
                      alt="현수막 문구 위치 예시"
                      width={600}
                      height={250}
                      className="w-full h-auto"
                    />
                    <p className="text-xs text-gray-400 text-center py-1.5 bg-gray-50">현수막 문구 위치 예시</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400">기본 디자인의 문구를 변경하거나, 새로 입력할 내용을 적어주세요.</p>
                    <Field label="상단 문구">
                      <input value={item.text_top} onChange={e => updateItem(index, 'text_top', e.target.value)} placeholder="예) 초록 말풍선 - ❤지구를 지켜요❤" className={inputClass()} />
                    </Field>
                    <Field label="메인 문구">
                      <input value={item.text_main} onChange={e => updateItem(index, 'text_main', e.target.value)} placeholder="예) 지구를 구하는 초록 이야기" className={inputClass()} />
                    </Field>
                    <Field label="기관명">
                      <input value={item.text_bottom} onChange={e => updateItem(index, 'text_bottom', e.target.value)} placeholder="예) 일비롱어린이집" className={inputClass()} />
                    </Field>
                    <Field label="기타 문구 수정사항">
                      <textarea value={item.text_corrections} onChange={e => updateItem(index, 'text_corrections', e.target.value)} placeholder="위 항목 외 추가 변경사항을 자유롭게 적어주세요." rows={2} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none" />
                    </Field>
                  </div>
                </div>
                </>)}

              </div>
            </div>
          ))}

          {/* 항목 추가 버튼 */}
          <button
            type="button"
            onClick={addItem}
            className="w-full py-3 border-2 border-dashed border-pink-300 rounded-2xl text-pink-500 text-sm font-medium hover:bg-pink-50 transition"
          >
            + 주문 항목 추가
          </button>

          <Section title="배송 및 결제">
            <Field label="배송주소" required error={errors.shipping_address}>
              <button
                type="button"
                onClick={openAddressSearch}
                className={`w-full text-left px-4 py-3 text-sm rounded-xl border transition ${errors.shipping_address ? 'border-red-400' : 'border-gray-300 hover:border-pink-400'} ${form.shipping_address ? 'text-gray-800' : 'text-gray-400'}`}
              >
                {form.shipping_address || '🔍 주소 검색'}
              </button>
              {form.shipping_address && (
                <input
                  name="shipping_address_detail"
                  value={form.shipping_address_detail}
                  onChange={handleChange}
                  placeholder="상세주소 (동/호수, 층 등)"
                  className={`${inputClass()} mt-2`}
                  autoFocus
                />
              )}
            </Field>
            <Field label="결제방법" required error={errors.payment_method}>
              <div className="flex gap-3">
                {PAYMENT_METHODS.map(m => (
                  <label key={m} className={`flex-1 border rounded-xl py-3 text-center text-sm cursor-pointer transition ${form.payment_method === m ? 'bg-pink-500 border-pink-500 text-white font-semibold' : 'border-gray-300 text-gray-700 hover:border-pink-300'}`}>
                    <input type="radio" name="payment_method" value={m} checked={form.payment_method === m} onChange={handleChange} className="hidden" />
                    {m}
                  </label>
                ))}
              </div>
              {errors.payment_method && <p className="text-red-500 text-xs mt-1">{errors.payment_method}</p>}
            </Field>

            {form.payment_method === '계좌이체' && (
              <>
                <Field label="세금계산서 / 현금영수증" required error={errors.receipt_type}>
                  <div className="flex gap-3">
                    <label className={`flex-1 border rounded-xl py-3 text-center text-sm cursor-pointer transition ${form.receipt_type === '현금영수증' ? 'bg-purple-500 border-purple-500 text-white font-semibold' : 'border-gray-300 text-gray-700 hover:border-purple-300'}`}>
                      <input type="radio" name="receipt_type" value="현금영수증" checked={form.receipt_type === '현금영수증'} onChange={handleChange} className="hidden" />
                      현금영수증
                    </label>
                    <label className={`flex-1 border rounded-xl py-3 text-center text-sm cursor-pointer transition ${form.receipt_type === '세금계산서' ? 'bg-purple-500 border-purple-500 text-white font-semibold' : 'border-gray-300 text-gray-700 hover:border-purple-300'}`}>
                      <input type="radio" name="receipt_type" value="세금계산서" checked={form.receipt_type === '세금계산서'} onChange={handleChange} className="hidden" />
                      세금계산서 <span className="text-xs opacity-80">(부가세 10%별도)</span>
                    </label>
                  </div>
                  {errors.receipt_type && <p className="text-red-500 text-xs mt-1">{errors.receipt_type}</p>}
                </Field>
                {(form.receipt_type === '세금계산서' || form.receipt_type === '현금영수증') && (
                  <Field label="사업자등록번호" required={form.receipt_type === '세금계산서'} error={errors.business_number}>
                    <input name="business_number" value={form.business_number} onChange={handleChange} placeholder="000-00-00000" className={inputClass(errors.business_number)} />
                  </Field>
                )}
                <Field label="이메일 주소" error={errors.email}>
                  <input name="email" value={form.email} onChange={handleChange} placeholder="example@email.com" type="email" className={inputClass(errors.email)} />
                </Field>
              </>
            )}

            {form.payment_method === '카드결제' && (
              <>
                <Field label="결제 링크 받을 휴대폰번호" error={errors.card_phone}>
                  <input name="card_phone" value={form.card_phone} onChange={handleChange} placeholder="010-0000-0000" className={inputClass(errors.card_phone)} />
                </Field>
                <Field label="이메일 주소" error={errors.email}>
                  <input name="email" value={form.email} onChange={handleChange} placeholder="example@email.com" type="email" className={inputClass(errors.email)} />
                </Field>
              </>
            )}

            {/* 거래명세서/견적서 요청 */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="needs_statement"
                  checked={form.needs_statement}
                  onChange={e => setForm(prev => ({ ...prev, needs_statement: e.target.checked }))}
                  className="w-4 h-4 accent-pink-500"
                />
                <span className="text-sm text-gray-700">거래명세서 / 견적서 이메일 발송 요청</span>
              </label>
              {form.needs_statement && (
                <div className="mt-2">
                  <input
                    name="statement_email"
                    value={form.statement_email}
                    onChange={handleChange}
                    placeholder="받으실 이메일 주소"
                    type="email"
                    className={inputClass()}
                  />
                </div>
              )}
            </div>
          </Section>

          <Section title="기타 요청사항 (선택)">
            <textarea name="other_requests" value={form.other_requests} onChange={handleChange} placeholder="추가로 전달하고 싶은 내용을 자유롭게 적어주세요." rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none" />
            <div>
              <p className="text-xs text-gray-500 mb-2">참고 이미지 첨부 (선택, 최대 5장)</p>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-pink-300 rounded-xl py-3 text-pink-500 text-sm hover:bg-pink-50 transition">
                + 이미지 추가
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`참고이미지${i + 1}`} className="w-full h-full object-cover rounded-lg" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* 예상 견적 합계 */}
          {items.some(item => item.product_type) && (() => {
            const estimates = items.filter(item => item.product_type).map(item => {
              const qty = parseInt(item.quantity) || 1
              if (item.product_type === '현수막') {
                const w = parseFloat(item.width_cm), h = parseFloat(item.height_cm)
                if (w && h) {
                  const base = calcBannerBasePrice(w, h)
                  const widthM = Math.ceil(w / 100)
                  const finishingTotal = item.finishing.reduce((sum, f) =>
                    sum + (f === '사방줄미싱' ? 2000 * widthM : (BANNER_FINISHING_PRICES[f] ?? 0)), 0)
                  return { item, subtotal: (base + finishingTotal) * qty, hasPrice: true }
                }
              }
              return { item, subtotal: 0, hasPrice: false }
            })
            const calcTotal = estimates.reduce((sum, e) => sum + e.subtotal, 0)
            const hasAny = estimates.some(e => e.hasPrice)
            const hasUnpriced = estimates.some(e => !e.hasPrice)
            const shipping = 3000
            return (
              <div className="bg-pink-50 border border-pink-200 rounded-2xl p-5">
                <h2 className="font-bold text-pink-800 mb-3 text-base">💰 예상 견적 합계</h2>
                <div className="space-y-2">
                  {estimates.map(({ item, subtotal, hasPrice }, i) => (
                    <div key={i} className="flex justify-between items-start text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-800">{item.product_type}</span>
                        {(item.width_cm || item.height_cm) && (
                          <span className="text-gray-500 ml-1">({item.width_cm || '?'}×{item.height_cm || '?'}cm)</span>
                        )}
                        {item.design_name && <span className="text-purple-600 ml-1">· {item.design_name}</span>}
                        <span className="text-gray-400 ml-1">× {item.quantity || 1}개</span>
                      </div>
                      <span className="font-semibold ml-3 shrink-0 text-gray-800">
                        {hasPrice ? `${subtotal.toLocaleString()}원` : <span className="text-gray-400 text-xs">견적 안내 예정</span>}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm text-gray-500 pt-1">
                    <span>배송비</span>
                    <span>+{shipping.toLocaleString()}원</span>
                  </div>
                  {hasAny && (
                    <div className="border-t border-pink-300 pt-2 flex justify-between items-baseline">
                      <span className="font-bold text-pink-800">
                        합계 {hasUnpriced && <span className="text-xs font-normal text-gray-400">(일부 별도 안내)</span>}
                      </span>
                      <span className="font-bold text-pink-600 text-lg">{(calcTotal + shipping).toLocaleString()}원~</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-3">※ 예상 금액으로, 실제 견적은 주문 확인 후 안내드립니다.</p>
              </div>
            )
          })()}

          {/* 개인정보 동의 */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={e => setPrivacyAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-pink-500 shrink-0"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-900">[필수] 개인정보 수집·이용에 동의합니다.</span>
                <br />
                <span className="text-xs text-gray-400">수집항목: 기관명, 연락처, 배송주소 / 이용목적: 주문 접수 및 배송 / 보유기간: 거래 완료 후 3년</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !privacyAgreed}
            className={`w-full py-4 rounded-xl font-bold text-base transition ${
              privacyAgreed
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            } disabled:opacity-60`}
          >
            {isSubmitting ? '접수 중...' : '주문 접수하기'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h2 className="font-bold text-gray-800 mb-4 text-base">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-pink-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function inputClass(error?: string) {
  return `w-full border ${error ? 'border-red-400' : 'border-gray-300'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white`
}
