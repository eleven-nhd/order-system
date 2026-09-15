import { useEffect, useMemo, useState } from 'react'
import { BuyerSelector } from './components/BuyerSelector'
import { DateFilter } from './components/DateFilter'
import { DebtMatrix } from './components/DebtMatrix'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { BankQrWidget } from './components/BankQrWidget'
import { ItemSelector } from './components/ItemSelector'
import { MemberList } from './components/MemberList'
import { MenuManager } from './components/MenuManager'
import { OrderHistory } from './components/OrderHistory'
import { OrderSummary } from './components/OrderSummary'
import {
  createMenuItem,
  createOrder,
  createDebtPayment,
  deleteDebtPaymentsByDateRange,
  createUser,
  deleteOrdersByDateRange,
  deleteMenuItem,
  deleteUser,
  getMenuItems,
  getOrders,
  getDebtPayments,
  getUsers,
  updateMenuItem,
  updateUser,
} from './data/orderRepository'
import type {
  DatePreset,
  DateRange,
  DebtPayment,
  DraftOrderLine,
  MenuItem,
  MenuItemType,
  OrderRecord,
  User,
} from './types'
import { computeNetDebts } from './utils/debt'
import { formatMoney } from './utils/money'

type TabKey = 'admin' | 'order' | 'analytics' | 'dashboard'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'analytics', label: 'Dashboard' },
  { key: 'admin', label: 'Admin' },
  { key: 'order', label: 'Đặt hàng' },
  { key: 'dashboard', label: 'Thống kê' },
]

interface CustomDateRangeInput {
  startDate: string
  endDate: string
}

function parseLocalDate(value: string): Date | null {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null
  }

  const localDate = new Date(year, month - 1, day)
  localDate.setHours(0, 0, 0, 0)
  if (
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day
  ) {
    return null
  }

  return localDate
}

function formatDateOnly(value: string): string {
  const parsed = parseLocalDate(value)
  if (!parsed) {
    return value
  }

  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(parsed)
}

function toDateRange(preset: DatePreset, customRange: CustomDateRangeInput): DateRange {
  const now = new Date()

  if (preset === 'all') {
    return { start: null, end: null }
  }

  if (preset === 'custom') {
    const startDate = parseLocalDate(customRange.startDate)
    const endDate = parseLocalDate(customRange.endDate)

    if (!startDate && !endDate) {
      return { start: null, end: null }
    }

    const normalizedStart = startDate && endDate && startDate > endDate ? endDate : startDate
    const normalizedEnd = startDate && endDate && startDate > endDate ? startDate : endDate
    const endExclusive = normalizedEnd ? new Date(normalizedEnd) : null
    if (endExclusive) {
      endExclusive.setDate(endExclusive.getDate() + 1)
    }

    return {
      start: normalizedStart ? normalizedStart.toISOString() : null,
      end: endExclusive ? endExclusive.toISOString() : null,
    }
  }

  const start = new Date(now)
  if (preset === 'today') {
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { start: start.toISOString(), end: end.toISOString() }
  }

  if (preset === 'week') {
    const day = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - day)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return { start: start.toISOString(), end: end.toISOString() }
  }

  if (preset === 'lastMonth') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    start.setMonth(start.getMonth() - 1)
    return { start: start.toISOString(), end: end.toISOString() }
  }

  if (preset === 'year') {
    start.setMonth(0, 1)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setFullYear(end.getFullYear() + 1)
    return { start: start.toISOString(), end: end.toISOString() }
  }

  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('analytics')
  const [users, setUsers] = useState<User[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([])
  const [datePreset, setDatePreset] = useState<DatePreset>('today')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [buyerId, setBuyerId] = useState<number | ''>('')
  const [lines, setLines] = useState<DraftOrderLine[]>([])
  const [voucherValue, setVoucherValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDeletingOrders, setIsDeletingOrders] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [noticeMessage, setNoticeMessage] = useState('')

  const dateRange = useMemo(
    () => toDateRange(datePreset, { startDate: customStartDate, endDate: customEndDate }),
    [customEndDate, customStartDate, datePreset],
  )
  const debts = useMemo(() => computeNetDebts(orders, users, debtPayments), [debtPayments, orders, users])

  const runSafe = async (work: () => Promise<void>) => {
    try {
      setErrorMessage('')
      setNoticeMessage('')
      await work()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã có lỗi xảy ra.'
      setErrorMessage(message)
    }
  }

  const loadUsers = async () => {
    setUsers(await getUsers())
  }

  const loadMenuItems = async () => {
    setMenuItems(await getMenuItems())
  }

  const loadOrders = async () => {
    setOrders(await getOrders(dateRange))
  }

  const loadDebtPayments = async () => {
    setDebtPayments(await getDebtPayments())
  }

  useEffect(() => {
    let cancelled = false

    const loadInitial = async () => {
      try {
        const [userRows, menuRows, paymentRows] = await Promise.all([
          getUsers(),
          getMenuItems(),
          getDebtPayments(),
        ])

        if (cancelled) return

        setUsers(userRows)
        setMenuItems(menuRows)
        setDebtPayments(paymentRows)
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Đã có lỗi xảy ra.'
        setErrorMessage(message)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInitial()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const currentRange = { start: dateRange.start, end: dateRange.end }

    const loadByDateRange = async () => {
      try {
        const orderRows = await getOrders(currentRange)
        if (!cancelled) {
          setOrders(orderRows)
        }
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Đã có lỗi xảy ra.'
        setErrorMessage(message)
      }
    }

    void loadByDateRange()
    return () => {
      cancelled = true
    }
  }, [dateRange.end, dateRange.start])

  const handleCreateUser = async (name: string) => {
    await runSafe(async () => {
      await createUser(name)
      await loadUsers()
    })
  }

  const handleUpdateUser = async (id: number, name: string) => {
    await runSafe(async () => {
      await updateUser(id, name)
      await loadUsers()
      await loadOrders()
    })
  }

  const handleDeleteUser = async (id: number) => {
    await runSafe(async () => {
      await deleteUser(id)
      await loadUsers()
      await loadOrders()
    })
  }

  const handleCreateMenuItem = async (name: string, price: number, type: MenuItemType) => {
    await runSafe(async () => {
      await createMenuItem(name, price, type)
      await loadMenuItems()
    })
  }

  const handleUpdateMenuItem = async (
    id: number,
    name: string,
    price: number,
    type: MenuItemType,
  ) => {
    await runSafe(async () => {
      await updateMenuItem(id, name, price, type)
      await loadMenuItems()
      await loadOrders()
    })
  }

  const handleDeleteMenuItem = async (id: number) => {
    await runSafe(async () => {
      await deleteMenuItem(id)
      await loadMenuItems()
      await loadOrders()
    })
  }

  const handleCheckout = async () => {
    if (!buyerId) {
      setErrorMessage('Vui lòng chọn người đi mua trước khi chốt đơn.')
      return
    }

    const validLines = lines.filter(
      (line) => typeof line.userId === 'number' && typeof line.itemId === 'number',
    )
    const voucher = Number(voucherValue)
    const normalizedVoucher = Number.isFinite(voucher) ? Math.max(0, voucher) : 0

    if (validLines.length === 0) {
      setErrorMessage('Vui lòng chọn người dùng món và món ăn hợp lệ.')
      return
    }

    await runSafe(async () => {
      await createOrder(
        buyerId,
        validLines.map((line) => ({
          itemId: line.itemId as number,
          userId: line.userId as number,
          quantity: line.quantity,
        })),
        normalizedVoucher,
      )
      await loadOrders()
      setLines([])
      setBuyerId('')
      setVoucherValue('')
      setActiveTab('dashboard')
      setNoticeMessage('Đã chốt đơn thành công.')
    })
  }

  const handleDebtPayment = async (debt: { fromUserId: number; toUserId: number; amount: number }, amount: number) => {
    try {
      setErrorMessage('')
      setNoticeMessage('')
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Vui lòng nhập số tiền trả nợ lớn hơn 0.')
      }

      if (amount > debt.amount + 0.01) {
        throw new Error('Số tiền trả không được lớn hơn số nợ hiện tại.')
      }

      await createDebtPayment(debt.fromUserId, debt.toUserId, Math.min(amount, debt.amount))
      await loadDebtPayments()
      setNoticeMessage('Đã ghi nhận khoản trả nợ.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể ghi nhận trả nợ.'
      setErrorMessage(message)
    }
  }

  const getDatePresetLabel = (preset: DatePreset): string => {
    if (preset === 'today') return 'Hôm nay'
    if (preset === 'week') return 'Tuần này'
    if (preset === 'month') return 'Tháng này'
    if (preset === 'year') return 'Năm nay'
    if (preset === 'lastMonth') return 'Tháng trước'
    if (preset === 'custom') {
      const from = customStartDate ? formatDateOnly(customStartDate) : 'đầu kỳ'
      const to = customEndDate ? formatDateOnly(customEndDate) : 'cuối kỳ'
      return `Tự chọn (${from} - ${to})`
    }
    return 'Toàn bộ lịch sử'
  }

  const handleDeleteDebtByFilter = async () => {
    if (isDeletingOrders || orders.length === 0) {
      return
    }

    const label = getDatePresetLabel(datePreset)
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa tất cả hóa đơn của phạm vi "${label}"? Hành động này không thể hoàn tác.`,
    )

    if (!confirmed) {
      return
    }

    await runSafe(async () => {
      setIsDeletingOrders(true)
      try {
        const deletedCount = await deleteOrdersByDateRange(dateRange)
        const deletedPaymentCount = await deleteDebtPaymentsByDateRange(dateRange)
        await loadOrders()
        await loadDebtPayments()
        setNoticeMessage(
          `Đã xóa ${deletedCount} hóa đơn và ${deletedPaymentCount} khoản trả nợ trong phạm vi "${label}".`,
        )
      } finally {
        setIsDeletingOrders(false)
      }
    })
  }

  return (
    <main className="cute-app min-h-screen bg-slate-50 text-slate-800">
      <BankQrWidget />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="cute-header rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">KV Order</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý đặt đồ ăn, đồ uống và thống kê chi tiêu của nhóm.
          </p>

          <nav className="cute-tabs mt-5 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {errorMessage && (
            <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </p>
          )}

          {noticeMessage && (
            <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {noticeMessage}
            </p>
          )}
        </header>

        {isLoading ? (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Đang kết nối Supabase...
          </section>
        ) : (
          <section className="mt-6 space-y-4">
            {activeTab === 'admin' && (
              <>
                <MemberList
                  users={users}
                  onCreate={handleCreateUser}
                  onUpdate={handleUpdateUser}
                  onDelete={handleDeleteUser}
                />
                <MenuManager
                  items={menuItems}
                  onCreate={handleCreateMenuItem}
                  onUpdate={handleUpdateMenuItem}
                  onDelete={handleDeleteMenuItem}
                />
              </>
            )}

            {activeTab === 'order' && (
              <>
                <BuyerSelector users={users} value={buyerId} onChange={setBuyerId} />
                <ItemSelector
                  users={users}
                  menuItems={menuItems}
                  lines={lines}
                  onChange={setLines}
                />
                <OrderSummary
                  buyerId={buyerId}
                  users={users}
                  menuItems={menuItems}
                  lines={lines}
                  voucherValue={voucherValue}
                  onVoucherChange={setVoucherValue}
                  onCheckout={handleCheckout}
                />
              </>
            )}

            {activeTab === 'dashboard' && (
              <>
                <DateFilter
                  value={datePreset}
                  onChange={setDatePreset}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  onCustomStartDateChange={setCustomStartDate}
                  onCustomEndDateChange={setCustomEndDate}
                />
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-amber-900">Xóa dữ liệu theo bộ lọc</h2>
                  <p className="mt-1 text-sm text-amber-800">
                    Xóa toàn bộ dữ liệu hóa đơn, nợ trong phạm vi <strong>{getDatePresetLabel(datePreset)}</strong>.
                    Hành động này không thể hoàn tác.
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteDebtByFilter}
                    disabled={orders.length === 0 || isDeletingOrders}
                    className="mt-4 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isDeletingOrders ? 'Đang xóa...' : 'Xóa các hóa đơn theo bộ lọc'}
                  </button>
                </div>
                <DebtMatrix debts={debts} onPayment={handleDebtPayment} />
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Lịch sử trả nợ</h2>
                  <div className="mt-4 space-y-2 text-sm">
                    {debtPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2"
                      >
                        <span>
                          {payment.fromUserName} trả {payment.toUserName}
                        </span>
                        <span className="font-medium text-emerald-700">
                          {formatMoney(payment.amount)}
                        </span>
                      </div>
                    ))}
                    {debtPayments.length === 0 && (
                      <p className="text-slate-500">Chưa có giao dịch trả nợ.</p>
                    )}
                  </div>
                </div>
                <OrderHistory orders={orders} />
              </>
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard
                orders={orders}
                users={users}
                datePreset={datePreset}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onDatePresetChange={setDatePreset}
                onCustomStartDateChange={setCustomStartDate}
                onCustomEndDateChange={setCustomEndDate}
              />
            )}

          </section>
        )}
      </div>
    </main>
  )
}

export default App
