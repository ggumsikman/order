export type OrderStatus = '접수' | '작업중' | '완료' | '취소'

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
  other_requests: string
  image_urls: string[]
  status: OrderStatus
}
