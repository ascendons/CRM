import { ProposalResponse } from "./proposal";

export interface ProposalVersionResponse {
    id: string;
    proposalId: string;
    version: number;
    action: string;
    comment: string;
    snapshot: ProposalResponse;
    createdAt: string;
    createdBy: string;
    createdByName: string;
}

export const getActionLabel = (action: string): string => {
    switch (action) {
        case "CREATED":
            return "Created";
        case "UPDATED":
            return "Updated";
        case "SENT":
            return "Sent";
        case "ACCEPTED":
            return "Accepted";
        case "REJECTED":
            return "Rejected";
        default:
            return action;
    }
};

export const getActionColor = (action: string): string => {
    switch (action) {
        case "CREATED":
            return "blue";
        case "UPDATED":
            return "amber";
        case "SENT":
            return "indigo";
        case "ACCEPTED":
            return "green";
        case "REJECTED":
            return "red";
        default:
            return "gray";
    }
};
