import { supabase } from './supabase'
import type {
  DateRange,
  DebtPayment,
  MenuItem,
  MenuItemType,
  OrderRecord,
  User,
} from '../types'
import { calculateOrderPricing } from '../utils/orderPricing'

interface SupabaseErrorLike {
  message: string
}

interface SupabaseOrderDetailRow {
  id: number
  user_id: number
  item_id: number
  quantity: number | null
  price_at_time: number | null
  user: { id: number; name: string } | null
  item: { id: number; name: string; type: MenuItemType } | null
}

interface SupabaseOrderRow {
  id: number
  buyer_id: number
  order_date: string
  total_amount: number
  buyer: { id: number; name: string } | null
  details: SupabaseOrderDetailRow[] | null
}

interface SupabaseDebtPaymentRow {
  id: number
  from_user_id: number
  to_user_id: number
  amount: number
  paid_at: string
  from_user: { id: number; name: string } | null
  to_user: { id: number; name: string } | null
}

type RelationValue<T> = T | T[] | null

const SHARED_ITEM_NAME = '[AUTO] Chia đều'

export interface NewOrderLine {
  userId: number
  itemId: number
  quantity: number
}

function throwIfError(error: SupabaseErrorLike | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage)
  }
}

function unwrapRelation<T>(value: RelationValue<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .order('name', { ascending: true })

  throwIfError(error, 'Không thể tải danh sách thành viên.')
  return (data ?? []).map((row) => ({ id: row.id, name: row.name }))
}

export async function createUser(name: string): Promise<void> {
  const { error } = await supabase.from('users').insert({ name: name.trim() })
  throwIfError(error, 'Không thể tạo thành viên.')
}

export async function updateUser(id: number, name: string): Promise<void> {
  const { error } = await supabase.from('users').update({ name: name.trim() }).eq('id', id)
  throwIfError(error, 'Không thể cập nhật thành viên.')
}

export async function deleteUser(id: number): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id)
  throwIfError(error, 'Không thể xóa thành viên.')
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menuitems')
    .select('id, name, price, type')
    .order('type', { ascending: true })
    .order('name', { ascending: true })

  throwIfError(error, 'Không thể tải menu.')

  return (data ?? [])
    .filter((row) => row.name !== SHARED_ITEM_NAME)
    .map((row) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price),
      type: (row.type ?? 'food') as MenuItemType,
    }))
}

export async function createMenuItem(
  name: string,
  price: number,
  type: MenuItemType,
): Promise<void> {
  if (name.trim() === SHARED_ITEM_NAME) {
    throw new Error('Tên món này được hệ thống sử dụng tự động.')
  }

  const { error } = await supabase.from('menuitems').insert({
    name: name.trim(),
    price,
    type,
  })
  throwIfError(error, 'Không thể thêm món mới.')
}

export async function updateMenuItem(
  id: number,
  name: string,
  price: number,
  type: MenuItemType,
): Promise<void> {
  if (name.trim() === SHARED_ITEM_NAME) {
    throw new Error('Tên món này được hệ thống sử dụng tự động.')
  }

  const { error } = await supabase
    .from('menuitems')
    .update({ name: name.trim(), price, type })
    .eq('id', id)

  throwIfError(error, 'Không thể cập nhật món ăn.')
}

export async function deleteMenuItem(id: number): Promise<void> {
  const { error } = await supabase.from('menuitems').delete().eq('id', id)
  throwIfError(error, 'Không thể xóa món ăn.')
}

export async function createDebtPayment(
  fromUserId: number,
  toUserId: number,
  amount: number,
): Promise<void> {
  if (fromUserId === toUserId) {
    throw new Error('Người trả và chủ nợ phải là hai người khác nhau.')
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Số tiền trả nợ phải lớn hơn 0.')
  }

  const { error } = await supabase.from('debt_payments').insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    amount,
  })
  throwIfError(error, 'Không thể lưu khoản trả nợ.')
}

export async function getDebtPayments(): Promise<DebtPayment[]> {
  const { data, error } = await supabase
    .from('debt_payments')
    .select(
      `
      id,
      from_user_id,
      to_user_id,
      amount,
      paid_at,
      from_user:users!debt_payments_from_user_id_fkey (id, name),
      to_user:users!debt_payments_to_user_id_fkey (id, name)
      `,
    )
    .order('paid_at', { ascending: false })

  throwIfError(error, 'Không thể tải lịch sử trả nợ.')

  return ((data ?? []) as unknown as SupabaseDebtPaymentRow[]).map((row) => ({
    id: row.id,
    fromUserId: row.from_user_id,
    fromUserName: unwrapRelation(row.from_user)?.name ?? `User #${row.from_user_id}`,
    toUserId: row.to_user_id,
    toUserName: unwrapRelation(row.to_user)?.name ?? `User #${row.to_user_id}`,
    amount: Number(row.amount),
    paidAt: row.paid_at,
  }))
}

export async function createOrder(
  buyerId: number,
  lines: NewOrderLine[],
  voucherAmount = 0,
): Promise<number> {
  if (lines.length === 0) {
    throw new Error('Bạn phải chọn món cho ít nhất một người.')
  }

  const itemIds = Array.from(new Set(lines.map((line) => line.itemId)))
  const { data: menuRows, error: menuError } = await supabase
    .from('menuitems')
    .select('id, name, price, type')
    .in('id', itemIds)

  throwIfError(menuError, 'Không thể đọc thông tin menu.')

  if ((menuRows ?? []).length !== itemIds.length) {
    throw new Error('Một số món ăn không còn tồn tại trong menu.')
  }

  const pricing = calculateOrderPricing(
    lines,
    (menuRows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price),
      type: (row.type ?? 'food') as MenuItemType,
    })),
    voucherAmount,
  )

  if (pricing.total <= 0) {
    throw new Error('Tổng tiền sau giảm phải lớn hơn 0.')
  }

  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .insert({ buyer_id: buyerId, total_amount: pricing.total })
    .select('id')
    .single()

  throwIfError(orderError, 'Không thể tạo order.')

  if (!orderRow) {
    throw new Error('Không thể tạo order.')
  }

  const { error: detailError } = await supabase.from('orderdetails').insert(
    pricing.lines.map((line) => ({
      order_id: orderRow.id,
      user_id: line.userId,
      item_id: line.itemId,
      quantity: line.quantity,
      price_at_time: line.discountedUnitPrice,
    })),
  )

  if (detailError) {
    // Supabase client cannot wrap multi-table inserts in a DB transaction by default.
    await supabase.from('orders').delete().eq('id', orderRow.id)
    throw new Error(detailError.message || 'Không thể lưu chi tiết order.')
  }

  return orderRow.id
}

export async function deleteOrdersByDateRange(range: DateRange): Promise<number> {
  let deleteBuilder = supabase.from('orders').delete().select('id')

  if (range.start) {
    deleteBuilder = deleteBuilder.gte('order_date', range.start)
  }

  if (range.end) {
    deleteBuilder = deleteBuilder.lt('order_date', range.end)
  }

  const { data, error } = await deleteBuilder
  throwIfError(error, 'Không thể xóa hóa đơn theo bộ lọc thời gian.')

  return data?.length ?? 0
}

export async function deleteDebtPaymentsByDateRange(range: DateRange): Promise<number> {
  let deleteBuilder = supabase.from('debt_payments').delete().select('id')

  if (range.start) {
    deleteBuilder = deleteBuilder.gte('paid_at', range.start)
  }

  if (range.end) {
    deleteBuilder = deleteBuilder.lt('paid_at', range.end)
  }

  const { data, error } = await deleteBuilder
  throwIfError(error, 'Không thể xóa lịch sử trả nợ theo bộ lọc thời gian.')

  return data?.length ?? 0
}


export async function getOrders(range: DateRange): Promise<OrderRecord[]> {
  let queryBuilder = supabase
    .from('orders')
    .select(
      `
      id,
      buyer_id,
      order_date,
      total_amount,
      buyer:users!orders_buyer_id_fkey (id, name),
      details:orderdetails (
        id,
        user_id,
        item_id,
        quantity,
        price_at_time,
        user:users!orderdetails_user_id_fkey (id, name),
        item:menuitems!orderdetails_item_id_fkey (id, name, type)
      )
      `,
    )
    .order('order_date', { ascending: false })
    .order('id', { ascending: false })

  if (range.start) {
    queryBuilder = queryBuilder.gte('order_date', range.start)
  }

  if (range.end) {
    queryBuilder = queryBuilder.lt('order_date', range.end)
  }

  const { data, error } = await queryBuilder
  throwIfError(error, 'Không thể tải lịch sử order.')

  const rows = (data ?? []) as unknown as Array<
    Omit<SupabaseOrderRow, 'buyer' | 'details'> & {
      buyer: RelationValue<{ id: number; name: string }>
      details:
        | Array<
            Omit<SupabaseOrderDetailRow, 'user' | 'item'> & {
              user: RelationValue<{ id: number; name: string }>
              item: RelationValue<{ id: number; name: string; type: MenuItemType }>
            }
          >
        | null
    }
  >

  return rows.map((orderRow) => ({
    id: orderRow.id,
    buyerId: orderRow.buyer_id,
    buyerName: unwrapRelation(orderRow.buyer)?.name ?? `User #${orderRow.buyer_id}`,
    orderDate: orderRow.order_date,
    totalAmount: Number(orderRow.total_amount),
    details: (orderRow.details ?? [])
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((detailRow) => ({
        id: detailRow.id,
        userId: detailRow.user_id,
        userName: unwrapRelation(detailRow.user)?.name ?? `User #${detailRow.user_id}`,
        itemId: detailRow.item_id,
        itemName: unwrapRelation(detailRow.item)?.name ?? `Item #${detailRow.item_id}`,
        itemType: (unwrapRelation(detailRow.item)?.type ?? 'food') as MenuItemType,
        quantity: detailRow.quantity ?? 1,
        priceAtTime: Number(detailRow.price_at_time ?? 0),
      })),
  }))
}

