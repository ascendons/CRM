interface LeaveStatusBadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAWN';
}

export function LeaveStatusBadge({ status }: LeaveStatusBadgeProps) {
  const statusConfig = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    APPROVED: { color: 'bg-green-100 text-green-800', label: 'Approved' },
    REJECTED: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    CANCELLED: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
    WITHDRAWN: { color: 'bg-gray-100 text-gray-800', label: 'Withdrawn' }
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
