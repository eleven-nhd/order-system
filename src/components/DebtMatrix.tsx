import { useState } from 'react'
import type { NetDebt } from '../types'
import { formatMoney } from '../utils/money'

interface DebtMatrixProps {
  debts: NetDebt[]
  onPayment: (debt: NetDebt, amount: number) => Promise<void>
}

export function DebtMatrix({ debts, onPayment }: DebtMatrixProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [payingKey, setPayingKey] = useState('')

  const submitPayment = async (debt: NetDebt, amount: number) => {
    const key = `${debt.fromUserId}:${debt.toUserId}`
    setPayingKey(key)
    try {
      await onPayment(debt, amount)
      setAmounts((current) => ({ ...current, [key]: '' }))
    } finally {
      setPayingKey('')
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Quyết toán</h2>
      <p className="mt-1 text-sm text-slate-500">Ai đang nợ ai sau khi cấn trừ 2 chiều.</p>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="p-2">Con nợ</th>
              <th className="p-2">Chủ nợ</th>
              <th className="p-2">Số tiền</th>
              <th className="p-2">Ghi nhận trả</th>
            </tr>
          </thead>
          <tbody>
            {debts.map((debt) => (
              <tr key={`${debt.fromUserId}:${debt.toUserId}`} className="border-b border-slate-100">
                <td className="p-2">{debt.fromUserName}</td>
                <td className="p-2">{debt.toUserName}</td>
                <td className="p-2 font-medium text-rose-700">{formatMoney(debt.amount)}</td>
                <td className="p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={debt.amount}
                      value={amounts[`${debt.fromUserId}:${debt.toUserId}`] ?? ''}
                      onChange={(event) =>
                        setAmounts((current) => ({
                          ...current,
                          [`${debt.fromUserId}:${debt.toUserId}`]: event.target.value,
                        }))
                      }
                      placeholder="Số tiền"
                      className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      disabled={payingKey !== ''}
                      onClick={() =>
                        void submitPayment(debt, Number(amounts[`${debt.fromUserId}:${debt.toUserId}`]))
                      }
                      className="rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Trả khoản này
                    </button>
                    <button
                      type="button"
                      disabled={payingKey !== ''}
                      onClick={() => void submitPayment(debt, debt.amount)}
                      className="rounded-md bg-slate-700 px-2 py-1.5 text-xs font-medium text-white enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Trả hết
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {debts.length === 0 && (
              <tr>
                <td colSpan={4} className="p-2 text-slate-500">
                  Hiện tại không có khoản nợ.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

