import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

type FilterOption = { value: string; label: string };

export function RecordFilter({
  value,
  options,
  onChange,
}: {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    if (!open) {
      setOpen(true);
      return;
    }
    const buttons = Array.from(menu.current?.querySelectorAll("button") ?? []);
    const current = buttons.findIndex(
      (button) => button === document.activeElement,
    );
    const next =
      current === -1
        ? buttons.findIndex(
            (button) => button.getAttribute("aria-checked") === "true",
          )
        : (current + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) %
          buttons.length;
    buttons[next]?.focus();
  }

  return (
    <div
      className="record-filter"
      onKeyDown={handleKeys}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="record-filter-trigger"
        aria-label={`Filter records: ${selected?.label ?? "All"}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {selected?.label ?? "All"}
        <ChevronDown
          className="dropdown-chevron"
          size={16}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          id={id}
          ref={menu}
          className="record-filter-menu"
          role="radiogroup"
          aria-label="Filter options"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={option.value === value}
              onClick={() => {
                onChange(option.value);
                close();
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={15} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
