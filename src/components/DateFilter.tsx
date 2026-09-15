import type { DatePreset } from '../types'

interface DateFilterProps {
  value: DatePreset
  onChange: (next: DatePreset) => void
  customStartDate: string
  customEndDate: string
  onCustomStartDateChange: (next: string) => void
  onCustomEndDateChange: (next: string) => void
}

export function DateFilter({
  value,
  onChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
}: DateFilterProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Tìm kiếm</h2>
      <p className="mt-1 text-sm text-slate-500">Lọc thống kê theo thời gian.</p>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value as DatePreset)}
        className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="today">Hôm nay</option>
        <option value="week">Tuần nay</option>
        <option value="month">Tháng nay</option>
        <option value="year">Năm nay</option>
        <option value="lastMonth">Tháng trước</option>
        <option value="custom">Tự chọn khoảng thời gian</option>
        <option value="all">Tất cả</option>
      </select>

      {value === 'custom' && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700">
            Từ ngày
            <input
              type="date"
              value={customStartDate}
              max={customEndDate || undefined}
              onChange={(event) => onCustomStartDateChange(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Đến ngày
            <input
              type="date"
              value={customEndDate}
              min={customStartDate || undefined}
              onChange={(event) => onCustomEndDateChange(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      )}
    </div>
  )
}
