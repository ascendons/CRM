'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import { User } from '@/types/auth';
import { leadsService } from '@/lib/leads';
import { LeadStatistics } from '@/types/lead';
import { contactsService } from '@/lib/contacts';
import { accountsService } from '@/lib/accounts';
import { opportunitiesService } from '@/lib/opportunities';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [statistics, setStatistics] = useState<LeadStatistics | null>(null);
  const [contactCount, setContactCount] = useState<number>(0);
  const [accountCount, setAccountCount] = useState<number>(0);
  const [opportunityCount, setOpportunityCount] = useState<number>(0);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = authService.getUser();
    setUser(currentUser);

    // Load lead statistics
    loadStatistics();
  }, [router]);

  const loadStatistics = async () => {
    try {
      const [stats, contacts, accounts, opportunities] = await Promise.all([
        leadsService.getStatistics(),
        contactsService.getContactCount(),
        accountsService.getAccountCount(),
        opportunitiesService.getOpportunityCount(),
      ]);
      setStatistics(stats);
      setContactCount(contacts);
      setAccountCount(accounts);
      setOpportunityCount(opportunities);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">CRM Dashboard</h1>
              <div className="hidden md:flex space-x-4">
                <Link href="/leads" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Leads
                </Link>
                <Link href="/contacts" className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium">
                  Contacts
                </Link>
                <Link href="/accounts" className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium">
                  Accounts
                </Link>
                <Link href="/opportunities" className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium">
                  Opportunities
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="text-gray-900 font-medium">{user.fullName}</p>
                <p className="text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to CRM Platform</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">User Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="text-sm text-gray-900">{user.userId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="text-sm text-gray-900">{user.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Status</h3>
                <div className="flex items-center mt-4">
                  <svg className="h-6 w-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-700 font-medium">Authenticated via JWT</span>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Your session is secured with JSON Web Token (JWT) authentication.
                  The token is stored in localStorage and automatically included in API requests.
                </p>
              </div>
            </div>

            {/* Overall Statistics */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CRM Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/leads" className="bg-blue-50 p-6 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-blue-700">Total Leads</div>
                      <div className="mt-2 text-4xl font-bold text-blue-900">
                        {statistics?.totalLeads || 0}
                      </div>
                    </div>
                    <svg className="h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </Link>

                <Link href="/contacts" className="bg-purple-50 p-6 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-purple-700">Total Contacts</div>
                      <div className="mt-2 text-4xl font-bold text-purple-900">
                        {contactCount}
                      </div>
                    </div>
                    <svg className="h-12 w-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </Link>

                <Link href="/accounts" className="bg-green-50 p-6 rounded-lg hover:bg-green-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-green-700">Total Accounts</div>
                      <div className="mt-2 text-4xl font-bold text-green-900">
                        {accountCount}
                      </div>
                    </div>
                    <svg className="h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </Link>

                <Link href="/opportunities" className="bg-orange-50 p-6 rounded-lg hover:bg-orange-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-orange-700">Total Opportunities</div>
                      <div className="mt-2 text-4xl font-bold text-orange-900">
                        {opportunityCount}
                      </div>
                    </div>
                    <svg className="h-12 w-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </Link>
              </div>
            </div>

            {/* Lead Statistics Breakdown */}
            {statistics && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Lead Pipeline</h3>
                  <Link
                    href="/leads"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All Leads →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-700">Total Leads</div>
                    <div className="mt-2 text-3xl font-bold text-blue-900">
                      {statistics.totalLeads}
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-indigo-700">New</div>
                    <div className="mt-2 text-3xl font-bold text-indigo-900">
                      {statistics.newLeads}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-yellow-700">Contacted</div>
                    <div className="mt-2 text-3xl font-bold text-yellow-900">
                      {statistics.contactedLeads}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-green-700">Qualified</div>
                    <div className="mt-2 text-3xl font-bold text-green-900">
                      {statistics.qualifiedLeads}
                    </div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-emerald-700">Converted</div>
                    <div className="mt-2 text-3xl font-bold text-emerald-900">
                      {statistics.convertedLeads}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/leads/new"
                  className="flex items-center p-4 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-2xl">
                    +
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Create New Lead</div>
                    <div className="text-xs text-gray-500">Add a new lead to your CRM</div>
                  </div>
                </Link>

                <Link
                  href="/leads"
                  className="flex items-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 h-12 w-12 bg-gray-500 rounded-lg flex items-center justify-center text-white">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">View All Leads</div>
                    <div className="text-xs text-gray-500">Manage your lead pipeline</div>
                  </div>
                </Link>

                <Link
                  href="/contacts"
                  className="flex items-center p-4 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Manage Contacts</div>
                    <div className="text-xs text-gray-500">View and manage contacts</div>
                  </div>
                </Link>

                <Link
                  href="/contacts/new"
                  className="flex items-center p-4 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center text-white text-2xl">
                    +
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Create New Contact</div>
                    <div className="text-xs text-gray-500">Add a new contact</div>
                  </div>
                </Link>

                <Link
                  href="/accounts"
                  className="flex items-center p-4 bg-white border-2 border-green-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center text-white">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Manage Accounts</div>
                    <div className="text-xs text-gray-500">View and manage accounts</div>
                  </div>
                </Link>

                <Link
                  href="/accounts/new"
                  className="flex items-center p-4 bg-white border-2 border-green-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-2xl">
                    +
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Create New Account</div>
                    <div className="text-xs text-gray-500">Add a new company account</div>
                  </div>
                </Link>

                <Link
                  href="/opportunities/new"
                  className="flex items-center p-4 bg-white border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center text-white text-2xl">
                    +
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Create New Opportunity</div>
                    <div className="text-xs text-gray-500">Add a new sales opportunity</div>
                  </div>
                </Link>

                <Link
                  href="/opportunities"
                  className="flex items-center p-4 bg-white border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Manage Opportunities</div>
                    <div className="text-xs text-gray-500">View and manage sales pipeline</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
