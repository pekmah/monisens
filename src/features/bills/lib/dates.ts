import type { BillCadence, BillRecord } from "@/lib/finance";

export function formatBillDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(timestamp));
}

export function toDateInput(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return Date.now();
  }

  return new Date(year, month - 1, day, 9, 0, 0, 0).getTime();
}

function addMonthsClamped(timestamp: number, months: number) {
  const source = new Date(timestamp);
  const target = new Date(source.getFullYear(), source.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();

  target.setDate(Math.min(source.getDate(), lastDay));
  target.setHours(source.getHours(), source.getMinutes(), 0, 0);
  return target.getTime();
}

export function addCadence(timestamp: number, cadence: BillCadence, index: number) {
  if (cadence === "once") {
    return timestamp;
  }

  if (cadence === "weekly") {
    return timestamp + index * 7 * 86_400_000;
  }

  if (cadence === "monthly") {
    return addMonthsClamped(timestamp, index);
  }

  return addMonthsClamped(timestamp, index * 12);
}

export function getBillPreviewDates(input: {
  cadence: BillCadence;
  endAt?: number | null;
  occurrenceCount?: number | null;
  startAt: number;
}) {
  const maxCount = input.cadence === "once"
    ? 1
    : Math.min(input.occurrenceCount ?? 4, 8);
  const dates: number[] = [];

  for (let index = 0; index < maxCount; index += 1) {
    const nextDate = addCadence(input.startAt, input.cadence, index);
    if (input.endAt && nextDate > input.endAt) {
      break;
    }

    dates.push(nextDate);
  }

  return dates;
}

export function formatCadence(cadence: BillCadence) {
  if (cadence === "once") {
    return "One-time";
  }

  return `${cadence[0].toUpperCase()}${cadence.slice(1)}`;
}

export function getMonthlyImpactMinor(bill: Pick<BillRecord, "amountMinor" | "cadence">) {
  if (bill.cadence === "weekly") {
    return Math.round(bill.amountMinor * 4.33);
  }

  if (bill.cadence === "yearly") {
    return Math.round(bill.amountMinor / 12);
  }

  return bill.amountMinor;
}
