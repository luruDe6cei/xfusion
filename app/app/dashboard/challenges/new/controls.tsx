'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

// Shared form controls for the wizard steps, styled after the live captures.

export function StepHeading({
  num,
  title,
  optional,
}: {
  num: number;
  title: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-[var(--spacing-16)] pb-[var(--spacing-16)] mb-[var(--spacing-24)] border-b border-solid border-[var(--color-grey-2)]">
      <span className="text-[length:var(--font-size-18)] text-[color:var(--color-violet-6)]">
        {String(num).padStart(2, '0')}
      </span>
      <h2 className="text-[length:var(--font-size-24)] font-[var(--font-weight-semibold)] text-[color:var(--color-grey-black)]">
        {title}
        {optional && (
          <span className="ml-[var(--spacing-12)] text-[length:var(--font-size-18)] font-[var(--font-weight-regular)] text-[color:var(--color-grey-4)]">
            (Optional)
          </span>
        )}
      </h2>
    </div>
  );
}

export function FieldShell({
  label,
  required,
  counter,
  action,
  children,
}: {
  label: string;
  required?: boolean;
  counter?: { len: number; max: number };
  action?: ReactNode; // usually the ✨ improve button
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[var(--spacing-8)]">
      <div className="flex items-end justify-between gap-[var(--spacing-8)]">
        <label className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-black)]">
          {label}
          {required && <span className="text-[color:var(--color-error)]">*</span>}
        </label>
        <div className="flex items-center gap-[var(--spacing-12)]">
          {counter && (
            <span
              className="text-[length:var(--font-size-13)]"
              style={{ color: counter.len > counter.max ? 'var(--color-error)' : 'var(--color-grey-5)' }}
            >
              {counter.len}/{counter.max}
            </span>
          )}
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}

const inputClass =
  'w-full h-[48px] px-[var(--spacing-16)] rounded-[var(--radius-8)] border border-solid border-[var(--color-border-input)] bg-[var(--color-grey-white)] text-[length:var(--font-size-16)] leading-[var(--line-height-130)] text-[color:var(--color-grey-black)] placeholder:text-[color:var(--color-grey-5)] focus:border-[var(--color-primary)] outline-none';

export function TextInput(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      value={props.value}
      maxLength={props.maxLength}
      placeholder={props.placeholder}
      onChange={(e) => props.onChange(e.target.value)}
      className={inputClass}
    />
  );
}

export function TextArea(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}) {
  return (
    <textarea
      value={props.value}
      maxLength={props.maxLength}
      placeholder={props.placeholder}
      rows={props.rows ?? 6}
      onChange={(e) => props.onChange(e.target.value)}
      className="w-full px-[var(--spacing-16)] py-[var(--spacing-12)] rounded-[var(--radius-8)] border border-solid border-[var(--color-border-input)] bg-[var(--color-grey-white)] text-[length:var(--font-size-16)] leading-[var(--line-height-150)] text-[color:var(--color-grey-black)] placeholder:text-[color:var(--color-grey-5)] focus:border-[var(--color-primary)] outline-none resize-y"
    />
  );
}

export function SelectBox(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      className={inputClass + (props.value ? '' : ' text-[color:var(--color-grey-5)]')}
    >
      <option value="" disabled>
        {props.placeholder}
      </option>
      {props.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Multiselect dropdown: checkbox list with a search filter; selected values
// are managed by the parent (rendered as chips there).
export function MultiSelect({
  values,
  onChange,
  options,
  placeholder,
  max,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: string[];
  placeholder: string;
  max: number;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (opt: string) => {
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else if (values.length < max) onChange([...values, opt]);
  };
  const filtered = options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className={
          inputClass +
          ' flex items-center justify-between gap-[var(--spacing-8)] text-left ' +
          (values.length ? '' : ' text-[color:var(--color-grey-5)]')
        }
      >
        <span className="truncate">
          {values.length ? `${values.length} selected from list` : placeholder}
        </span>
        <span aria-hidden className="shrink-0 text-[color:var(--color-grey-5)]">
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-[4px] w-full rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] bg-[var(--color-grey-white)] shadow-lg overflow-hidden">
          <div className="p-[var(--spacing-8)] border-b border-solid border-[var(--color-grey-2)]">
            <input
              value={q}
              autoFocus
              placeholder="Filter…"
              onChange={(e) => setQ(e.target.value)}
              className="w-full h-[36px] px-[var(--spacing-12)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-2)] text-[length:var(--font-size-14)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <ul role="listbox" aria-multiselectable className="max-h-[240px] overflow-y-auto py-[var(--spacing-4)]">
            {filtered.length === 0 && (
              <li className="px-[var(--spacing-12)] py-[var(--spacing-8)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
                No matches
              </li>
            )}
            {filtered.map((opt) => {
              const checked = values.includes(opt);
              const full = !checked && values.length >= max;
              return (
                <li key={opt} role="option" aria-selected={checked}>
                  <label
                    className={`flex items-center gap-[var(--spacing-8)] px-[var(--spacing-12)] py-[var(--spacing-8)] text-[length:var(--font-size-14)] ${
                      full ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--color-grey-1)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={full}
                      onChange={() => toggle(opt)}
                    />
                    {opt}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// Chip list with an input + "Add X" button (Keywords / Required Expertise).
export function ChipInput({
  values,
  onChange,
  placeholder,
  addLabel,
  max,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  addLabel: string;
  max: number;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v) || values.length >= max) return;
    onChange([...values, v]);
    setDraft('');
  };
  return (
    <div className="flex flex-col gap-[var(--spacing-12)]">
      <div className="flex gap-[var(--spacing-12)]">
        <input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          className={inputClass + ' flex-1 border-[var(--color-violet-1)]'}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim() || values.length >= max}
          className="shrink-0 w-[180px] h-[48px] rounded-[var(--radius-40)] bg-[var(--color-grey-black)] hover:bg-[#333] text-[color:var(--color-grey-white)] text-[length:var(--font-size-16)] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {addLabel} +
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-[var(--spacing-8)]">
          {values.map((v) => (
            <span
              key={v}
              className="flex items-center gap-[var(--spacing-8)] px-[var(--spacing-12)] py-[var(--spacing-4)] rounded-[var(--radius-4)] bg-[var(--color-violet-1)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-black)]"
            >
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="text-[color:var(--color-grey-5)] hover:text-[color:var(--color-grey-black)]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
