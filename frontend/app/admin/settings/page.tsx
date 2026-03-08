'use client';

import Link from 'next/link';
import { usePermissionContext } from '@/providers/PermissionProvider';

const SETTINGS_SECTIONS = [
  {
    title: 'Leave Management',
    description: 'Configure leave policies and allocations',
    items: [
      {
        name: 'Leave Policy',
        description: 'Configure default leave allocations for all users',
        href: '/admin/settings/leave-policy',
        icon: '📋',
        permission: 'canManageUsers'
      }
    ]
  },
  {
    title: 'Attendance & Time Tracking',
    description: 'Manage attendance and time tracking settings',
    items: [
      {
        name: 'Office Locations',
        description: 'Manage office locations and geofencing',
        href: '/admin/settings/locations',
        icon: '📍',
        permission: 'canManageUsers'
      },
      {
        name: 'Work Shifts',
        description: 'Configure work shifts and schedules',
        href: '/admin/settings/shifts',
        icon: '🕒',
        permission: 'canManageUsers'
      },
      {
        name: 'Holidays',
        description: 'Manage holiday calendar',
        href: '/admin/settings/holidays',
        icon: '🎉',
        permission: 'canManageUsers'
      }
    ]
  },
  {
    title: 'User Management',
    description: 'Manage users, roles, and permissions',
    items: [
      {
        name: 'Users',
        description: 'Manage user accounts and profiles',
        href: '/admin/users',
        icon: '👥',
        permission: 'canManageUsers'
      },
      {
        name: 'Roles & Permissions',
        description: 'Configure roles and access control',
        href: '/admin/roles',
        icon: '🔐',
        permission: 'canManageRoles'
      },
      {
        name: 'Profiles',
        description: 'Manage user profiles and field permissions',
        href: '/admin/profiles',
        icon: '👤',
        permission: 'canManageProfiles'
      }
    ]
  },
  {
    title: 'System Configuration',
    description: 'System-wide settings and automation',
    items: [
      {
        name: 'Lead Assignment',
        description: 'Configure automatic lead assignment rules',
        href: '/admin/lead-assignment',
        icon: '🎯',
        permission: 'canManageUsers'
      }
    ]
  }
];

export default function AdminSettingsPage() {
  const { hasSystemPermission } = usePermissionContext();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage system configurations and policies
        </p>
      </div>

      {/* Settings Sections */}
      {SETTINGS_SECTIONS.map((section) => {
        // Filter items based on permissions
        const visibleItems = section.items.filter(item =>
          hasSystemPermission(item.permission)
        );

        if (visibleItems.length === 0) return null;

        return (
          <div key={section.title} className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
            </div>

            <div className="divide-y divide-gray-200">
              {visibleItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-3xl">{item.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {/* No Permissions Message */}
      {SETTINGS_SECTIONS.every(section =>
        section.items.every(item => !hasSystemPermission(item.permission))
      ) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <span className="text-4xl mb-2 block">🔒</span>
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Access</h3>
          <p className="text-yellow-700">
            You don't have permission to access any settings.
            Contact your administrator for access.
          </p>
        </div>
      )}
    </div>
  );
}
