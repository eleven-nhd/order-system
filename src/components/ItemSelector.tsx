import type { DraftOrderLine, MenuItem, User } from '../types'
import { formatMoney } from '../utils/money'

interface ItemSelectorProps {
  users: User[]
  menuItems: MenuItem[]
  lines: DraftOrderLine[]
  onChange: (nextLines: DraftOrderLine[]) => void
}

export function ItemSelector({ users, menuItems, lines, onChange }: ItemSelectorProps) {
  const addLine = () => {
    const newLine: DraftOrderLine = {
      id: crypto.randomUUID(),
      userId: '',
      itemId: '',
      quantity: 1,
    }
    onChange([...lines, newLine])
  }

  const updateLine = (id: string, patch: Partial<DraftOrderLine>) => {
    onChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)))
  }

  const removeLine = (id: string) => {
    onChange(lines.filter((line) => line.id !== id))
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Chọn món</h2>
          <p className="mt-1 text-sm text-slate-500">Chọn món để tính tổng tiền.</p>
        </div>
        <button
          type="button"
          onClick={addLine}
          className="rounded-md bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Thêm dòng
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {lines.map((line) => {
          const selectedItem = menuItems.find((item) => item.id === line.itemId)
          return (
            <div
              key={line.id}
              className="grid gap-2 rounded-md border border-slate-200 p-3 md:grid-cols-[1fr_1fr_120px_auto]"
            >
              <select
                value={line.userId}
                onChange={(event) => {
                  const next = event.target.value
                  updateLine(line.id, { userId: next ? Number(next) : '' })
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Người dùng món</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>

              <select
                value={line.itemId}
                onChange={(event) => {
                  const next = event.target.value
                  updateLine(line.id, { itemId: next ? Number(next) : '' })
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Món ăn / đồ uống</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({formatMoney(item.price)})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={1}
                value={line.quantity}
                onChange={(event) =>
                  updateLine(line.id, {
                    quantity: Math.max(1, Number(event.target.value) || 1),
                  })
                }
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={() => removeLine(line.id)}
                className="rounded-md bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-200"
              >
                Xóa
              </button>

              <div className="md:col-span-4 text-sm text-slate-500">
                Thành tiền: {formatMoney((selectedItem?.price ?? 0) * line.quantity)}
              </div>
            </div>
          )
        })}

        {lines.length === 0 && (
          <p className="text-sm text-slate-500">Chưa có dòng nào. Bấm "Thêm dòng" để chọn món.</p>
        )}
      </div>
    </div>
  )
}

