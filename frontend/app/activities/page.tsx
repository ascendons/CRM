"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { activitiesService } from '@/lib/activities';
import { Activity, ActivityType, ActivityStatus, ActivityPriority } from '@/types/activity';
import { showToast } from '@/lib/toast';
import ConfirmModal from '@/components/ConfirmModal';
import { EmptyState } from '@/components/EmptyState';
import {
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Users
} from "lucide-react";

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Selection & Actions
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setError('');
      setLoading(true);
      const data = await activitiesService.getAllActivities();
      setActivities(data);
      setFilteredActivities(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load activities';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = useCallback(() => {
    let filtered = activities;

    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(activity => activity.status === statusFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter(activity => activity.priority === priorityFilter);
    }

    setFilteredActivities(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [activities, searchQuery, typeFilter, statusFilter, priorityFilter]);

  useEffect(() => {
    filterActivities();
  }, [filterActivities]);

  const handleDeleteClick = (id: string) => {
    setActivityToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!activityToDelete) return;

    try {
      setIsDeleting(true);
      await activitiesService.deleteActivity(activityToDelete);
      showToast.success('Activity deleted successfully');
      setShowDeleteModal(false);
      setActivityToDelete(null);
      loadActivities();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete activity';
      showToast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setActivityToDelete(null);
  };

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CALL: return <Phone className="h-4 w-4" />;
      case ActivityType.EMAIL: return <Mail className="h-4 w-4" />;
      case ActivityType.MEETING: return <Users className="h-4 w-4" />;
      case ActivityType.TASK: return <CheckCircle2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: ActivityType) => {
    const colors = {
      [ActivityType.TASK]: 'bg-blue-50 text-blue-700 border-blue-100   
      [ActivityType.EMAIL]: 'bg-purple-50 text-purple-700 border-purple-100   
      [ActivityType.CALL]: 'bg-emerald-50 text-emerald-700 border-emerald-100   
      [ActivityType.MEETING]: 'bg-orange-50 text-orange-700 border-orange-100   
      [ActivityType.NOTE]: 'bg-slate-50 text-slate-700 border-slate-200   
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: ActivityStatus) => {
    const colors = {
      [ActivityStatus.PENDING]: 'bg-amber-50 text-amber-700 border-amber-100   
      [ActivityStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-700 border-blue-100   
      [ActivityStatus.COMPLETED]: 'bg-emerald-50 text-emerald-700 border-emerald-100   
      [ActivityStatus.CANCELLED]: 'bg-slate-50 text-slate-600 border-slate-200   
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadgeColor = (priority: ActivityPriority) => {
    const colors = {
      [ActivityPriority.LOW]: 'text-slate-600 bg-slate-100  
      [ActivityPriority.MEDIUM]: 'text-blue-600 bg-blue-50  
      [ActivityPriority.HIGH]: 'text-orange-600 bg-orange-50  
      [ActivityPriority.URGENT]: 'text-red-600 bg-red-50  
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 ">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500  font-medium">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-white/80  backdrop-blur-lg border-b border-slate-200 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900  tracking-tight">Activities</h1>
              <p className="text-sm text-slate-500 ">Track tasks, meetings, calls, and follow-ups.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/activities/new")}
                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                <Plus className="h-4 w-4" />
                Log Activity
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
        {/* Toolbar */}
        <div className="bg-white  rounded-2xl shadow-sm border border-slate-200  p-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="relative col-span-1 md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {[
              { value: typeFilter, onChange: setTypeFilter, options: Object.values(ActivityType), label: "All Types" },
              { value: statusFilter, onChange: setStatusFilter, options: Object.values(ActivityStatus), label: "All Statuses" },
              { value: priorityFilter, onChange: setPriorityFilter, options: Object.values(ActivityPriority), label: "All Priorities" },
            ].map((filter, idx) => (
              <div key={idx} className="relative">
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map(opt => (
                    <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50  border border-red-200  text-red-700  p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              <button
                onClick={() => { setError(''); loadActivities(); }}
                className="text-sm underline mt-1 hover:text-red-800 "
              >
                Retry
              </button>
            </div>
            <button onClick={() => setError('')}><XCircle className="h-5 w-5" /></button>
          </div>
        )}

        {/* Activities List */}
        <div className="bg-white  rounded-2xl shadow-sm border border-slate-200  overflow-hidden">
          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center">
              {searchQuery || typeFilter || statusFilter || priorityFilter ? (
                <EmptyState
                  icon="search_off"
                  title="No activities found"
                  description="Try adjusting your search criteria or filters."
                />
              ) : (
                <EmptyState
                  icon="event_busy"
                  title="No activities yet"
                  description="Get started by creating your first activity."
                  action={{ label: "Log Activity", href: "/activities/new" }}
                />
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50  border-b border-slate-200 ">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500  uppercase tracking-wider">Activity</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500  uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500  uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500  uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500  uppercase tracking-wider">Related To</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500  uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500  uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 ">
                  {paginatedActivities.map((activity) => (
                    <tr
                      key={activity.id}
                      className="hover:bg-slate-50  transition-colors group cursor-pointer"
                      onClick={() => router.push(`/activities/${activity.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900  line-clamp-1">{activity.subject}</p>
                          <p className="text-xs text-slate-500  mt-0.5 line-clamp-1">{activity.description || "No description"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTypeBadgeColor(activity.type)}`}>
                          {getTypeIcon(activity.type)}
                          {activity.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(activity.status)}`}>
                          {activity.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${activity.priority === 'URGENT' ? 'bg-red-500' :
                            activity.priority === 'HIGH' ? 'bg-orange-500' :
                              activity.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-slate-400'
                            }`}></div>
                          <span className={`text-xs font-medium ${getPriorityBadgeColor(activity.priority).split(' ')[0]}`}>
                            {activity.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 ">
                        {activity.leadName || activity.contactName || activity.accountName || activity.opportunityName || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 ">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {activity.dueDate ? new Date(activity.dueDate).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/activities/${activity.id}/edit`); }}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100  rounded-lg transition-colors"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(activity.id); }}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50  rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredActivities.length > 0 && (
          <div className="flex items-center justify-between bg-white  px-6 py-4 rounded-2xl border border-slate-200  shadow-sm">
            <p className="text-sm text-slate-600 ">
              Showing <span className="font-semibold text-slate-900 ">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-900 ">{Math.min(currentPage * itemsPerPage, filteredActivities.length)}</span> of <span className="font-semibold text-slate-900 ">{filteredActivities.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200  rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50  transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600 " />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200  rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50  transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-slate-600 " />
              </button>
            </div>
          </div>
        )}

      </main>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Activity"
        message="Are you sure you want to delete this activity? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </div>
  );
}
