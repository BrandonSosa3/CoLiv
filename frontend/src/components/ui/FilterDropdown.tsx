import { Filter } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
}

interface FilterDropdownProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
}

export function FilterDropdown({ label, value, onChange, options }: FilterDropdownProps) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-[#98989d] mb-2">
        <Filter className="w-3.5 h-3.5 inline mr-1.5" />
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent appearance-none cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
