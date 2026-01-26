"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/auth";
import { User } from "@/types/auth";
import { leadsService } from "@/lib/leads";
import { LeadStatistics } from "@/types/lead";
import { contactsService } from "@/lib/contacts";
import { accountsService } from "@/lib/accounts";
import { opportunitiesService } from "@/lib/opportunities";
import { activitiesService } from "@/lib/activities";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [statistics, setStatistics] = useState<LeadStatistics | null>(null);
  const [contactCount, setContactCount] = useState<number>(0);
  const [accountCount, setAccountCount] = useState<number>(0);
  const [opportunityCount, setOpportunityCount] = useState<number>(0);
  const [activityCount, setActivityCount] = useState<number>(0);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    const currentUser = authService.getUser();
    setUser(currentUser);

    // Load lead statistics
    loadStatistics();
  }, [router]);

  const loadStatistics = async () => {
    try {
      const [stats, contacts, accounts, opportunities, activities] = await Promise.all([
        leadsService.getStatistics(),
        contactsService.getContactCount(),
        accountsService.getAccountCount(),
        opportunitiesService.getOpportunityCount(),
        activitiesService.getActivityCount(),
      ]);
      setStatistics(stats);
      setContactCount(contacts);
      setAccountCount(accounts);
      setOpportunityCount(opportunities);
      setActivityCount(activities);
    } catch (err) {
      console.error("Failed to load statistics:", err);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Executive Overview
              </h2>
              <p className="text-slate-700">
                Welcome back, {user?.fullName || "User"}. Here's what's happening today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-white text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                <span>Last 30 Days</span>
              </button>
              <Link
                href="/opportunities/new"
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm shadow-primary/20"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>Create Deal</span>
              </Link>
            </div>
          </div>

          {/* KPI Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-blue-600">payments</span>
                <span className="text-xs font-bold text-emerald-600">
                  <span className="material-symbols-outlined text-xs">trending_up</span>
                  12.5%
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700">Total Revenue</p>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">₹4,285,000</h3>
              <p className="text-xs text-slate-700">v.s. ₹3.8M last month</p>
            </div>

            {/* New Leads Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-purple-600">person_add</span>
                <span className="text-xs font-bold text-emerald-600">
                  <span className="material-symbols-outlined text-xs">trending_up</span>
                  5.2%
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700">New Leads</p>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                {statistics?.totalLeads || 0}
              </h3>
              <p className="text-xs text-slate-700">+{statistics?.newLeads || 0} from yesterday</p>
            </div>

            {/* Active Deals Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-amber-600">work</span>
                <span className="text-xs font-bold text-emerald-600">
                  <span className="material-symbols-outlined text-xs">trending_up</span>
                  8.1%
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700">Active Deals</p>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                {opportunityCount}
              </h3>
              <p className="text-xs text-slate-700">Avg. deal size ₹24.5k</p>
            </div>

            {/* Win Rate Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-emerald-600">verified</span>
                <span className="text-xs font-bold text-rose-600">
                  <span className="material-symbols-outlined text-xs">trending_down</span>
                  2.4%
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700">Win Rate</p>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">68.2%</h3>
              <p className="text-xs text-slate-700">Target: 70%</p>
            </div>
          </div>

          {/* Lead Statistics Breakdown */}
          {statistics && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Lead Pipeline</h3>
                  <p className="text-sm text-slate-700">Pipeline performance overview</p>
                </div>
                <Link
                  href="/leads"
                  className="text-sm text-primary hover:text-primary/90 font-medium transition-colors"
                >
                  View All Leads →
                </Link>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="text-sm font-medium text-slate-700">Total Leads</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900">
                    {statistics.totalLeads}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="text-sm font-medium text-slate-600">New</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900">
                    {statistics.newLeads}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="text-sm font-medium text-slate-600">Contacted</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900">
                    {statistics.contactedLeads}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="text-sm font-medium text-slate-600">Qualified</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900">
                    {statistics.qualifiedLeads}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="text-sm font-medium text-slate-600">Converted</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900">
                    {statistics.convertedLeads}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overall Statistics */}
          <div className="bg-white">
            <h3 className="text-lg font-bold text-slate-900">CRM Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link
                href="/leads"
                className="bg-slate-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-700">Total Leads</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">
                      {statistics?.totalLeads || 0}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-2xl text-blue-600">group</span>
                </div>
              </Link>

              <Link
                href="/contacts"
                className="bg-slate-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-700">Total Contacts</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{contactCount}</div>
                  </div>
                  <span className="material-symbols-outlined text-2xl text-purple-600">
                    contact_phone
                  </span>
                </div>
              </Link>

              <Link
                href="/accounts"
                className="bg-slate-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-700">Total Accounts</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{accountCount}</div>
                  </div>
                  <span className="material-symbols-outlined text-2xl text-emerald-600">
                    business
                  </span>
                </div>
              </Link>

              <Link
                href="/opportunities"
                className="bg-slate-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-700">Total Opportunities</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{opportunityCount}</div>
                  </div>
                  <span className="material-symbols-outlined text-2xl text-amber-600">
                    handshake
                  </span>
                </div>
              </Link>

              <Link
                href="/activities"
                className="bg-slate-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-700">Total Activities</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{activityCount}</div>
                  </div>
                  <span className="material-symbols-outlined text-2xl text-teal-600">
                    event
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white">
            <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/leads/new"
                className="flex items-center p-4 bg-slate-50 rounded-xl hover:shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-2xl text-primary">add</span>
                <div className="ml-4">
                  <div className="text-sm font-medium text-slate-900">Create New Lead</div>
                  <div className="text-xs text-slate-700">Add a new lead to your CRM</div>
                </div>
              </Link>

              <Link
                href="/leads"
                className="flex items-center p-4 bg-slate-50 rounded-xl hover:shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-2xl text-slate-600">group</span>
                <div className="ml-4">
                  <div className="text-sm font-medium text-slate-900">View All Leads</div>
                  <div className="text-xs text-slate-700">Manage your lead pipeline</div>
                </div>
              </Link>

              <Link
                href="/contacts/new"
                className="flex items-center p-4 bg-slate-50 rounded-xl hover:shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-2xl text-purple-600">add</span>
                <div className="ml-4">
                  <div className="text-sm font-medium text-slate-900">Create New Contact</div>
                  <div className="text-xs text-slate-700">Add a new contact</div>
                </div>
              </Link>

              <Link
                href="/accounts/new"
                className="flex items-center p-4 bg-slate-50 rounded-xl hover:shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-2xl text-emerald-600">add</span>
                <div className="ml-4">
                  <div className="text-sm font-medium text-slate-900">Create New Account</div>
                  <div className="text-xs text-slate-700">Add a new company account</div>
                </div>
              </Link>

              <Link
                href="/activities/new"
                className="flex items-center p-4 bg-slate-50 rounded-xl hover:shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-2xl text-teal-600">add</span>
                <div className="ml-4">
                  <div className="text-sm font-medium text-slate-900">Create New Activity</div>
                  <div className="text-xs text-slate-700">Log a task, call, or meeting</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
