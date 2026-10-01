import { useEffect, useState, type ChangeEvent, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

/** Accepts "10,50" and "10.50"; parses comma as decimal separator. */
export function parseDecimal(raw: string): number {
  const n = Number(String(raw).trim().replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function toText(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

type Props = Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: number | string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

/**
 * Text input that behaves like a number field on every device (incl. iPhone):
 * - accepts comma or dot as decimal separator
 * - an emptied field stays empty (parent receives "" → treated as 0)
 * The parent onChange receives an event whose target.value is normalized (dot decimal).
 */
export function NumericInput({ value, onChange, inputMode, min, max, step, ...rest }: Props) {
  void min;
  void max;
  void step;
  const [text, setText] = useState(() => toText(value));

  useEffect(() => {
    const external = typeof value === "string" ? parseDecimal(value) : Number(value);
    if (parseDecimal(text) !== external || (text === "" && typeof value === "string" && value !== "")) {
      setText(toText(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      {...rest}
      type="text"
      inputMode={inputMode === "numeric" ? "numeric" : "decimal"}
      autoComplete="off"
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9.,-]/g, "");
        setText(raw);
        const norm = raw.replace(",", ".");
        onChange?.({ target: { value: norm }, currentTarget: { value: norm } } as unknown as ChangeEvent<HTMLInputElement>);
      }}
    />
  );
}
