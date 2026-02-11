export enum AssignmentStrategy {
  ROUND_ROBIN = "ROUND_ROBIN",
  LEAST_LOADED = "LEAST_LOADED",
}

export interface AssignLeadRequest {
  userId: string;
}

export interface EligibleRoleInfo {
  roleId: string;
  roleName: string;
}

export interface LeadAssignmentConfig {
  id: string;
  tenantId: string;
  eligibleRoles: EligibleRoleInfo[];
  strategy: AssignmentStrategy;
  enabled: boolean;
  lastAssignedIndex?: number;
  createdAt: string;
  lastModifiedAt: string;
}

export interface UpdateLeadAssignmentConfigRequest {
  eligibleRoleIds: string[];
  strategy: AssignmentStrategy;
  enabled: boolean;
}

// Helper functions
export const getStrategyDisplayName = (strategy: AssignmentStrategy): string => {
  switch (strategy) {
    case AssignmentStrategy.ROUND_ROBIN:
      return "Round Robin";
    case AssignmentStrategy.LEAST_LOADED:
      return "Least Loaded";
    default:
      return "Unknown";
  }
};

export const getStrategyDescription = (strategy: AssignmentStrategy): string => {
  switch (strategy) {
    case AssignmentStrategy.ROUND_ROBIN:
      return "Distributes leads evenly in rotation among eligible users";
    case AssignmentStrategy.LEAST_LOADED:
      return "Assigns leads to the user with the fewest current leads";
    default:
      return "";
  }
};
