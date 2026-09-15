import { useState } from 'react'
import type { User } from '../types'

interface MemberListProps {
  users: User[]
  onCreate: (name: string) => Promise<void>
  onUpdate: (id: number, name: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function MemberList({ users, onCreate, onUpdate, onDelete }: MemberListProps) {
  const [newName, setNewName] = useState('')
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleCreate = async () => {
    if (!newName.trim()) return
    await onCreate(newName)
    setNewName('')
  }

  const startEdit = (user: User) => {
    setEditingUserId(user.id)
    setEditingName(user.name)
  }

  const saveEdit = async (id: number) => {
    if (!editingName.trim()) return
    await onUpdate(id, editingName)
    setEditingUserId(null)
    setEditingName('')
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Thành viên</h2>
      <p className="mt-1 text-sm text-slate-500">Thêm sửa xóa thành viên trong nhóm.</p>

      <div className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Tên thành viên"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-violet-200 focus:ring"
        />
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-md bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Thêm
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {users.length === 0 && <p className="text-sm text-slate-500">Chưa có thành viên nào.</p>}
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2">
            {editingUserId === user.id ? (
              <>
                <input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-violet-200 focus:ring"
                />
                <button
                  type="button"
                  onClick={() => saveEdit(user.id)}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUserId(null)}
                  className="rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
                >
                  Hủy
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-slate-800">{user.name}</span>
                <button
                  type="button"
                  onClick={() => startEdit(user)}
                  className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(user.id)}
                  className="rounded-md bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-200"
                >
                  Xóa
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

