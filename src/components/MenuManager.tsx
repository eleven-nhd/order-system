import { useState } from 'react'
import type { MenuItem, MenuItemType } from '../types'
import { formatMoney } from '../utils/money'

interface MenuManagerProps {
  items: MenuItem[]
  onCreate: (name: string, price: number, type: MenuItemType) => Promise<void>
  onUpdate: (id: number, name: string, price: number, type: MenuItemType) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function MenuManager({ items, onCreate, onUpdate, onDelete }: MenuManagerProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [type, setType] = useState<MenuItemType>('food')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingPrice, setEditingPrice] = useState('')
  const [editingType, setEditingType] = useState<MenuItemType>('food')

  const resetCreateForm = () => {
    setName('')
    setPrice('')
    setType('food')
  }

  const handleCreate = async () => {
    const parsedPrice = Number(price)
    if (!name.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) return
    await onCreate(name, parsedPrice, type)
    resetCreateForm()
  }

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id)
    setEditingName(item.name)
    setEditingPrice(String(item.price))
    setEditingType(item.type)
  }

  const saveEdit = async (id: number) => {
    const parsedPrice = Number(editingPrice)
    if (!editingName.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) return
    await onUpdate(id, editingName, parsedPrice, editingType)
    setEditingId(null)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
      <p className="mt-1 text-sm text-slate-500">Quản lý menu đồ ăn uống.</p>

      <div className="mt-4 grid gap-2 md:grid-cols-[1fr_160px_130px_auto]">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Tên món"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-violet-200 focus:ring"
        />
        <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="Giá"
          type="number"
          min={0}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-violet-200 focus:ring"
        />
        <select
          value={type}
          onChange={(event) => setType(event.target.value as MenuItemType)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-violet-200 focus:ring"
        >
          <option value="food">Đồ ăn</option>
          <option value="drink">Đồ uống</option>
          <option value="other">Khác</option>
        </select>
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-md bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Thêm
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="p-2">Tên món</th>
              <th className="p-2">Giá</th>
              <th className="p-2">Loại</th>
              <th className="p-2">Tác vụ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                {editingId === item.id ? (
                  <>
                    <td className="p-2">
                      <input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={editingPrice}
                        onChange={(event) => setEditingPrice(event.target.value)}
                        type="number"
                        min={0}
                        className="w-full rounded-md border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={editingType}
                        onChange={(event) => setEditingType(event.target.value as MenuItemType)}
                        className="w-full rounded-md border border-slate-300 px-2 py-1"
                      >
                        <option value="food">Đồ ăn</option>
                        <option value="drink">Đồ uống</option>
                        <option value="other">Khác</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(item.id)}
                          className="rounded-md bg-emerald-600 px-2 py-1 text-white"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-md bg-slate-200 px-2 py-1"
                        >
                          Hủy
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 text-slate-800">{item.name}</td>
                    <td className="p-2 text-slate-800">{formatMoney(item.price)}</td>
                    <td className="p-2 text-slate-800">{item.type}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded-md bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          className="rounded-md bg-rose-100 px-2 py-1 text-rose-700 hover:bg-rose-200"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="p-2 text-slate-500">
                  Chưa có món nào trong menu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

