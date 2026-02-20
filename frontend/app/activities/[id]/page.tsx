'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { activitiesService } from '@/lib/activities';
import { formatLocaleIST } from '@/lib/utils/date';
import { Activity, ActivityType, ActivityStatus, ActivityPriority } from '@/types/activity';

export default function ActivityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadActivity();
    }
  }, [id]);

  const loadActivity = async () => {
    try {
      const data = await activitiesService.getActivityById(id);
      setActivity(data);
    } catch (error) {
      console.error('Failed to load activity:', error);
      alert('Failed to load activity');
      router.push('/activities');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      await activitiesService.deleteActivity(id);
      router.push('/activities');
    } catch (error) {
      console.error('Failed to delete activity:', error);
      alert('Failed to delete activity');
    }
  };

  const getTypeBadgeColor = (type: ActivityType) => {
    const colors = {
      TASK: 'bg-blue-100 text-blue-800',
      EMAIL: 'bg-purple-100 text-purple-800',
      CALL: 'bg-green-100 text-green-800',
      MEETING: 'bg-orange-100 text-orange-800',
      NOTE: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: ActivityStatus) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadgeColor = (priority: ActivityPriority) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Activity not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{activity.subject}</h1>
              <p className="mt-1 text-sm text-gray-500">{activity.activityId}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/activities/${id}/edit`}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <Link
                href="/activities"
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back to List
              </Link>
            </div>
          </div>

          {/* Status Overview */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex space-x-4">
              <div>
                <span className="text-sm text-gray-500">Type</span>
                <div className="mt-1">
                  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getTypeBadgeColor(activity.type)}`}>
                    {activity.type}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <div className="mt-1">
                  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeColor(activity.status)}`}>
                    {activity.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Priority</span>
                <div className="mt-1">
                  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getPriorityBadgeColor(activity.priority)}`}>
                    {activity.priority}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {activity.description && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{activity.description}</p>
            </div>
          )}

          {/* Scheduling Information */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduling</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activity.scheduledDate && (
                <>
                  <dt className="text-sm font-medium text-gray-500">Scheduled Date</dt>
                  <dd className="text-sm text-gray-900">{formatLocaleIST(activity.scheduledDate)}</dd>
                </>
              )}
              {activity.dueDate && (
                <>
                  <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                  <dd className="text-sm text-gray-900">{formatLocaleIST(activity.dueDate)}</dd>
                </>
              )}
              {activity.completedDate && (
                <>
                  <dt className="text-sm font-medium text-gray-500">Completed Date</dt>
                  <dd className="text-sm text-gray-900">{formatLocaleIST(activity.completedDate)}</dd>
                </>
              )}
              {activity.durationMinutes && (
                <>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="text-sm text-gray-900">{activity.durationMinutes} minutes</dd>
                </>
              )}
              {activity.location && (
                <>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="text-sm text-gray-900">{activity.location}</dd>
                </>
              )}
            </dl>
          </div>

          {/* Related To */}
          {(activity.leadName || activity.contactName || activity.accountName || activity.opportunityName) && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related To</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activity.leadName && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Lead</dt>
                    <dd className="text-sm text-gray-900">
                      <Link href={`/leads/${activity.leadId}`} className="text-teal-600 hover:text-teal-800">
                        {activity.leadName}
                      </Link>
                    </dd>
                  </>
                )}
                {activity.contactName && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Contact</dt>
                    <dd className="text-sm text-gray-900">
                      <Link href={`/contacts/${activity.contactId}`} className="text-teal-600 hover:text-teal-800">
                        {activity.contactName}
                      </Link>
                    </dd>
                  </>
                )}
                {activity.accountName && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Account</dt>
                    <dd className="text-sm text-gray-900">
                      <Link href={`/accounts/${activity.accountId}`} className="text-teal-600 hover:text-teal-800">
                        {activity.accountName}
                      </Link>
                    </dd>
                  </>
                )}
                {activity.opportunityName && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Opportunity</dt>
                    <dd className="text-sm text-gray-900">
                      <Link href={`/opportunities/${activity.opportunityId}`} className="text-teal-600 hover:text-teal-800">
                        {activity.opportunityName}
                      </Link>
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}

          {/* Type-Specific Details */}
          {activity.type === ActivityType.CALL && (activity.phoneNumber || activity.callDirection || activity.callOutcome || activity.callDuration) && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Call Details</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activity.phoneNumber && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                    <dd className="text-sm text-gray-900">{activity.phoneNumber}</dd>
                  </>
                )}
                {activity.callDirection && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Direction</dt>
                    <dd className="text-sm text-gray-900">{activity.callDirection}</dd>
                  </>
                )}
                {activity.callOutcome && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Outcome</dt>
                    <dd className="text-sm text-gray-900">{activity.callOutcome}</dd>
                  </>
                )}
                {activity.callDuration && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Duration</dt>
                    <dd className="text-sm text-gray-900">{activity.callDuration} seconds</dd>
                  </>
                )}
              </dl>
            </div>
          )}

          {activity.type === ActivityType.EMAIL && (activity.emailFrom || activity.emailTo || activity.emailSubject) && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Details</h2>
              <dl className="grid grid-cols-1 gap-4">
                {activity.emailFrom && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">From</dt>
                    <dd className="text-sm text-gray-900">{activity.emailFrom}</dd>
                  </>
                )}
                {activity.emailTo && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">To</dt>
                    <dd className="text-sm text-gray-900">{activity.emailTo}</dd>
                  </>
                )}
                {activity.emailSubject && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Subject</dt>
                    <dd className="text-sm text-gray-900">{activity.emailSubject}</dd>
                  </>
                )}
              </dl>
            </div>
          )}

          {activity.type === ActivityType.MEETING && (activity.meetingLink || activity.meetingType) && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Meeting Details</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activity.meetingLink && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Meeting Link</dt>
                    <dd className="text-sm text-gray-900">
                      <a href={activity.meetingLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800">
                        {activity.meetingLink}
                      </a>
                    </dd>
                  </>
                )}
                {activity.meetingType && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Meeting Type</dt>
                    <dd className="text-sm text-gray-900">{activity.meetingType}</dd>
                  </>
                )}
              </dl>
            </div>
          )}

          {activity.type === ActivityType.TASK && activity.taskCategory && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Details</h2>
              <dl className="grid grid-cols-1 gap-4">
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="text-sm text-gray-900">{activity.taskCategory}</dd>
              </dl>
            </div>
          )}

          {/* Additional Information */}
          {(activity.outcome || activity.nextSteps) && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              <dl className="grid grid-cols-1 gap-4">
                {activity.outcome && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Outcome</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap">{activity.outcome}</dd>
                  </>
                )}
                {activity.nextSteps && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Next Steps</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap">{activity.nextSteps}</dd>
                  </>
                )}
              </dl>
            </div>
          )}

          {/* System Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="text-sm text-gray-900">{formatLocaleIST(activity.createdAt)}</dd>

              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="text-sm text-gray-900">{activity.createdByName}</dd>

              <dt className="text-sm font-medium text-gray-500">Last Modified At</dt>
              <dd className="text-sm text-gray-900">{formatLocaleIST(activity.lastModifiedAt)}</dd>

              <dt className="text-sm font-medium text-gray-500">Last Modified By</dt>
              <dd className="text-sm text-gray-900">{activity.lastModifiedByName}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
