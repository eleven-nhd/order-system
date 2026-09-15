import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DatePreset, OrderRecord, User } from '../types'
import { DateFilter } from './DateFilter'
import { formatMoney } from '../utils/money'

interface AnalyticsDashboardProps {
  orders: OrderRecord[]
  users: User[]
  datePreset: DatePreset
  customStartDate: string
  customEndDate: string
  onDatePresetChange: (value: DatePreset) => void
  onCustomStartDateChange: (value: string) => void
  onCustomEndDateChange: (value: string) => void
}

interface ChartRow {
  name: string
  value: number
}

interface AlertRow {
  name: string
  amount: number
}

function getDetailAmount(quantity: number, priceAtTime: number): number {
  return quantity * priceAtTime
}

function sortChartRows(rows: ChartRow[]): ChartRow[] {
  return rows.sort((first, second) => second.value - first.value)
}

function buildPeopleRows(orders: OrderRecord[], users: User[]): ChartRow[] {
  const totals = new Map(users.map((user) => [user.id, { name: user.name, value: 0 }]))

  for (const order of orders) {
    for (const detail of order.details) {
      const current = totals.get(detail.userId) ?? {
        name: detail.userName,
        value: 0,
      }
      current.value += getDetailAmount(detail.quantity, detail.priceAtTime)
      totals.set(detail.userId, current)
    }
  }

  return sortChartRows(Array.from(totals.values()).filter((row) => row.value > 0))
}

function buildItemRows(orders: OrderRecord[], itemType: 'food' | 'drink'): ChartRow[] {
  const totals = new Map<string, ChartRow>()

  for (const order of orders) {
    for (const detail of order.details) {
      if (detail.itemType !== itemType) continue

      const current = totals.get(detail.itemId.toString()) ?? {
        name: detail.itemName,
        value: 0,
      }
      current.value += detail.quantity
      totals.set(detail.itemId.toString(), current)
    }
  }

  return sortChartRows(Array.from(totals.values()))
}

function buildAlerts(orders: OrderRecord[], threshold: number): AlertRow[] {
  const totals = new Map<number, AlertRow>()

  for (const order of orders) {
    for (const detail of order.details) {
      const current = totals.get(detail.userId) ?? {
        name: detail.userName,
        amount: 0,
      }
      current.amount += getDetailAmount(detail.quantity, detail.priceAtTime)
      totals.set(detail.userId, current)
    }
  }

  return Array.from(totals.values())
    .filter((row) => row.amount > threshold)
    .sort((first, second) => second.amount - first.amount)
}

function getAlertThreshold(datePreset: DatePreset): { amount: number; label: string } {
  if (datePreset === 'week') {
    return { amount: 150_000, label: 'tuần này > 150.000đ' }
  }

  return { amount: 500_000, label: 'tháng này > 500.000đ' }
}

function ChartCard({
  title,
  description,
  rows,
  color,
  valueFormatter,
}: {
  title: string
  description: string
  rows: ChartRow[]
  color: string
  valueFormatter: (value: number) => string
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-4 h-72">
        {rows.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={valueFormatter} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => valueFormatter(Number(value))} />
              <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Chưa có dữ liệu trong khoảng này.
          </div>
        )}
      </div>
    </article>
  )
}

export function AnalyticsDashboard({
  orders,
  users,
  datePreset,
  customStartDate,
  customEndDate,
  onDatePresetChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
}: AnalyticsDashboardProps) {
  const peopleRows = buildPeopleRows(orders, users)
  const foodRows = buildItemRows(orders, 'food')
  const drinkRows = buildItemRows(orders, 'drink')
  const threshold = getAlertThreshold(datePreset)
  const alerts = buildAlerts(orders, threshold.amount)

  return (
    <div className="space-y-4">
      <DateFilter
        value={datePreset}
        onChange={onDatePresetChange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartDateChange={onCustomStartDateChange}
        onCustomEndDateChange={onCustomEndDateChange}
      />

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-amber-950">Cảnh báo chi tiêu cao</h2>
            <p className="mt-1 text-sm text-amber-900">
              Những người vượt ngưỡng {threshold.label} trong khoảng thời gian đang chọn.
            </p>
          </div>
          <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-950">
            Ngưỡng {formatMoney(threshold.amount)}
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert) => (
            <div key={alert.name} className="rounded-lg border border-amber-200 bg-white p-3">
              <p className="text-sm font-medium text-slate-900">{alert.name}</p>
              <p className="mt-1 text-lg font-bold text-amber-700">{formatMoney(alert.amount)}</p>
            </div>
          ))}
          {alerts.length === 0 && (
            <p className="text-sm text-amber-900">Chưa có ai vượt ngưỡng trong khoảng này.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Ai ăn uống nhiều nhất"
          description="Xếp theo tổng số tiền món đã dùng sau giảm giá."
          rows={peopleRows}
          color="#7c3aed"
          valueFormatter={formatMoney}
        />
        <ChartCard
          title="Món ăn được ăn nhiều nhất"
          description="Xếp theo số lượng món ăn đã chọn."
          rows={foodRows}
          color="#ea580c"
          valueFormatter={(value) => `${value} phần`}
        />
        <ChartCard
          title="Đồ uống được uống nhiều nhất"
          description="Xếp theo số lượng đồ uống đã chọn."
          rows={drinkRows}
          color="#0284c7"
          valueFormatter={(value) => `${value} ly`}
        />
      </section>
    </div>
  )
}
