export interface OrderItem {
  product_type: string
  design_type: string
  width_cm: number | null
  height_cm: number | null
  quantity: number
  finishing: string[]
}

export type OrderStatus =
  | '접수'
  | '작업중'
  | '시안 확인 요청중'
  | '시안 수정 요청'
  | '시안 수정 작업중'
  | '시안 확정'
  | '완료'
  | '취소'

export interface Order {
  id: string
  created_at: string
  customer_name: string
  phone: string
  product_type: string
  design_type: string
  width_cm: number | null
  height_cm: number | null
  quantity: number
  text_corrections: string
  shipping_address: string
  payment_method: string
  receipt_type: string | null
  business_number: string | null
  email: string | null
  card_phone: string | null
  payment_link: string | null
  items: OrderItem[] | null
  other_requests: string
  image_urls: string[]
  status: OrderStatus
  draft_images: string[]
  revision_count: number
  revision_notes: string
}
