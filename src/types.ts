export type MenuItemType = 'food' | 'drink'

export interface User {
  id: number
  name: string
}

export interface MenuItem {
  id: number
  name: string
  price: number
  type: MenuItemType
}

export interface DraftOrderLine {
  id: string
  userId: number | ''
  itemId: number | ''
  quantity: number
}

export interface OrderDetail {
  id: number
  userId: number
  userName: string
  itemId: number
  itemName: string
  itemType: MenuItemType
  quantity: number
  priceAtTime: number
}

export interface OrderRecord {
  id: number
  buyerId: number
  buyerName: string
  orderDate: string
  totalAmount: number
  details: OrderDetail[]
}

export type DatePreset = 'today' | 'week' | 'month' | 'year' | 'lastMonth' | 'custom' | 'all'

export interface DateRange {
  start: string | null
  end: string | null
}

export interface NetDebt {
  fromUserId: number
  fromUserName: string
  toUserId: number
  toUserName: string
  amount: number
}

export interface DebtPayment {
  id: number
  fromUserId: number
  fromUserName: string
  toUserId: number
  toUserName: string
  amount: number
  paidAt: string
}

