"use client";

import * as React from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

export type MicSelectOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

export function MicSelect<T extends string>({
  value,
  onChange,
  options,
  title,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<MicSelectOption<T>>;
  title?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const current = options.find((o) => o.value === value)?.label ?? "";

  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as T)}>
      <Select.Trigger
        className={["mic-select", className].filter(Boolean).join(" ")}
        aria-label={ariaLabel}
        title={title}
      >
        <Select.Value aria-label={current}>{current}</Select.Value>
        <Select.Icon className="ml-2">
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="mic-select-content" position="popper" sideOffset={8} align="start">
          <Select.Viewport className="mic-select-viewport">
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="mic-select-item"
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator className="mic-select-item-indicator">
                  <Check className="h-4 w-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}