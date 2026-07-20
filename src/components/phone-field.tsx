"use client";

import { useState } from "react";
import { formatPhone } from "@/lib/format-phone";

/**
 * Phone input that auto-inserts dashes as the user types: (555) 123-4567.
 * Uncontrolled from the parent's perspective (read via FormData by `name`),
 * so it drops into any of the form components unchanged.
 */
export function PhoneField({
  name = "phone",
  className,
  placeholder,
  required,
  id,
  defaultValue = "",
}: {
  name?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(() => formatPhone(defaultValue));
  return (
    <input
      id={id}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      name={name}
      value={value}
      onChange={(e) => setValue(formatPhone(e.target.value))}
      className={className}
      placeholder={placeholder}
      required={required}
    />
  );
}
