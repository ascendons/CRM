'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { activitiesService } from '@/lib/activities';
import { leadsService } from '@/lib/leads';
import { contactsService } from '@/lib/contacts';
import { accountsService } from '@/lib/accounts';
import { opportunitiesService } from '@/lib/opportunities';
import { Activity, ActivityType, ActivityStatus, ActivityPriority, UpdateActivityRequest } from '@/types/activity';
import { Lead } from '@/types/lead';
import { Contact } from '@/types/contact';
import { Account } from '@/types/account';
import { Opportunity } from '@/types/opportunity';

export default function EditActivityPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const [formData, setFormData] = useState<UpdateActivityRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [activityData, leadsData, contactsData, accountsData, opportunitiesData] = await Promise.all([
        activitiesService.getActivityById(id),
        leadsService.getAllLeads(),
        contactsService.getAllContacts(),
        accountsService.getAllAccounts(),
        opportunitiesService.getAllOpportunities(),
      ]);

      setActivity(activityData);
      setLeads(leadsData);
      setContacts(contactsData);
      setAccounts(accountsData);
      setOpportunities(opportunitiesData);

      // Initialize form with activity data
      setFormData({
        subject: activityData.subject,
        type: activityData.type,
        status: activityData.status,
        priority: activityData.priority,
        description: activityData.description || '',
        scheduledDate: activityData.scheduledDate ? activityData.scheduledDate.substring(0, 16) : '',
        dueDate: activityData.dueDate ? activityData.dueDate.substring(0, 16) : '',
        durationMinutes: activityData.durationMinutes,
        location: activityData.location || '',
        leadId: activityData.leadId || '',
        contactId: activityData.contactId || '',
        accountId: activityData.accountId || '',
        opportunityId: activityData.opportunityId || '',
        phoneNumber: activityData.phoneNumber || '',
        callDirection: activityData.callDirection || '',
        emailFrom: activityData.emailFrom || '',
        emailTo: activityData.emailTo || '',
        emailSubject: activityData.emailSubject || '',
        meetingLink: activityData.meetingLink || '',
        meetingType: activityData.meetingType || '',
        taskCategory: activityData.taskCategory || '',
        outcome: activityData.outcome || '',
        nextSteps: activityData.nextSteps || '',
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load activity');
      router.push('/activities');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      // Clean up empty fields
      const cleanedData: UpdateActivityRequest = {
        ...formData,
        leadId: formData.leadId || undefined,
        contactId: formData.contactId || undefined,
        accountId: formData.accountId || undefined,
        opportunityId: formData.opportunityId || undefined,
        scheduledDate: formData.scheduledDate || undefined,
        dueDate: formData.dueDate || undefined,
        durationMinutes: formData.durationMinutes || undefined,
        location: formData.location || undefined,
        description: formData.description || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        callDirection: formData.callDirection || undefined,
        emailFrom: formData.emailFrom || undefined,
        emailTo: formData.emailTo || undefined,
        emailSubject: formData.emailSubject || undefined,
        meetingLink: formData.meetingLink || undefined,
        meetingType: formData.meetingType || undefined,
        taskCategory: formData.taskCategory || undefined,
        outcome: formData.outcome || undefined,
        nextSteps: formData.nextSteps || undefined,
      };

      await activitiesService.updateActivity(id, cleanedData);
      router.push(`/activities/${id}`);
    } catch (error: any) {
      console.error('Failed to update activity:', error);
      setErrors({ submit: error.message || 'Failed to update activity' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'durationMinutes' ? (value ? parseInt(value) : undefined) : value
    }));
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
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Activity</h1>
            <Link
              href={`/activities/${id}`}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>

          {errors.submit && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  >
                    {Object.values(ActivityType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  >
                    {Object.values(ActivityStatus).map(status => (
                      <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  >
                    {Object.values(ActivityPriority).map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduling</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                  <input
                    type="datetime-local"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="datetime-local"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                  <input
                    type="number"
                    name="durationMinutes"
                    value={formData.durationMinutes || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Related To */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related To</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lead</label>
                  <select
                    name="leadId"
                    value={formData.leadId}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">None</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.firstName} {lead.lastName} - {lead.company}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact</label>
                  <select
                    name="contactId"
                    value={formData.contactId}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">None</option>
                    {contacts.map(contact => (
                      <option key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Account</label>
                  <select
                    name="accountId"
                    value={formData.accountId}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">None</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.accountName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Opportunity</label>
                  <select
                    name="opportunityId"
                    value={formData.opportunityId}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">None</option>
                    {opportunities.map(opp => (
                      <option key={opp.id} value={opp.id}>
                        {opp.opportunityName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Type-Specific Fields */}
            {formData.type === ActivityType.CALL && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Call Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Direction</label>
                    <select
                      name="callDirection"
                      value={formData.callDirection}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select</option>
                      <option value="INBOUND">Inbound</option>
                      <option value="OUTBOUND">Outbound</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {formData.type === ActivityType.EMAIL && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Details</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From</label>
                    <input
                      type="email"
                      name="emailFrom"
                      value={formData.emailFrom}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">To</label>
                    <input
                      type="email"
                      name="emailTo"
                      value={formData.emailTo}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                      type="text"
                      name="emailSubject"
                      value={formData.emailSubject}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.type === ActivityType.MEETING && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Meeting Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Meeting Link</label>
                    <input
                      type="url"
                      name="meetingLink"
                      value={formData.meetingLink}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Meeting Type</label>
                    <select
                      name="meetingType"
                      value={formData.meetingType}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select</option>
                      <option value="IN_PERSON">In Person</option>
                      <option value="VIRTUAL">Virtual</option>
                      <option value="PHONE">Phone</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {formData.type === ActivityType.TASK && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Details</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <input
                      type="text"
                      name="taskCategory"
                      value={formData.taskCategory}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Outcome</label>
                  <textarea
                    name="outcome"
                    value={formData.outcome}
                    onChange={handleChange}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Next Steps</label>
                  <textarea
                    name="nextSteps"
                    value={formData.nextSteps}
                    onChange={handleChange}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Link
                href={`/activities/${id}`}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-400"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
