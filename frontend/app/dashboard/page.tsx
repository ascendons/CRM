"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/auth";
import { User } from "@/types/auth";
import { leadsService } from "@/lib/leads";
import { LeadStatistics } from "@/types/lead";
import { accountsService } from "@/lib/accounts";
import { opportunitiesService } from "@/lib/opportunities";
import { activitiesService } from "@/lib/activities";
import { contactsService } from "@/lib/contacts";
import { OpportunityStatistics } from "@/types/opportunity";
import {
  Briefcase,
  Users,
  Building2,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserPlus,
  Target,
  ArrowUpRight,
  Plus,
  Bell,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  FileText,
  Trophy
} from "lucide-react";
import { Opportunity } from "@/types/opportunity";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [statistics, setStatistics] = useState<LeadStatistics | null>(null);
  const [opportunityStats, setOpportunityStats] = useState<OpportunityStatistics | null>(null);
  const [contactCount, setContactCount] = useState<number>(0);
  const [accountCount, setAccountCount] = useState<number>(0);
  const [opportunityCount, setOpportunityCount] = useState<number>(0);
  const [activityCount, setActivityCount] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [dealOfTheDay, setDealOfTheDay] = useState<Opportunity | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recent'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    const currentUser = authService.getUser();
    setUser(currentUser);
    loadStatistics();
  }, [router]);

  const loadStatistics = async () => {
    try {
      const [stats, oppStats, contacts, accounts, opportunities, activities, allActivities, allOpportunities] = await Promise.all([
        leadsService.getStatistics(),
        opportunitiesService.getStatistics(),
        contactsService.getContactCount(),
        accountsService.getAccountCount(),
        opportunitiesService.getOpportunityCount(),
        activitiesService.getActivityCount(),
        activitiesService.getAllActivities(),
        opportunitiesService.getAllOpportunities(),
      ]);
      setStatistics(stats);
      setOpportunityStats(oppStats);
      setContactCount(contacts);
      setAccountCount(accounts);
      setOpportunityCount(opportunities);
      setActivityCount(activities);

      // Process activities for widget
      if (allActivities) {
        // Recent: Sort by createdAt desc, take 5
        const recent = [...allActivities]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentActivities(recent);

        // Upcoming: Tasks not completed, sort by dueDate asc (or createdAt if no due date), take 5
        const upcoming = [...allActivities]
          .filter(a => a.type === 'TASK' && a.status !== 'COMPLETED')
          .sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.createdAt).getTime();
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.createdAt).getTime();
            return dateA - dateB;
          })
          .slice(0, 5);
        setUpcomingActivities(upcoming);
      }

      // Process Deal of the Day
      if (allOpportunities && Array.isArray(allOpportunities)) {
        // Filter: status not CLOSED_WON or CLOSED_LOST
        // Sort: amount desc
        const topDeal = [...allOpportunities]
          .filter(o => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST')
          .sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];

        if (topDeal) {
          setDealOfTheDay(topDeal);
        }
      }
    } catch (err) {
      console.error("Failed to load statistics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-primary/10 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      {/* Top Navigation Bar Removed - Using Global Navigation */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.fullName?.split(' ')[0] || "User"}
            </h2>
            <p className="text-slate-500 text-lg">
              Here&apos;s your performance overview for today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
              <Calendar className="h-4 w-4" />
              <span>Last 30 Days</span>
            </button>
            <Link
              href="/leads/new"
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5" />
              <span>Create Lead</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign className="h-24 w-24 text-primary" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  +{opportunityStats?.winRate ? (opportunityStats.winRate / 5).toFixed(1) : "0"}%
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                ₹{opportunityStats?.wonValue ? (opportunityStats.wonValue / 1000).toFixed(0) : "0"}K
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Pipeline: ₹{opportunityStats?.pipelineValue ? (opportunityStats.pipelineValue / 1000).toFixed(0) : "0"}K
              </p>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-primary w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>

          {/* New Leads Card */}
          <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <UserPlus className="h-24 w-24 text-purple-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <UserPlus className="h-6 w-6 text-purple-600" />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  +12%
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">New Leads</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {statistics?.totalLeads || 0}
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                +{statistics?.newLeads || 0} since yesterday
              </p>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>

          {/* Active Deals Card */}
          <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Briefcase className="h-24 w-24 text-amber-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Briefcase className="h-6 w-6 text-amber-600" />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  +5.2%
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">Active Deals</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {opportunityStats?.openOpportunities || opportunityCount}
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Avg size: ₹{opportunityStats?.averageDealSize ? (opportunityStats.averageDealSize / 1000).toFixed(0) : "0"}K
              </p>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>

          {/* Win Rate Card */}
          <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target className="h-24 w-24 text-emerald-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Target className="h-6 w-6 text-emerald-600" />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${opportunityStats && opportunityStats.winRate >= 70 ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"}`}>
                  {opportunityStats && opportunityStats.winRate >= 70 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {opportunityStats ? (opportunityStats.winRate - 70).toFixed(1) : "0"}%
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">Win Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {opportunityStats?.winRate ? opportunityStats.winRate.toFixed(1) : "0"}%
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Target: 70%
              </p>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Pipeline & Quick Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Lead Statistics Breakdown */}
            {statistics && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      Pipeline Overview
                    </h3>
                    <p className="text-sm text-slate-500">Real-time lead conversion metrics</p>
                  </div>
                  <Link
                    href="/leads"
                    className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors group"
                  >
                    View Detailed Report
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[
                    { label: "Total", value: statistics.totalLeads, color: "bg-slate-100 text-slate-600" },
                    { label: "New", value: statistics.newLeads, color: "bg-blue-50 text-blue-600 border-blue-100" },
                    { label: "Contacted", value: statistics.contactedLeads, color: "bg-purple-50 text-purple-600 border-purple-100" },
                    { label: "Qualified", value: statistics.qualifiedLeads, color: "bg-amber-50 text-amber-600 border-amber-100" },
                    { label: "Converted", value: statistics.convertedLeads, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                  ].map((stat, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${stat.color.includes('border') ? '' : 'border-transparent'} ${stat.color.split(' ')[0]} transition-all hover:shadow-sm`}>
                      <div className={`text-xs font-semibold uppercase tracking-wider ${stat.color.split(' ')[1]}`}>{stat.label}</div>
                      <div className="mt-2 text-3xl font-bold text-slate-900">
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action & Insight Center */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${activeTab === 'upcoming' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    {activeTab === 'upcoming' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  Action & Insight Center
                </h3>
                <div className="flex items-center gap-4">
                  <Link
                    href="/activities?type=TASK"
                    className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors group hidden sm:flex"
                  >
                    View All
                    <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab('upcoming')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'upcoming'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      My Tasks
                    </button>
                    <button
                      onClick={() => setActiveTab('recent')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'recent'
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Recent Activity
                    </button>
                  </div>
                  <Link
                    href="/activities/new"
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Task</span>
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                {activeTab === 'upcoming' ? (
                  // Upcoming Tasks Tab
                  upcomingActivities.length > 0 ? (
                    upcomingActivities.map((activity) => (
                      <Link
                        key={activity.id}
                        href={`/activities/${activity.id}/edit`}
                        className="group flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="mt-1">
                          <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${activity.status === 'COMPLETED'
                            ? 'bg-green-500 border-green-500'
                            : 'border-slate-300 group-hover:border-blue-400'
                            }`}>
                            {activity.status === 'COMPLETED' && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium transition-colors ${activity.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {activity.subject}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            {activity.dueDate && (
                              <span className={`text-xs flex items-center gap-1 ${new Date(activity.dueDate) < new Date() ? 'text-red-500 font-medium' : 'text-slate-500'
                                }`}>
                                <Calendar className="h-3 w-3" />
                                {new Date(activity.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {activity.priority && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${activity.priority === 'HIGH' || activity.priority === 'URGENT'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-slate-100 text-slate-500'
                                }`}>
                                {activity.priority}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 group-hover:text-blue-600 transition-all">
                          <ArrowUpRight className="h-4 w-4" />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-500">
                      <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p>No upcoming tasks. You're all caught up!</p>
                      <Link href="/activities/new" className="text-blue-600 text-sm font-medium hover:underline mt-2 inline-block">
                        Create a Task
                      </Link>
                    </div>
                  )
                ) : (
                  // Recent Activity Tab
                  recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <Link
                        key={activity.id}
                        href={`/activities/${activity.id}/edit`}
                        className="group flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-purple-200 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === 'CALL' ? 'bg-green-100 text-green-600' :
                          activity.type === 'EMAIL' ? 'bg-blue-100 text-blue-600' :
                            activity.type === 'MEETING' ? 'bg-purple-100 text-purple-600' :
                              'bg-slate-200 text-slate-600'
                          }`}>
                          {activity.type === 'CALL' && <div className="material-symbols-outlined text-[20px]">call</div>}
                          {activity.type === 'EMAIL' && <div className="material-symbols-outlined text-[20px]">mail</div>}
                          {activity.type === 'MEETING' && <div className="material-symbols-outlined text-[20px]">groups</div>}
                          {activity.type === 'TASK' && <div className="material-symbols-outlined text-[20px]">check_circle</div>}
                          {activity.type === 'NOTE' && <div className="material-symbols-outlined text-[20px]">description</div>}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 group-hover:text-purple-600 transition-colors">{activity.subject}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {activity.type} • {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${activity.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'
                          }`}>
                          {activity.status}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-500">
                      <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p>No recent activity found.</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Quick Actions & Module Stats */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {[
                  { label: "Create Lead", desc: "Add to pipeline", icon: UserPlus, href: "/leads/new", color: "text-blue-600 bg-blue-50" },
                  { label: "New Contact", desc: "Add details", icon: Users, href: "/contacts/new", color: "text-purple-600 bg-purple-50" },
                  { label: "New Account", desc: "Company profile", icon: Building2, href: "/accounts/new", color: "text-emerald-600 bg-emerald-50" },
                  { label: "Log Activity", desc: "Tasks & Calls", icon: CheckCircle2, href: "/activities/new", color: "text-amber-600 bg-amber-50" },
                ].map((action, i) => (
                  <Link
                    key={i}
                    href={action.href}
                    className="flex items-center p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100"
                  >
                    <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{action.label}</div>
                      <div className="text-xs text-slate-500">{action.desc}</div>
                    </div>
                    <ArrowUpRight className="ml-auto h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* System Status / Module Highlights */}
            {/* Performance & Goals Widget */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200 relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-200" />
                    Performance & Goals
                  </h3>
                  <div className="bg-white/10 px-2 py-1 rounded text-[10px] font-medium backdrop-blur-sm border border-white/20">
                    MONTHLY
                  </div>
                </div>

                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-bold">
                    {opportunityStats ? Math.round((opportunityStats.wonValue / 1000000) * 100) : 0}%
                  </span>
                  <span className="text-sm text-indigo-200 mb-1.5">of goal achieved</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${opportunityStats ? Math.min(100, (opportunityStats.wonValue / 1000000) * 100) : 0}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-indigo-100 font-medium mb-6">
                  <span>₹{opportunityStats?.wonValue ? (opportunityStats.wonValue / 1000).toFixed(0) : "0"}K Won</span>
                  <span>Goal: ₹10L</span>
                </div>

                {/* Deal of the Day */}
                {dealOfTheDay && (
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-2 uppercase tracking-wide">
                      <Trophy className="h-3 w-3" />
                      Deal of the Day
                    </div>
                    <div className="font-semibold text-white mb-1 group-hover:text-indigo-100 transition-colors">
                      {dealOfTheDay.opportunityName}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-200">{dealOfTheDay.accountName}</span>
                      <span className="font-bold text-white">₹{(dealOfTheDay.amount / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Link href={`/opportunities/${dealOfTheDay.id}`} className="w-full text-center px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors">
                        View Deal
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
