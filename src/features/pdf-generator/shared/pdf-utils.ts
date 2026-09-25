export function fieldText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

export function maskAadhaar(value?: string): string {
  if (!value) return "—";
  const cleaned = String(value).replace(/\s+/g, "");
  if (cleaned.length >= 4) {
    return `XXXX-XXXX-${cleaned.slice(-4)}`;
  }
  return value;
}

export function formatAddress(
  addr = "",
  city = "",
  state = "",
  country = "",
  pin = ""
): string {
  if (!addr) return "Not Provided";
  const parts = [addr];
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (country) parts.push(country);
  if (pin) parts.push(pin);
  return parts.join(", ");
}

export function formatTimestamp(dateValue?: string | Date): string {
  if (!dateValue) return "—";
  try {
    return new Date(dateValue).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(dateValue);
  }
}
