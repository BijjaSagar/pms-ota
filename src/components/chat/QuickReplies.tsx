interface QuickRepliesProps {
  options: string[]
  onSelect: (value: string) => void
}

export function QuickReplies({ options, onSelect }: QuickRepliesProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-[0.7rem] font-medium text-ink transition hover:border-accent/50 hover:bg-brand-soft hover:text-accent"
        >
          {option}
        </button>
      ))}
    </div>
  )
}
