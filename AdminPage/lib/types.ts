export interface User {
  _id: string
  phone: string
  email: string
  name: string
  password: string
  points: number
  referral_code: string | null
  created_at: string
  updated_at: string
}

export interface Referral {
  _id: string
  referrer_id: string
  referred_user: {
    name: string
    email: string
    phone: string
  }
  referrer_points: number
  referee_points: number
  status: "completed" | "pending" | "expired"
  created_at: string
}

export interface OrderItem {
  product_id: string
  name: string
  price: number
  quantity: number
  total: number
  flavor: string
  weight: string
}

export interface OrderAddress {
  fullName: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  pincode: string
  landmark: string
}

export interface Order {
  _id: string
  order_id: string
  user_id: string
  actual_subtotal: number
  shipping_fee: number
  cart_total: number
  coupon_code?: string
  coupon_discount_value?: number
  coins_used: number
  coin_discount_value: number
  cash_paid: number
  earned_points: number
  order_items: OrderItem[]
  payment_method: "cod" | "online" | "upi"
  utr_number: string | null
  address: OrderAddress
  status: "pending" | "confirmed" | "packed_and_ready" | "shipped" | "out_for_delivery" | "delivered" | "cancelled"
  status_changed_at?: string
  status_timeline?: Partial<Record<"pending" | "confirmed" | "packed_and_ready" | "shipped" | "out_for_delivery" | "delivered" | "cancelled", string>>
  created_at: string
  updated_at?: string
}

export interface Product {
  _id?: string
  id: string
  name: string
  brand: string
  category: string
  flavor: string
  weight: string
  weights: string
  price: number
  originalPrice: number
  discount: number
  rating: number
  reviews: number
  description: string
  keyBenefits: string
  nutritionalInfo: string
  inStock: boolean
  pricingKey: string
  image: string
  image1: string
  image2: string
  image3: string
}
