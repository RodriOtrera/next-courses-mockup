"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export const OTP_LENGTH = 6;

/**
 * The value is a fixed-width slot map, not a compact string: an empty slot is a
 * space, so clearing the 3rd digit of "123456" gives "12 456" and not "12456"
 * — which would silently slide every later digit one box to the left.
 */
export function isOtpComplete(value: string): boolean {
  return /^\d{6}$/.test(value);
}

const EMPTY = " ";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fires the moment the 6th digit lands, from typing, paste or autofill. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  /** Wired to the error message so the boxes describe their own failure. */
  describedBy?: string;
}

/**
 * Six boxes instead of one text field.
 *
 * Beyond looking like a code entry, this fixes what people actually do with an
 * emailed OTP: paste all six digits at once, let the OS autofill them, or fix a
 * single mistyped digit without clearing the rest. Backspace on an empty box
 * steps back instead of dead-ending, and the arrow keys move between digits.
 */
const OtpInput = React.forwardRef<{ focusFirst: () => void }, OtpInputProps>(
  function OtpInput(
    { value, onChange, onComplete, disabled, hasError, describedBy },
    ref
  ) {
    const inputs = React.useRef<Array<HTMLInputElement | null>>([]);

    const digits = React.useMemo(() => {
      const padded = value.padEnd(OTP_LENGTH, EMPTY).slice(0, OTP_LENGTH);
      return padded.split("").map((char) => (/\d/.test(char) ? char : ""));
    }, [value]);

    const focusAt = React.useCallback((index: number) => {
      inputs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus();
    }, []);

    React.useImperativeHandle(ref, () => ({ focusFirst: () => focusAt(0) }), [
      focusAt,
    ]);

    function toValue(slots: string[]): string {
      return slots.map((slot) => slot || EMPTY).join("");
    }

    function commit(slots: string[], caret: number) {
      const next = toValue(slots);
      onChange(next);
      focusAt(caret);
      if (isOtpComplete(next)) onComplete?.(next);
    }

    function handleChange(index: number, raw: string) {
      const typed = raw.replace(/\D/g, "");

      // A cut or a Delete keypress empties the box without a Backspace.
      if (!typed) {
        const slots = digits.slice();
        slots[index] = "";
        onChange(toValue(slots));
        return;
      }

      // A full-length payload is autofill or a paste landing in whichever box
      // happened to hold focus — it always means the whole code.
      if (typed.length === OTP_LENGTH) {
        commit(typed.split(""), OTP_LENGTH - 1);
        return;
      }

      // Typing with the caret after an existing digit reports both characters;
      // only the new one is an edit.
      const previous = digits[index];
      const incoming =
        previous && typed.length > 1 && typed.startsWith(previous)
          ? typed.slice(previous.length)
          : typed;

      const chars = incoming.slice(0, OTP_LENGTH - index).split("");
      const slots = digits.slice();
      chars.forEach((char, offset) => {
        slots[index + offset] = char;
      });

      commit(slots, index + chars.length);
    }

    function handleKeyDown(
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>
    ) {
      if (e.key === "Backspace") {
        e.preventDefault();
        const slots = digits.slice();
        if (slots[index]) {
          slots[index] = "";
          onChange(toValue(slots));
          return;
        }
        slots[Math.max(0, index - 1)] = "";
        onChange(toValue(slots));
        focusAt(index - 1);
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusAt(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        focusAt(index + 1);
      }
    }

    function handlePaste(
      index: number,
      e: React.ClipboardEvent<HTMLInputElement>
    ) {
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
      if (!pasted) return;
      e.preventDefault();
      handleChange(index, pasted);
    }

    return (
      <div className="flex justify-between gap-2" dir="ltr">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            // Only the first box advertises the one-time-code role; repeating
            // it makes iOS offer the same suggestion on all six.
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={OTP_LENGTH}
            value={digit}
            disabled={disabled}
            aria-label={`Dígito ${index + 1} de ${OTP_LENGTH}`}
            aria-invalid={hasError ? true : undefined}
            aria-describedby={describedBy}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(index, e)}
            onFocus={(e) => e.currentTarget.select()}
            className={cn(
              "h-14 w-full min-w-0 rounded-xl border bg-[var(--ep-surface-2)] text-center font-mono text-xl text-[var(--ep-fg)] outline-none transition-all",
              "disabled:cursor-not-allowed disabled:opacity-50",
              hasError
                ? "border-[var(--ep-danger)]/60 focus:border-[var(--ep-danger)] focus:ring-4 focus:ring-[var(--ep-danger)]/15"
                : digit
                  ? "border-[var(--ep-volt-line)] focus:border-[var(--ep-volt)] focus:ring-4 focus:ring-[var(--ep-volt)]/15"
                  : "border-[var(--ep-line)] hover:border-white/15 focus:border-[var(--ep-volt)] focus:ring-4 focus:ring-[var(--ep-volt)]/15"
            )}
          />
        ))}
      </div>
    );
  }
);

export default OtpInput;
