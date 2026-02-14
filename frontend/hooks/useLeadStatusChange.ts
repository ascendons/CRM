import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lead, LeadStatus } from '@/types/lead';
import { leadsService } from '@/lib/leads';
import { activitiesService } from '@/lib/activities';
import { CreateActivityRequest } from '@/types/activity';
import toast from 'react-hot-toast';

interface UseLeadStatusChangeProps {
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
}

export function useLeadStatusChange({ onStatusChange }: UseLeadStatusChangeProps = {}) {
  const router = useRouter();
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    leadId: string;
    newStatus: LeadStatus;
    originalStatus: LeadStatus;
  } | null>(null);


  const handleStatusChangeRequest = async (leadId: string, newStatus: LeadStatus, currentStatus: LeadStatus) => {
    // If status is changing to CONTACTED, QUALIFIED, UNQUALIFIED, NEGOTIATION, or LOST, open the modal
    if (
      (newStatus === LeadStatus.CONTACTED && currentStatus !== LeadStatus.CONTACTED) ||
      (newStatus === LeadStatus.QUALIFIED && currentStatus !== LeadStatus.QUALIFIED) ||
      (newStatus === LeadStatus.UNQUALIFIED && currentStatus !== LeadStatus.UNQUALIFIED) ||
      (newStatus === LeadStatus.NEGOTIATION && currentStatus !== LeadStatus.NEGOTIATION) ||
      (newStatus === LeadStatus.LOST && currentStatus !== LeadStatus.LOST)
    ) {
      setPendingStatusChange({ leadId, newStatus, originalStatus: currentStatus });
      setIsActivityModalOpen(true);
      return;
    }

    // SPECIAL CASE: CONVERTED -> Auto-convert lead to opportunity
    if (newStatus === LeadStatus.CONVERTED) {
      try {
        await leadsService.convertLead(leadId);
        toast.success("Lead converted to opportunity successfully");
        if (onStatusChange) {
          onStatusChange(leadId, newStatus);
        }
        // Note: Navigation to opportunity should be handled by the component
        // We'll trigger a callback or return data to signal completion
      } catch (error) {
        console.error("Failed to convert lead", error);
        toast.error("Failed to convert lead to opportunity");
      }
      return;
    }

    // SPECIAL CASE: Proposal Sent -> Redirect to Create Proposal
    if (newStatus === LeadStatus.PROPOSAL_SENT) {
      router.push(`/proposals/new?source=LEAD&sourceId=${leadId}`);
      // We do NOT update the status here. It will be updated when proposal is created.
      // We might want to revert the UI optimism if any in the caller, 
      // but since we are navigating away, it might not matter much.
      // However, if the user comes back, the status should be unchanged unless they actually created the proposal.
      return;
    }

    // Otherwise, just update the status
    await updateStatus(leadId, newStatus, currentStatus);
  };

  const updateStatus = async (leadId: string, newStatus: LeadStatus, originalStatus: LeadStatus) => {
    try {
      await leadsService.updateLeadStatus(leadId, newStatus);
      toast.success(`Lead status updated to ${newStatus.replace(/_/g, " ").toLowerCase()}`);
      if (onStatusChange) {
        onStatusChange(leadId, newStatus);
      }
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error("Failed to update status");
      // Revert optmistic updates if handled by parent, 
      // but here we primarily handle the API call. 
      // Parent components might need to handle reversion if they did optimistic updates.
      // For now, we assume parent waits or refreshes.
    }
  };

  const handleActivitySave = async (activityData: CreateActivityRequest) => {
    if (!pendingStatusChange) return;

    try {
      // 1. Create the activity
      await activitiesService.createActivity(activityData);
      toast.success("Activity logged successfully");

      // 2. SPECIAL CASE: LOST -> Create CLOSED_LOST opportunity
      if (pendingStatusChange.newStatus === LeadStatus.LOST) {
        try {
          const lossReason = activityData.description || activityData.subject || 'No reason provided';
          await leadsService.loseLead(pendingStatusChange.leadId, lossReason);
          toast.success("Lost deal recorded in opportunities");
          if (onStatusChange) {
            onStatusChange(pendingStatusChange.leadId, pendingStatusChange.newStatus);
          }
        } catch (error) {
          console.error("Failed to record lost deal", error);
          toast.error("Failed to record lost deal in opportunities");
        }
      } else {
        // 3. Update the status for other cases
        await updateStatus(pendingStatusChange.leadId, pendingStatusChange.newStatus, pendingStatusChange.originalStatus);
      }

    } catch (error) {
      console.error("Failed to save activity or update status", error);
      toast.error("Failed to complete action");
    } finally {
      setIsActivityModalOpen(false);
      setPendingStatusChange(null);
    }
  };

  const handleModalClose = () => {
    setIsActivityModalOpen(false);
    setPendingStatusChange(null);
  };

  const getModalProps = () => {
    if (!pendingStatusChange) return {};

    switch (pendingStatusChange.newStatus) {
      case LeadStatus.QUALIFIED:
        return { modalTitle: "Qualification Details", defaultSubject: "Lead Qualified" };
      case LeadStatus.UNQUALIFIED:
        return { modalTitle: "Disqualification Reason", defaultSubject: "Lead Unqualified" };
      case LeadStatus.CONTACTED:
        return { modalTitle: "Log Contact Activity", defaultSubject: "Initial Contact" };
      case LeadStatus.LOST:
        return { modalTitle: "Reason for Loss", defaultSubject: "Lead Lost" };
      default:
        return { modalTitle: "Log Activity", defaultSubject: "" };
    }
  };

  return {
    handleStatusChangeRequest,
    isActivityModalOpen,
    pendingStatusChange,
    handleActivitySave,
    handleModalClose,
    getModalProps
  };
}
