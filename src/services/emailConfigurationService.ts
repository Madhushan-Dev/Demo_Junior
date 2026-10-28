import ENDPOINTS from "../utils/endpoints";

import apiClient from "../lib/api";

const BASE_URL = import.meta.env.VITE_BASE_URL || "";

export interface SmtpConfigRequest {
  name: string;
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface SmtpConfigResponse {
  id: number;
  name: string;
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserEmailPreferences {
  defectEmailStatus: boolean;
  projectAllocationEmailStatus: boolean;
  moduleAllocationEmailStatus: boolean;
  submoduleAllocationEmailStatus: boolean;
}

export interface SimpleUser {
  id?: number;
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ApiResponse<T> {
  status: string;
  message?: string;
  data?: T;
}

export const createSmtpConfig = async (
  data: SmtpConfigRequest,
): Promise<SmtpConfigResponse> => {
  try {
    const response = await apiClient.post(`${BASE_URL}smtp-config`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSmtpConfigs = async (): Promise<SmtpConfigResponse[]> => {
  try {
    const response = await apiClient.get(ENDPOINTS.emailConfig);
    const result = response.data;

    if (Array.isArray(result)) {
      return result;
    } else if (result && typeof result === "object") {
      return [result];
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const updateSmtpConfig = async (
  id: number,
  data: SmtpConfigRequest,
): Promise<SmtpConfigResponse> => {
  try {
    const response = await apiClient.put(`${BASE_URL}smtp-config/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSmtpConfig = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`${BASE_URL}smtp-config/${id}`);
  } catch (error) {
    throw error;
  }
};

export const getAllUsers = async (): Promise<SimpleUser[]> => {
  try {
    return [
      {
        id: 1,
        userId: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
      },
      {
        id: 2,
        userId: 2,
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
      },
      {
        id: 3,
        userId: 3,
        firstName: "Mike",
        lastName: "Johnson",
        email: "mike.johnson@example.com",
      },
      {
        id: 4,
        userId: 4,
        firstName: "Sarah",
        lastName: "Williams",
        email: "sarah.williams@example.com",
      },
      {
        id: 5,
        userId: 5,
        firstName: "David",
        lastName: "Brown",
        email: "david.brown@example.com",
      },
    ];
  } catch (error) {
    return [];
  }
};

export const getUserEmailPreferences = async (
  userId: string,
): Promise<UserEmailPreferences> => {
  try {
    const mockPreferences: Record<string, UserEmailPreferences> = {
      "1": {
        defectEmailStatus: true,
        projectAllocationEmailStatus: true,
        moduleAllocationEmailStatus: false,
        submoduleAllocationEmailStatus: true,
      },
      "2": {
        defectEmailStatus: false,
        projectAllocationEmailStatus: true,
        moduleAllocationEmailStatus: true,
        submoduleAllocationEmailStatus: false,
      },
      "3": {
        defectEmailStatus: true,
        projectAllocationEmailStatus: false,
        moduleAllocationEmailStatus: true,
        submoduleAllocationEmailStatus: true,
      },
    };

    return (
      mockPreferences[userId] || {
        defectEmailStatus: false,
        projectAllocationEmailStatus: false,
        moduleAllocationEmailStatus: false,
        submoduleAllocationEmailStatus: false,
      }
    );
  } catch (error) {
    return {
      defectEmailStatus: false,
      projectAllocationEmailStatus: false,
      moduleAllocationEmailStatus: false,
      submoduleAllocationEmailStatus: false,
    };
  }
};

export const updateUserEmailPreferences = async (
  userId: string,
  preferences: UserEmailPreferences,
): Promise<ApiResponse<UserEmailPreferences>> => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      status: "success",
      message: "Email preferences updated successfully",
      data: preferences,
    };
  } catch (error) {
    throw error;
  }
};

export interface NotificationRule {
  id: string;
  eventType: string;
  eventLabel: string;
  description: string;
  enabled: boolean;
  recipientRoles: string[];
}

export const getNotificationRules = async (): Promise<NotificationRule[]> => {
  try {
    const savedRules = localStorage.getItem("email_notification_rules");
    if (savedRules) {
      return JSON.parse(savedRules);
    }

    return [
      {
        id: "rule_1",
        eventType: "defect_created",
        eventLabel: "Defect Created",
        description: "When a new defect is created",
        enabled: true,
        recipientRoles: ["project_manager", "team_lead"],
      },
      {
        id: "rule_2",
        eventType: "defect_assigned",
        eventLabel: "Defect Assigned",
        description: "When a defect is assigned to a user",
        enabled: true,
        recipientRoles: ["developer", "tester"],
      },
      {
        id: "rule_3",
        eventType: "project_allocated",
        eventLabel: "Project Allocated",
        description: "When user is allocated to a project",
        enabled: true,
        recipientRoles: ["developer", "tester", "team_lead"],
      },
      {
        id: "rule_4",
        eventType: "module_allocated",
        eventLabel: "Module Allocated",
        description: "When user is allocated to a module",
        enabled: true,
        recipientRoles: ["developer", "tester"],
      },
    ];
  } catch (error) {
    return [];
  }
};

export const updateNotificationRule = async (
  rule: NotificationRule,
): Promise<NotificationRule> => {
  try {
    const rules = await getNotificationRules();
    const index = rules.findIndex((r) => r.id === rule.id);
    if (index !== -1) {
      rules[index] = rule;
      localStorage.setItem("email_notification_rules", JSON.stringify(rules));
    }
    return rule;
  } catch (error) {
    throw error;
  }
};

export const updateAllNotificationRules = async (
  rules: NotificationRule[],
): Promise<NotificationRule[]> => {
  try {
    localStorage.setItem("email_notification_rules", JSON.stringify(rules));
    return rules;
  } catch (error) {
    throw error;
  }
};

export const getAvailableRoles = async (): Promise<
  { id: string; name: string; description: string }[]
> => {
  return [
    { id: "admin", name: "Admin", description: "Full system access" },
    {
      id: "project_manager",
      name: "Project Manager",
      description: "Manage projects",
    },
    {
      id: "team_lead",
      name: "Team Lead",
      description: "Lead development team",
    },
    { id: "developer", name: "Developer", description: "Development" },
    { id: "tester", name: "Tester", description: "Quality assurance" },
  ];
};
