'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const PRODUCT_TYPES = ['현수막', '포멕스 A4', '포멕스 A3', '포멕스 (직접입력)', '실사출력', '기타']
const DESIGN_TYPES = ['기본 디자인 선택', '맞춤 디자인 요청', '직접 파일 제공']
const PAYMENT_METHODS = ['계좌이체', '카드결제']

export default function OrderPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    product_type: '',
    product_type_custom: '',
    design_type: '',
    width_cm: '',
    height_cm: '',
    quantity: '1',
    text_corrections: '',
    shipping_address: '',
    payment_method: '',
    other_requests: '',
  })

  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) {
      alert('이미지는 최대 5장까지 업로드 가능합니다.')
      return
    }
    setImages(prev => [...prev, ...files])
    const previews = files.map(f => URL.createObjectURL(f))
    setImagePreviews(prev => [...prev, ...previews])
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.customer_name.trim()) newErrors.customer_name = '이름을 입력해주세요.'
    if (!form.phone.trim()) newErrors.phone = '연락처를 입력해주세요.'
    if (!form.product_type) newErrors.product_type = '제품 종류를 선택해주세요.'
    if (form.product_type === '포멕스 (직접입력)' && !form.product_type_custom.trim()) newErrors.product_type_custom = '제품 종류를 입력해주세요.'
    if (!form.design_type) newErrors.design_type = '디자인 방식을 선택해주세요.'
    if (!form.width_cm) newErrors.width_cm = '가로 사이즈를 입력해주세요.'
    if (!form.height_cm) newErrors.height_cm = '세로 사이즈를 입력해주세요.'
    if (!form.quantity || parseInt(form.quantity) < 1) newErrors.quantity = '수량을 입력해주세요.'
    if (!form.shipping_address.trim()) newErrors.shipping_address = '배송주소를 입력해주세요.'
    if (!form.payment_method) newErrors.payment_method = '결제방법을 선택해주세요.'
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
        const formData = new FormData()
        formData.append('file', image)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const result = await res.json()
        if (result.success) imageUrls.push(result.url)
      }

      const productType = form.product_type === '포멕스 (직접입력)'
        ? form.product_type_custom
        : form.product_type

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, product_type: productType, image_urls: imageUrls }),
      })

      const result = await res.json()
      if (result.success) {
        router.push('/complete')
      } else {
        alert('주문 접수에 실패했습니다. 다시 시도해주세요.')
      }
    } catch {
      alert('오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">일비롱디자인</h1>
        <p className="mt-1 text-pink-100 text-sm">주문서 작성</p>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-6 text-sm text-pink-800">
          안녕하세요! 아래 양식을 작성해주시면 빠르게 확인 후 연락드리겠습니다.<br />
          <span className="font-semibold">시안 작업 2회까지 무료</span>이며, 이후 회당 3,000원이 추가됩니다.
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <Section title="고객 정보">
            <Field label="이름" required error={errors.customer_name}>
              <input name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="홍길동" className={inputClass(errors.customer_name)} />
            </Field>
            <Field label="연락처" required error={errors.phone}>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="010-0000-0000" className={inputClass(errors.phone)} />
            </Field>
          </Section>

          <Section title="제품 정보">
            <Field label="제품 종류" required error={errors.product_type}>
              <select name="product_type" value={form.product_type} onChange={handleChange} className={inputClass(errors.product_type)}>
                <option value="">선택해주세요</option>
                {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            {form.product_type === '포멕스 (직접입력)' && (
              <Field label="제품 종류 직접 입력" required error={errors.product_type_custom}>
                <input name="product_type_custom" value={form.product_type_custom} onChange={handleChange} placeholder="예) 포멕스 B4" className={inputClass(errors.product_type_custom)} />
              </Field>
            )}
            <Field label="디자인 방식" required error={errors.design_type}>
              <select name="design_type" value={form.design_type} onChange={handleChange} className={inputClass(errors.design_type)}>
                <option value="">선택해주세요</option>
                {DESIGN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </Section>

          <Section title="사이즈 (cm)">
            <p className="text-xs text-gray-500 -mt-2">가로와 세로를 각각 입력해주세요.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="가로 (cm)" required error={errors.width_cm}>
                <input name="width_cm" value={form.width_cm} onChange={handleChange} type="number" placeholder="예) 600" className={inputClass(errors.width_cm)} />
              </Field>
              <Field label="세로 (cm)" required error={errors.height_cm}>
                <input name="height_cm" value={form.height_cm} onChange={handleChange} type="number" placeholder="예) 90" className={inputClass(errors.height_cm)} />
              </Field>
            </div>
          </Section>

          <Section title="주문 내용">
            <Field label="수량" required error={errors.quantity}>
              <input name="quantity" value={form.quantity} onChange={handleChange} type="number" min="1" className={inputClass(errors.quantity)} />
            </Field>
            <Field label="문구 수정사항" error={errors.text_corrections}>
              <textarea name="text_corrections" value={form.text_corrections} onChange={handleChange} placeholder="변경할 문구를 적어주세요. 예) '졸업을 축하합니다' → '생일을 축하합니다'" rows={3} className={`${inputClass(errors.text_corrections)} resize-none`} />
            </Field>
          </Section>

          <Section title="참고 이미지 (선택)">
            <p className="text-xs text-gray-500 -mt-2">최대 5장까지 업로드 가능합니다.</p>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-pink-300 rounded-xl py-4 text-pink-500 text-sm hover:bg-pink-50 transition">
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
          </Section>

          <Section title="배송 및 결제">
            <Field label="배송주소" required error={errors.shipping_address}>
              <input name="shipping_address" value={form.shipping_address} onChange={handleChange} placeholder="도로명 주소를 입력해주세요" className={inputClass(errors.shipping_address)} />
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
          </Section>

          <Section title="기타 요청사항 (선택)">
            <textarea name="other_requests" value={form.other_requests} onChange={handleChange} placeholder="추가로 전달하고 싶은 내용을 자유롭게 적어주세요." rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none" />
          </Section>

          <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-bold text-base hover:opacity-90 transition disabled:opacity-60">
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
