export interface OrderItem {
  product_type: string
  design_type: string
  design_name?: string
  design_sub_name?: string
  handwriting_change?: boolean
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
  | '결제 대기중'
  | '완료'
  | '취소'

export interface DraftRevision {
  revision: number
  label: string
  images: string[]
}

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
  text_top: string | null
  text_main: string | null
  text_bottom: string | null
  text_corrections: string
  needs_statement: boolean
  statement_email: string | null
  shipping_address: string
  payment_method: string
  receipt_type: string | null
  business_number: string | null
  email: string | null
  card_phone: string | null
  payment_link: string | null
  final_price: number | null
  items: OrderItem[] | null
  other_requests: string
  image_urls: string[]
  status: OrderStatus
  draft_images: string[]
  draft_history: DraftRevision[]
  revision_count: number
  revision_notes: string
}
