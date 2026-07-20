"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authInputCls } from "@/components/auth/auth-shell";

/**
 * Password field with a show/hide toggle. Uncontrolled (read via FormData by
 * name), so it drops into the existing auth forms unchanged.
 */
export function PasswordInput({
  id,
  name,
  autoComplete,
  placeholder,
  required,
}: {
  id: string;
  name: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className={`${authInputCls} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-muted hover:text-navy"
      >
        {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
}
