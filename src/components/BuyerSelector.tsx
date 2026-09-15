import type { User } from '../types'

interface BuyerSelectorProps {
  users: User[]
  value: number | ''
  onChange: (next: number | '') => void
}

export function BuyerSelector({ users, value, onChange }: BuyerSelectorProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Người đại diện</h2>
      <p className="mt-1 text-sm text-slate-500">Chọn người đại diện đi mua.</p>

      <select
        value={value}
        onChange={(event) => {
          const next = event.target.value
          onChange(next ? Number(next) : '')
        }}
        className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-violet-200 focus:ring"
      >
        <option value="">-- Chọn người đi mua --</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </div>
  )
}

