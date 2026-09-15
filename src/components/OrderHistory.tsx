import type { OrderRecord } from '../types'
import { formatMoney } from '../utils/money'

interface OrderHistoryProps {
  orders: OrderRecord[]
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDetailLabel(itemName: string, quantity: number): string {
  if (itemName.startsWith('[AUTO]')) {
    return 'Phần chia đều'
  }

  return `${itemName} x ${quantity}`
}

export function OrderHistory({ orders }: OrderHistoryProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Lịch sử order</h2>
      <p className="mt-1 text-sm text-slate-500">Danh sách hóa đơn để đối chiếu.</p>

      <div className="mt-4 space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="rounded-lg border border-slate-200 p-3">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 text-sm">
              <span>
                Đơn #{order.id} - Người đi mua: <strong>{order.buyerName}</strong>
              </span>
              <span>{formatDate(order.orderDate)}</span>
            </header>

            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {order.details.map((detail) => (
                <li key={detail.id} className="flex flex-wrap justify-between gap-2">
                  <span>
                    {detail.userName} - {formatDetailLabel(detail.itemName, detail.quantity)}
                  </span>
                  <span>{formatMoney(detail.quantity * detail.priceAtTime)}</span>
                </li>
              ))}
            </ul>

            <footer className="mt-2 border-t border-slate-100 pt-2 text-right text-sm font-medium text-slate-800">
              Tổng: {formatMoney(order.totalAmount)}
            </footer>
          </article>
        ))}

        {orders.length === 0 && <p className="text-sm text-slate-500">Chưa có hóa đơn nào.</p>}
      </div>
    </div>
  )
}

