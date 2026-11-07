"use client";

import { useEffect, useRef, useState } from "react";
import { LuCheck, LuChevronDown } from "react-icons/lu";

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownSelectProps {
  id: string;
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function DropdownSelect({ id, label, value, options, onChange, disabled = false }: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedOption = options[selectedIndex] ?? { label: "เลือก", value: "" };

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function openMenu(index = selectedIndex) {
    setActiveIndex(index);
    setOpen(true);
  }

  function chooseOption(option: DropdownOption) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleOptionKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
    if (event.key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;
    if (nextIndex !== null) {
      event.preventDefault();
      setActiveIndex(nextIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={`relative flex h-11 min-w-0 items-center gap-2 rounded-lg border px-3 transition-colors focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/30 ${value ? "border-accent bg-white" : "border-border bg-surface"} ${open ? "border-secondary ring-2 ring-secondary/30" : "hover:border-neutral"}`}>
      <span className="shrink-0 text-xs font-medium text-text-secondary" aria-hidden>{label}</span>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={`${label}: ${selectedOption.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(event.key === "ArrowDown" ? selectedIndex : selectedIndex > 0 ? selectedIndex - 1 : options.length - 1);
          }
        }}
        className="flex h-full min-w-0 flex-1 items-center justify-between gap-2 text-left text-sm text-text-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{selectedOption.label}</span>
        <LuChevronDown size={14} className={`shrink-0 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && !disabled && (
        <div id={`${id}-options`} role="listbox" aria-label={`ตัวเลือก ${label}`} className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 min-w-full overflow-y-auto rounded-xl border border-border bg-white p-1 shadow-menu">
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                ref={(element) => { optionRefs.current[index] = element; }}
                key={option.value || "all"}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={activeIndex === index ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                onClick={() => chooseOption(option)}
                className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none ${selected ? "bg-surface font-medium text-text-primary" : "text-text-primary hover:bg-surface"}`}
              >
                <span className="truncate">{option.label}</span>
                {selected && <LuCheck size={16} className="shrink-0 text-accent" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
