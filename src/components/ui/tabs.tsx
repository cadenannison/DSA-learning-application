interface TabsProps<T extends string> {
  tabs: { value: T; label: string }[]
  active: T
  onChange: (value: T) => void
  className?: string
  variant?: "underline" | "pill"
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className = "",
  variant = "underline",
}: TabsProps<T>) {
  if (variant === "pill") {
    return (
      <div
        className={`flex w-fit gap-1.5 rounded-[11px] border border-border bg-surface p-1 ${className}`}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.value === active
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.value)}
              className={`min-h-[36px] rounded-[9px] px-4 text-[13.5px] font-medium transition-colors ${
                isActive ? "bg-accent text-bg" : "text-text-2 hover:text-text-1"
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`flex gap-6 border-b border-border ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.value === active
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`min-h-[44px] border-b-2 px-1 text-sm font-medium transition-colors ${
              isActive
                ? "border-accent text-text-1"
                : "border-transparent text-text-2 hover:text-text-1"
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
