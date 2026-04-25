"use client";

import { useState, useEffect } from "react";
import { activitiesService } from "@/lib/activities";
import { Activity, ActivityType, ActivityStatus } from "@/types/activity";
import { formatRelativeTimeIST } from "@/lib/utils/date";
import {
  Calendar,
  Loader2,
  Mail,
  Phone,
  Users,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface RecentActivityTimelineProps {
  refreshKey?: number;
}

interface TimelineItem extends Activity {
  icon: typeof Mail;
  iconColor: string;
  bgColor: string;
}

export function RecentActivityTimeline({ refreshKey }: RecentActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [refreshKey]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const data = await activitiesService.getAllActivities();
      // Take only the first 8 most recent activities
      const sortedData = (Array.isArray(data) ? data : []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setActivities(sortedData.slice(0, 8));
    } catch (err) {
      console.error("Failed to load activities:", err);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityType): typeof Mail => {
    switch (type) {
      case ActivityType.EMAIL:
        return Mail;
      case ActivityType.CALL:
        return Phone;
      case ActivityType.MEETING:
        return Users;
      case ActivityType.TASK:
        return FileText;
      case ActivityType.NOTE:
        return FileText;
      default:
        return Calendar;
    }
  };

  const getActivityIconStyles = (type: ActivityType): { iconColor: string; bgColor: string } => {
    switch (type) {
      case ActivityType.EMAIL:
        return { iconColor: "text-blue-600", bgColor: "bg-blue-50" };
      case ActivityType.CALL:
        return { iconColor: "text-emerald-600", bgColor: "bg-emerald-50" };
      case ActivityType.MEETING:
        return { iconColor: "text-purple-600", bgColor: "bg-purple-50" };
      case ActivityType.TASK:
        return { iconColor: "text-orange-600", bgColor: "bg-orange-50" };
      case ActivityType.NOTE:
        return { iconColor: "text-slate-600", bgColor: "bg-slate-50" };
      default:
        return { iconColor: "text-slate-600", bgColor: "bg-slate-50" };
    }
  };

  const getStatusIcon = (status: ActivityStatus): typeof CheckCircle => {
    switch (status) {
      case ActivityStatus.COMPLETED:
        return CheckCircle;
      case ActivityStatus.IN_PROGRESS:
        return Clock;
      case ActivityStatus.CANCELLED:
        return XCircle;
      case ActivityStatus.PENDING:
        return Clock;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: ActivityStatus): string => {
    switch (status) {
      case ActivityStatus.COMPLETED:
        return "text-emerald-600";
      case ActivityStatus.IN_PROGRESS:
        return "text-blue-600";
      case ActivityStatus.CANCELLED:
        return "text-rose-600";
      case ActivityStatus.PENDING:
        return "text-slate-400";
      default:
        return "text-slate-400";
    }
  };

  const getRelatedEntityName = (activity: Activity): string => {
    if (activity.leadName) return activity.leadName;
    if (activity.contactName) return activity.contactName;
    if (activity.accountName) return activity.accountName;
    if (activity.opportunityName) return activity.opportunityName;
    return "System";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-6 w-6 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-5 w-36 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 bg-slate-200 rounded-lg animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <p className="text-sm text-slate-500">Latest actions and updates</p>
          </div>
        </div>
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No recent activities</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const { iconColor, bgColor } = getActivityIconStyles(activity.type);
            const StatusIcon = getStatusIcon(activity.status);
            const statusColor = getStatusColor(activity.status);

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 group hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                <div className={`h-8 w-8 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {activity.subject}
                    </p>
                    <StatusIcon className={`h-3.5 w-3.5 ${statusColor} flex-shrink-0`} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-primary font-medium">
                      {getRelatedEntityName(activity)}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">
                      {activity.assignedToName || "Unassigned"}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs text-slate-400">
                    {formatRelativeTimeIST(activity.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View All Link */}
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 text-center">
          <button className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
            View all activities
          </button>
        </div>
      )}
    </div>
  );
}
