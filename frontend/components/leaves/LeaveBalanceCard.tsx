'use client';

import { LeaveTypeBalance } from '@/lib/api/leaves';

interface LeaveBalanceCardProps {
  leaveType: string;
  balance: LeaveTypeBalance;
}

export function LeaveBalanceCard({ leaveType, balance }: LeaveBalanceCardProps) {
  const getLeaveTypeName = (type: string) => {
    const typeNames: { [key: string]: string } = {
      'SICK': 'Sick Leave',
      'CASUAL': 'Casual Leave',
      'EARNED': 'Earned Leave',
      'PAID': 'Paid Leave',
      'UNPAID': 'Unpaid Leave',
      'MATERNITY': 'Maternity Leave',
      'PATERNITY': 'Paternity Leave',
      'COMPENSATORY': 'Comp Off',
      'BEREAVEMENT': 'Bereavement Leave',
      'MARRIAGE': 'Marriage Leave'
    };
    return typeNames[type] || type;
  };

  const getColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'SICK': 'blue',
      'CASUAL': 'green',
      'EARNED': 'purple',
      'PAID': 'indigo',
      'UNPAID': 'gray',
      'MATERNITY': 'pink',
      'PATERNITY': 'cyan',
      'COMPENSATORY': 'orange',
      'BEREAVEMENT': 'red',
      'MARRIAGE': 'rose'
    };
    return colors[type] || 'blue';
  };

  const color = getColor(leaveType);
  const percentage = balance.total > 0 ? (balance.available / balance.total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {getLeaveTypeName(leaveType)}
          </h3>
          {balance.isCarryForward && balance.carriedForward > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              +{balance.carriedForward} carried forward
            </p>
          )}
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold text-${color}-600`}>
            {balance.available}
          </p>
          <p className="text-sm text-gray-500">Available</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Used: {balance.used}</span>
          <span>Total: {balance.total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`bg-${color}-600 h-3 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-semibold text-gray-900">{balance.used}</p>
          <p className="text-xs text-gray-500">Used</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-yellow-600">{balance.pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-green-600">{balance.available}</p>
          <p className="text-xs text-gray-500">Available</p>
        </div>
      </div>
    </div>
  );
}
