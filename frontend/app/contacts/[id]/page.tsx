'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Contact } from '@/types/contact';
import { contactsService } from '@/lib/contacts';
import { authService } from '@/lib/auth';

export default function ContactDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadContact();
  }, [params.id, router]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const data = await contactsService.getContactById(params.id);
      setContact(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      await contactsService.deleteContact(params.id);
      router.push('/contacts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contact...</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Contact not found'}</p>
          <button
            onClick={() => router.push('/contacts')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );

  const DetailRow = ({ label, value }: { label: string; value: string | number | boolean | undefined | null }) => (
    <div className="py-3 border-b border-gray-200 last:border-0">
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">
        {value !== undefined && value !== null && value !== '' ? String(value) : '-'}
      </dd>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {contact.salutation} {contact.firstName} {contact.lastName}
              </h1>
              {contact.isPrimaryContact && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Primary Contact
                </span>
              )}
            </div>
            <p className="text-gray-600">Contact ID: {contact.contactId}</p>
            <p className="text-sm text-gray-500 mt-1">
              Owner: {contact.ownerName}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/contacts/${contact.id}/edit`)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Edit Contact
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => router.push('/contacts')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to List
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <DetailSection title="Basic Information">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Full Name" value={`${contact.salutation || ''} ${contact.firstName} ${contact.lastName}`.trim()} />
              <DetailRow label="Email" value={contact.email} />
              <DetailRow label="Phone" value={contact.phone} />
              <DetailRow label="Mobile Phone" value={contact.mobilePhone} />
              <DetailRow label="Work Phone" value={contact.workPhone} />
              <DetailRow label="Home Phone" value={contact.homePhone} />
              <DetailRow label="Fax" value={contact.fax} />
              <DetailRow label="Email Opt Out" value={contact.emailOptOut ? 'Yes' : 'No'} />
            </dl>
          </DetailSection>

          {/* Professional Information */}
          <DetailSection title="Professional Information">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Job Title" value={contact.jobTitle} />
              <DetailRow label="Department" value={contact.department} />
              <DetailRow label="Reports To" value={contact.reportsTo} />
              <DetailRow label="Birthdate" value={contact.birthdate} />
            </dl>
          </DetailSection>

          {/* Account Relationship */}
          <DetailSection title="Account Relationship">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Account" value={contact.accountName} />
              <DetailRow label="Primary Contact" value={contact.isPrimaryContact ? 'Yes' : 'No'} />
              {contact.convertedFromLeadId && (
                <>
                  <DetailRow label="Converted From Lead" value={contact.convertedFromLeadId} />
                  <DetailRow label="Conversion Date" value={contact.convertedDate} />
                </>
              )}
            </dl>
          </DetailSection>

          {/* Social Media & Web */}
          <DetailSection title="Social Media & Web">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="LinkedIn Profile" value={contact.linkedInProfile} />
              <DetailRow label="Twitter Handle" value={contact.twitterHandle} />
              <DetailRow label="Facebook Profile" value={contact.facebookProfile} />
              <DetailRow label="Website" value={contact.website} />
              <DetailRow label="Skype ID" value={contact.skypeId} />
            </dl>
          </DetailSection>

          {/* Mailing Address */}
          <DetailSection title="Mailing Address">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Street" value={contact.mailingStreet} />
              <DetailRow label="City" value={contact.mailingCity} />
              <DetailRow label="State/Province" value={contact.mailingState} />
              <DetailRow label="Postal Code" value={contact.mailingPostalCode} />
              <DetailRow label="Country" value={contact.mailingCountry} />
            </dl>
          </DetailSection>

          {/* Other Address */}
          <DetailSection title="Other Address">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Street" value={contact.otherStreet} />
              <DetailRow label="City" value={contact.otherCity} />
              <DetailRow label="State/Province" value={contact.otherState} />
              <DetailRow label="Postal Code" value={contact.otherPostalCode} />
              <DetailRow label="Country" value={contact.otherCountry} />
            </dl>
          </DetailSection>

          {/* Activity Metrics */}
          <DetailSection title="Engagement Metrics">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Emails Sent" value={contact.emailsSent} />
              <DetailRow label="Emails Received" value={contact.emailsReceived} />
              <DetailRow label="Calls Made" value={contact.callsMade} />
              <DetailRow label="Calls Received" value={contact.callsReceived} />
              <DetailRow label="Meetings Held" value={contact.meetingsHeld} />
              <DetailRow label="Last Activity" value={contact.lastActivityDate} />
              <DetailRow label="Last Email" value={contact.lastEmailDate} />
              <DetailRow label="Last Call" value={contact.lastCallDate} />
              <DetailRow label="Last Meeting" value={contact.lastMeetingDate} />
            </dl>
          </DetailSection>

          {/* Assistant Information */}
          <DetailSection title="Assistant Information">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Assistant Name" value={contact.assistantName} />
              <DetailRow label="Assistant Phone" value={contact.assistantPhone} />
            </dl>
          </DetailSection>

          {/* Additional Information */}
          <DetailSection title="Additional Information">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Description" value={contact.description} />
              <DetailRow
                label="Tags"
                value={contact.tags && contact.tags.length > 0 ? contact.tags.join(', ') : undefined}
              />
            </dl>
          </DetailSection>

          {/* System Information */}
          <DetailSection title="System Information">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Created By" value={contact.createdByName} />
              <DetailRow label="Created At" value={new Date(contact.createdAt).toLocaleString()} />
              <DetailRow label="Last Modified By" value={contact.lastModifiedByName} />
              <DetailRow label="Last Modified At" value={new Date(contact.lastModifiedAt).toLocaleString()} />
            </dl>
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
