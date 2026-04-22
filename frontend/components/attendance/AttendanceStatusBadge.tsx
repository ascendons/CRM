interface AttendanceStatusBadgeProps {
  status:
    | "PRESENT"
    | "LATE"
    | "HALF_DAY"
    | "ABSENT"
    | "ON_LEAVE"
    | "HOLIDAY"
    | "WEEK_OFF"
    | "PENDING";
  lateMinutes?: number;
}

export function AttendanceStatusBadge({ status, lateMinutes }: AttendanceStatusBadgeProps) {
  const statusConfig = {
    PRESENT: { color: "bg-green-100 text-green-800", label: "Present" },
    LATE: {
      color: "bg-yellow-100 text-yellow-800",
      label: lateMinutes ? `Late (${lateMinutes}m)` : "Late",
    },
    HALF_DAY: { color: "bg-orange-100 text-orange-800", label: "Half Day" },
    ABSENT: { color: "bg-red-100 text-red-800", label: "Absent" },
    ON_LEAVE: { color: "bg-blue-100 text-blue-800", label: "On Leave" },
    HOLIDAY: { color: "bg-purple-100 text-purple-800", label: "Holiday" },
    WEEK_OFF: { color: "bg-gray-100 text-gray-800", label: "Week Off" },
    PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}
