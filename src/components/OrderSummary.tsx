import type { DraftOrderLine, MenuItem, User } from '../types'
import { calculateOrderPricing } from '../utils/orderPricing'
import { formatMoney } from '../utils/money'

interface OrderSummaryProps {
  buyerId: number | ''
  users: User[]
  menuItems: MenuItem[]
  lines: DraftOrderLine[]
  voucherValue: string
  onVoucherChange: (value: string) => void
  onCheckout: () => Promise<void>
}

export function OrderSummary({
  buyerId,
  users,
  menuItems,
  lines,
  voucherValue,
  onVoucherChange,
  onCheckout,
}: OrderSummaryProps) {
  const buyerName = users.find((user) => user.id === buyerId)?.name
  const validLines = lines.filter(
    (line): line is DraftOrderLine & { userId: number; itemId: number } =>
      typeof line.userId === 'number' &&
      typeof line.itemId === 'number' &&
      menuItems.some((item) => item.id === line.itemId),
  )
  const pricing = calculateOrderPricing(validLines, menuItems, Number(voucherValue))
  const isDisabled = !buyerId || pricing.total <= 0 || validLines.length === 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Tổng kết</h2>
      <p className="mt-1 text-sm text-slate-500">
        Voucher được chia đều cho những người có món trong đơn.
      </p>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Voucher / giảm giá (VND)
        <input
          type="number"
          min={0}
          value={voucherValue}
          onChange={(event) => onVoucherChange(event.target.value)}
          placeholder="VD: 30000"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none ring-violet-200 focus:ring"
        />
      </label>

      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <p>
          Người đi mua: <span className="font-medium">{buyerName ?? 'Chưa chọn'}</span>
        </p>
        <p>
          Số dòng order: <span className="font-medium">{validLines.length}</span>
        </p>
        <p>
          Tổng trước giảm: <span className="font-medium">{formatMoney(pricing.subtotal)}</span>
        </p>
        <p>
          Voucher thực tế: <span className="font-medium">-{formatMoney(pricing.voucherAmount)}</span>
        </p>
        <p>
          Tổng sau giảm: <span className="font-semibold text-emerald-700">{formatMoney(pricing.total)}</span>
        </p>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <h3 className="text-sm font-semibold text-slate-800">Tiền từng người</h3>
        <div className="mt-2 space-y-2 text-sm">
          {users.map((user) => {
            const person = pricing.personTotals.get(user.id)
            if (!person) return null

            return (
              <div key={user.id} className="flex flex-wrap justify-between gap-2">
                <span>{user.name}</span>
                <span className="font-medium">
                  {formatMoney(person.total)}{' '}
                  <span className="font-normal text-slate-500">
                    (giảm {formatMoney(person.discount)})
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={isDisabled}
        onClick={onCheckout}
        className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Chốt đơn
      </button>
    </div>
  )
}

