"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  calendarService,
  CalendarEvent,
  CreateEventRequest,
  EventType,
  EventStatus,
  Recurrence,
} from "@/lib/calendar";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode = "month" | "week" | "day";
type AdminView = "my" | "all" | "user";

interface UserOption {
  id: string;
  userId: string;
  name: string;
  email: string;
}
interface LeadOption {
  id: string;
  leadId: string;
  name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EVENT_TYPE_COLORS: Record<EventType, string> = {
  MEETING: "#3b82f6",
  CALL: "#22c55e",
  TASK: "#a855f7",
  REMINDER: "#f97316",
  OUT_OF_OFFICE: "#6b7280",
  OTHER: "#ec4899",
};

const PRESET_COLORS = ["#3b82f6", "#22c55e", "#ef4444", "#a855f7", "#f97316", "#ec4899"];
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7am–9pm

function getEventColor(event: CalendarEvent): string {
  return event.color || EVENT_TYPE_COLORS[event.eventType] || "#3b82f6";
}

function formatDatetimeLocal(dt: string | Date): string {
  const d = new Date(dt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISOWithoutZ(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMonthGrid(current: Date): Date[] {
  const first = startOfMonth(current);
  const dayOfWeek = first.getDay();
  const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const start = addDays(first, -startOffset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

// ─── Attendee Picker ──────────────────────────────────────────────────────────
function AttendeePicker({
  users,
  selected,
  onChange,
}: {
  users: UserOption[];
  selected: UserOption[];
  onChange: (users: UserOption[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = users.filter(
    (u) =>
      !selected.find((s) => s.id === u.id) &&
      (u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()))
  );

  function add(u: UserOption) {
    onChange([...selected, u]);
    setQuery("");
  }

  function remove(id: string) {
    onChange(selected.filter((s) => s.id !== id));
  }

  return (
    <div ref={ref} className="relative">
      <div
        className="min-h-10 border border-gray-200 rounded-lg px-2 py-1.5 flex flex-wrap gap-1.5 cursor-text"
        onClick={() => setOpen(true)}
      >
        {selected.map((u) => (
          <span
            key={u.id}
            className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full"
          >
            {u.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(u.id);
              }}
              className="hover:text-blue-600 leading-none"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? "Search colleagues..." : ""}
          className="flex-1 min-w-24 text-sm outline-none bg-transparent"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
          {filtered.map((u) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(u);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{u.name}</div>
                <div className="text-xs text-gray-400">{u.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Lead Picker ──────────────────────────────────────────────────────────────
function LeadPicker({
  leads,
  value,
  onChange,
}: {
  leads: LeadOption[];
  value: { id: string; name: string } | null;
  onChange: (lead: { id: string; name: string } | null) => void;
}) {
  const [query, setQuery] = useState(value?.name || "");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value?.name || "");
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = leads
    .filter((l) => l.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 20);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search leads / clients..."
          className="flex-1 px-3 py-2 text-sm outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="px-2 text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
          {filtered.map((l) => (
            <button
              key={l.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange({ id: l.id, name: l.name });
                setQuery(l.name);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
            >
              <span className="font-medium text-gray-900">{l.name}</span>
              <span className="ml-2 text-xs text-gray-400">{l.leadId}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  event: Partial<CalendarEvent> | null;
  defaultStart?: Date;
  users: UserOption[];
  leads: LeadOption[];
  onClose: () => void;
  onSave: (data: CreateEventRequest, eventId?: string) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
}

function EventModal({ event, defaultStart, users, leads, onClose, onSave, onDelete }: ModalProps) {
  const isEdit = !!event?.eventId;
  const defaultStartDt = defaultStart || new Date();
  const defaultEndDt = new Date(defaultStartDt.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [startTime, setStartTime] = useState(
    event?.startTime ? formatDatetimeLocal(event.startTime) : formatDatetimeLocal(defaultStartDt)
  );
  const [endTime, setEndTime] = useState(
    event?.endTime ? formatDatetimeLocal(event.endTime) : formatDatetimeLocal(defaultEndDt)
  );
  const [location, setLocation] = useState(event?.location || "");
  const [eventType, setEventType] = useState<EventType>(event?.eventType || "MEETING");
  const [status, setStatus] = useState<EventStatus>(event?.status || "SCHEDULED");
  const [color, setColor] = useState(event?.color || PRESET_COLORS[0]);
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false);
  const [recurrence, setRecurrence] = useState<Recurrence>(
    (event?.recurrence as Recurrence) || "NONE"
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Attendees
  const initialAttendees: UserOption[] = (event?.attendeeIds || []).map((id, i) => {
    const match = users.find((u) => u.id === id || u.userId === id);
    return match || { id, userId: id, name: event?.attendeeNames?.[i] || id, email: "" };
  });
  const [attendees, setAttendees] = useState<UserOption[]>(initialAttendees);

  // Lead/client
  const initialLead = event?.clientId
    ? { id: event.clientId, name: event.clientName || event.clientId }
    : null;
  const [selectedLead, setSelectedLead] = useState<{ id: string; name: string } | null>(
    initialLead
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(
        {
          title: title.trim(),
          description,
          startTime: toISOWithoutZ(new Date(startTime)),
          endTime: toISOWithoutZ(new Date(endTime)),
          location,
          clientId: selectedLead?.id,
          clientName: selectedLead?.name,
          eventType,
          status,
          color,
          isAllDay,
          recurrence,
          attendeeIds: attendees.map((a) => a.id),
          attendeeNames: attendees.map((a) => a.name),
        },
        event?.eventId
      );
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event?.eventId || !onDelete) return;
    if (!confirm("Delete this event?")) return;
    setDeleting(true);
    try {
      await onDelete(event.eventId);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Event" : "New Event"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MEETING">Meeting</option>
                <option value="CALL">Call</option>
                <option value="TASK">Task</option>
                <option value="REMINDER">Reminder</option>
                <option value="OUT_OF_OFFICE">Out of Office</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* All Day */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
              All Day
            </label>
          </div>

          {/* Start + End */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location or meeting link"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lead/Client dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client / Lead</label>
            <LeadPicker leads={leads} value={selectedLead} onChange={setSelectedLead} />
          </div>

          {/* Invite Colleagues */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite Colleagues
            </label>
            <AttendeePicker users={users} selected={attendees} onChange={setAttendees} />
            {attendees.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {attendees.length} attendee{attendees.length > 1 ? "s" : ""} invited
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? "border-gray-900 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NONE">Does not repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            {isEdit && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Event"}
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : isEdit ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────
function MonthView({
  current,
  events,
  onDayClick,
  onEventClick,
}: {
  current: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const today = new Date();
  const grid = getMonthGrid(current);

  function eventsOnDay(day: Date): CalendarEvent[] {
    return events.filter((e) => sameDay(new Date(e.startTime), day));
  }

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      <div className="grid grid-cols-7 border-b border-gray-200 shrink-0">
        {DAYS_SHORT.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-gray-500 py-2 uppercase tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {grid.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === current.getMonth();
          const isToday = sameDay(day, today);
          const dayEvents = eventsOnDay(day);
          return (
            <div
              key={idx}
              className={`min-h-28 border-b border-r border-gray-100 p-1.5 cursor-pointer transition-colors ${
                isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50/50 hover:bg-gray-100/50"
              }`}
              onClick={() => onDayClick(day)}
            >
              <div
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${
                  isToday
                    ? "bg-blue-600 text-white"
                    : isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400"
                }`}
              >
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((evt) => (
                  <div
                    key={evt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(evt);
                    }}
                    className="text-xs px-1.5 py-0.5 rounded truncate text-white font-medium cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: getEventColor(evt) }}
                    title={evt.title}
                  >
                    {evt.isAllDay
                      ? evt.title
                      : `${new Date(evt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${evt.title}`}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────
function WeekView({
  current,
  events,
  onSlotClick,
  onEventClick,
}: {
  current: Date;
  events: CalendarEvent[];
  onSlotClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const today = new Date();
  const weekStart = startOfWeek(current);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hourHeight = 56;

  function eventsOnDay(day: Date): CalendarEvent[] {
    return events.filter((e) => sameDay(new Date(e.startTime), day));
  }

  function positionStyle(event: CalendarEvent) {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = Math.max(0, startHour - 7) * hourHeight;
    const height = Math.max(0.5 * hourHeight, (endHour - startHour) * hourHeight);
    return { top, height };
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="w-14 shrink-0" />
        {days.map((day, i) => {
          const isToday = sameDay(day, today);
          return (
            <div key={i} className="flex-1 text-center py-2 border-l border-gray-100">
              <div className="text-xs text-gray-500 uppercase">{DAYS_SHORT[i]}</div>
              <div
                className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-semibold ${isToday ? "bg-blue-600 text-white" : "text-gray-900"}`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex" style={{ height: `${hourHeight * HOURS.length}px` }}>
        <div className="w-14 shrink-0">
          {HOURS.map((h) => (
            <div
              key={h}
              style={{ height: hourHeight }}
              className="border-b border-gray-100 flex items-start justify-end pr-2 pt-1"
            >
              <span className="text-xs text-gray-400">
                {h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`}
              </span>
            </div>
          ))}
        </div>
        {days.map((day, di) => (
          <div key={di} className="flex-1 relative border-l border-gray-100">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: hourHeight }}
                className="border-b border-gray-100 cursor-pointer hover:bg-blue-50/30 transition-colors"
                onClick={() => {
                  const d = new Date(day);
                  d.setHours(h, 0, 0, 0);
                  onSlotClick(d);
                }}
              />
            ))}
            {eventsOnDay(day).map((evt) => {
              const { top, height } = positionStyle(evt);
              return (
                <div
                  key={evt.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(evt);
                  }}
                  className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-white text-xs font-medium overflow-hidden cursor-pointer hover:opacity-90 shadow-sm"
                  style={{ top, height, backgroundColor: getEventColor(evt) }}
                  title={evt.title}
                >
                  <div className="truncate">{evt.title}</div>
                  <div className="opacity-80 text-[10px]">
                    {new Date(evt.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────
function DayView({
  current,
  events,
  onSlotClick,
  onEventClick,
}: {
  current: Date;
  events: CalendarEvent[];
  onSlotClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const hourHeight = 56;
  const dayEvts = events.filter((e) => sameDay(new Date(e.startTime), current));

  function positionStyle(event: CalendarEvent) {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = Math.max(0, startHour - 7) * hourHeight;
    const height = Math.max(0.5 * hourHeight, (endHour - startHour) * hourHeight);
    return { top, height };
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-base font-semibold text-gray-900">
          {current.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </h3>
      </div>
      <div className="flex" style={{ height: `${hourHeight * HOURS.length}px` }}>
        <div className="w-14 shrink-0">
          {HOURS.map((h) => (
            <div
              key={h}
              style={{ height: hourHeight }}
              className="border-b border-gray-100 flex items-start justify-end pr-2 pt-1"
            >
              <span className="text-xs text-gray-400">
                {h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`}
              </span>
            </div>
          ))}
        </div>
        <div className="flex-1 relative border-l border-gray-100">
          {HOURS.map((h) => (
            <div
              key={h}
              style={{ height: hourHeight }}
              className="border-b border-gray-100 cursor-pointer hover:bg-blue-50/30 transition-colors"
              onClick={() => {
                const d = new Date(current);
                d.setHours(h, 0, 0, 0);
                onSlotClick(d);
              }}
            />
          ))}
          {dayEvts.map((evt) => {
            const { top, height } = positionStyle(evt);
            return (
              <div
                key={evt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(evt);
                }}
                className="absolute left-1 right-4 rounded-lg px-3 py-1.5 text-white text-sm font-medium overflow-hidden cursor-pointer hover:opacity-90 shadow"
                style={{ top, height, backgroundColor: getEventColor(evt) }}
                title={evt.title}
              >
                <div className="font-semibold truncate">{evt.title}</div>
                <div className="text-xs opacity-80">
                  {new Date(evt.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" – "}
                  {new Date(evt.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {evt.location && <div className="text-xs opacity-70 truncate">{evt.location}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [current, setCurrent] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [defaultModalStart, setDefaultModalStart] = useState<Date | undefined>(undefined);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminView, setAdminView] = useState<AdminView>("my");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  // Data for pickers
  const [users, setUsers] = useState<UserOption[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);

  // Decode JWT
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        const role = payload.role || payload.roles?.[0] || "";
        setIsAdmin(role === "ADMIN" || role === "ROLE_ADMIN");
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Load users + leads for pickers
  useEffect(() => {
    api
      .get<{ data?: unknown[] }>("/users")
      .then((res: unknown) => {
        const raw = Array.isArray(res) ? res : (res as { data?: unknown[] })?.data || [];
        const mapped: UserOption[] = (raw as Array<Record<string, unknown>>)
          .map((u) => ({
            id: String(u.id || ""),
            userId: String(u.userId || u.id || ""),
            name: String(
              u.profile
                ? `${(u.profile as Record<string, unknown>).firstName || ""} ${(u.profile as Record<string, unknown>).lastName || ""}`.trim()
                : u.username || u.email || u.id
            ),
            email: String(u.email || ""),
          }))
          .filter((u) => u.id);
        setUsers(mapped);
      })
      .catch(() => {});

    api
      .get<{ data?: unknown[]; content?: unknown[] }>("/leads?size=500")
      .then((res: unknown) => {
        const raw = Array.isArray(res)
          ? res
          : (res as { data?: unknown[] })?.data || (res as { content?: unknown[] })?.content || [];
        const mapped: LeadOption[] = (raw as Array<Record<string, unknown>>)
          .map((l) => ({
            id: String(l.id || ""),
            leadId: String(l.leadId || ""),
            name:
              [l.firstName, l.lastName].filter(Boolean).join(" ") || String(l.companyName || l.id),
          }))
          .filter((l) => l.id);
        setLeads(mapped);
      })
      .catch(() => {});
  }, []);

  // Close employee dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(e.target as Node)) {
        setEmployeeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getDateRange = useCallback((): { from: Date; to: Date } => {
    if (viewMode === "month") {
      const grid = getMonthGrid(current);
      return { from: grid[0], to: addDays(grid[grid.length - 1], 1) };
    } else if (viewMode === "week") {
      const ws = startOfWeek(current);
      return { from: ws, to: addDays(ws, 7) };
    } else {
      const d = new Date(current);
      d.setHours(0, 0, 0, 0);
      return { from: d, to: addDays(d, 1) };
    }
  }, [viewMode, current]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      const fromStr = toISOWithoutZ(from);
      const toStr = toISOWithoutZ(to);

      let data: CalendarEvent[];
      if (isAdmin && adminView === "all") {
        data = await calendarService.getAllEvents(fromStr, toStr);
      } else if (isAdmin && adminView === "user" && selectedEmployeeId) {
        data = await calendarService.getUserEvents(selectedEmployeeId, fromStr, toStr);
      } else {
        data = await calendarService.getMyEvents(fromStr, toStr);
      }
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, adminView, isAdmin, selectedEmployeeId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function navigate(dir: 1 | -1) {
    const next = new Date(current);
    if (viewMode === "month") next.setMonth(next.getMonth() + dir);
    else if (viewMode === "week") next.setDate(next.getDate() + dir * 7);
    else next.setDate(next.getDate() + dir);
    setCurrent(next);
  }

  function getTitle(): string {
    if (viewMode === "month")
      return current.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (viewMode === "week") {
      const ws = startOfWeek(current);
      const we = addDays(ws, 6);
      return `${ws.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${we.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return current.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function openCreateModal(date?: Date) {
    setEditingEvent(null);
    setDefaultModalStart(date);
    setModalOpen(true);
  }

  function openEditModal(event: CalendarEvent) {
    setEditingEvent(event);
    setDefaultModalStart(undefined);
    setModalOpen(true);
  }

  async function handleSave(data: CreateEventRequest, eventId?: string) {
    if (eventId) await calendarService.updateEvent(eventId, data);
    else await calendarService.createEvent(data);
    await fetchEvents();
  }

  async function handleDelete(eventId: string) {
    await calendarService.deleteEvent(eventId);
    await fetchEvents();
  }

  const selectedEmployee = users.find((u) => u.id === selectedEmployeeId);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrent(new Date())}
            className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              onClick={() => navigate(1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 min-w-48">{getTitle()}</h1>
          {loading && <span className="text-xs text-gray-400 animate-pulse">Loading...</span>}
        </div>

        <div className="flex items-center gap-3">
          {/* Admin controls */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              {/* View mode selector */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {(
                  [
                    ["my", "My Calendar"],
                    ["all", "All Events"],
                    ["user", "By Employee"],
                  ] as [AdminView, string][]
                ).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => {
                      setAdminView(v);
                      if (v !== "user") setSelectedEmployeeId("");
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      adminView === v
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Employee selector (only when "By Employee" is active) */}
              {adminView === "user" && (
                <div className="relative" ref={employeeDropdownRef}>
                  <button
                    onClick={() => setEmployeeDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors min-w-40"
                  >
                    <span className="material-symbols-outlined text-base text-gray-400">
                      person
                    </span>
                    <span className="flex-1 text-left truncate text-gray-700">
                      {selectedEmployee ? selectedEmployee.name : "Select employee"}
                    </span>
                    <span className="material-symbols-outlined text-base text-gray-400">
                      expand_more
                    </span>
                  </button>
                  {employeeDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Select Employee
                        </p>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {users.length === 0 && (
                          <p className="text-sm text-gray-400 px-3 py-4 text-center">
                            No employees found
                          </p>
                        )}
                        {users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setSelectedEmployeeId(u.id);
                              setEmployeeDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left ${
                              selectedEmployeeId === u.id ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {u.name}
                              </div>
                              <div className="text-xs text-gray-400 truncate">{u.email}</div>
                            </div>
                            {selectedEmployeeId === u.id && (
                              <span className="material-symbols-outlined text-blue-600 text-base">
                                check
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* View switcher */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(["month", "week", "day"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                  viewMode === v
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            New Event
          </button>
        </div>
      </div>

      {/* Admin: viewing someone else's calendar banner */}
      {isAdmin && adminView === "user" && selectedEmployee && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-500 text-base">visibility</span>
          <span className="text-sm text-blue-700">
            Viewing <strong>{selectedEmployee.name}</strong>&apos;s calendar
          </span>
          <button
            onClick={() => {
              setAdminView("my");
              setSelectedEmployeeId("");
            }}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Back to my calendar
          </button>
        </div>
      )}

      {/* Calendar Body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {viewMode === "month" && (
          <MonthView
            current={current}
            events={events}
            onDayClick={openCreateModal}
            onEventClick={openEditModal}
          />
        )}
        {viewMode === "week" && (
          <WeekView
            current={current}
            events={events}
            onSlotClick={openCreateModal}
            onEventClick={openEditModal}
          />
        )}
        {viewMode === "day" && (
          <DayView
            current={current}
            events={events}
            onSlotClick={openCreateModal}
            onEventClick={openEditModal}
          />
        )}
      </div>

      {/* Event Modal */}
      {modalOpen && (
        <EventModal
          event={editingEvent}
          defaultStart={defaultModalStart}
          users={users}
          leads={leads}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          onDelete={editingEvent?.eventId ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
