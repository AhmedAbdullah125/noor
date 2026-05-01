import { addDays } from "date-fns";

export function parsePrice(val: any): number {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  const s = String(val);
  const n = parseFloat(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function getTodayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export const isBookedDate = (date: Date) => {
  if (!date) return false;
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const start = new Date(2026, 4, 3); // May 3
  const end = new Date(2026, 4, 20);   // May 20
  return d >= start && d <= end;
};

export const timeSlots: string[] = [];
for (let h = 10; h <= 20; h++) {
  timeSlots.push(`${String(h).padStart(2, "0")}:00`);
  timeSlots.push(`${String(h).padStart(2, "0")}:30`);
}

export const calendarStyles = `
  .rdp {
    --rdp-cell-size: 40px;
    --rdp-accent-color: #483383;
    --rdp-background-color: rgba(72, 51, 131, 0.1);
    --rdp-accent-color-foreground: white;
    margin: 0;
  }
  .premium-calendar-container {
    background: rgba(255, 255, 255, 1);
    border: 1px solid rgba(72, 51, 131, 0.1);
    border-radius: 28px;
    box-shadow: 0 15px 45px rgba(0,0,0,0.1);
    font-family: inherit;
    padding: 16px;
    width: calc(100vw - 40px);
    max-width: 350px;
  }
  .rdp-months {
    justify-content: center;
  }
  .rdp-table {
    max-width: none;
    width: 100%;
  }
  .rdp-head_cell {
    font-size: 0.7rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    padding-bottom: 10px;
    text-align: center;
  }
  .rdp-day {
    border-radius: 12px;
    font-weight: 500;
  }
  .rdp-day_selected {
    background-color: var(--rdp-accent-color) !important;
    color: white !important;
    font-weight: 700;
  }
  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
    background-color: var(--rdp-background-color) !important;
    color: var(--rdp-accent-color);
  }
  .rdp-caption_label {
    font-weight: 700;
    color: #483383;
    font-size: 1rem;
  }
  .rdp-nav_button {
    background: #f1f5f9;
    border-radius: 8px;
    padding: 4px;
  }
  .rdp-button[disabled] {
    opacity: 0.2;
  }
  .booked-day {
    background-color: #fff1f2 !important;
    color: #e11d48 !important;
    flex-direction: column !important;
    opacity: 1 !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0px !important;
    font-weight: 700 !important;
  }
  .booked-day-label {
    font-size: 7px;
    font-weight: 800;
    line-height: 1;
    margin-top: 1px;
  }
`;
