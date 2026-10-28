import ENDPOINTS from "../utils/endpoints";

import apiClient from "../lib/api";
import {
  SmtpConfig,
  UserEmailPreferences,
  NotificationRule,
  SimpleUser,
} from "../types/emailConfiguration";

import {
  getAllEmailPointSetups,
  getRoleNotificationChannels,
  getUserExtraChannels,
  updateUserExtraPoints,
} from "../services/emailConfigurationApi";


const BASE_URL = import.meta.env.VITE_BASE_URL;

export interface CreateSmtpConfigRequest {
  name: string;
   fromEmail: string;
   host: string;
   port: number;
   status: boolean;
   smtpUserName: string;
   smtpPassword: string;
   fromName: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
}

export interface RoleNotificationUpdateRequest {
  roleId: number;
  pointSetupIds?: number[];
  pointChannels?: Record<number, string>;
}

export interface UserNotificationUpdateRequest {
  userId: number;
  pointSetupIds?: number[];
  pointChannels?: Record<number, string>;
}

export const createSmtpConfig = async (
  data: CreateSmtpConfigRequest,
): Promise<SmtpConfig> => {
  try {
    const response = await apiClient.post(ENDPOINTS.emailConfigCreate, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSmtpConfigs = async (): Promise<SmtpConfig[]> => {
  try {
    const response = await apiClient.get(ENDPOINTS.emailConfig);
    const result = response.data?.data ?? response.data;

    if (Array.isArray(result)) {
      return result;
    } else if (result && typeof result === "object") {
      return [result];
    } else {
      return [];
    }
  } catch (error) {
    throw error;
  }
};

export const updateSmtpConfig = async (
  id: number,
  data: CreateSmtpConfigRequest,
): Promise<SmtpConfig> => {
  const payload: Partial<CreateSmtpConfigRequest> = { ...data };

  if (!payload.password || payload.password.trim() === "") {
    delete payload.password;
  }

  const response = await apiClient.put(ENDPOINTS.emailConfigById(id), payload);
  return response.data;
};

export const deleteSmtpConfig = async (id: number): Promise<void> => {
  try {
    const response = await apiClient.delete(
      ENDPOINTS.emailConfigDelete(Number(id)),
    );
  } catch (error) {
    throw error;
  }
};

// export const updateSmtpConfigStatus = async (
//   id: number,
//   isEnabled: boolean,
// ) => {
//   const response = await apiClient.patch(
//     ENDPOINTS.emailConfigEnable(Number(id)),
//     { isEnabled },
//     {
//       headers: {
//         "Content-Type": "application/json",
//       },
//     },
//   );
//   return response.data;
// };

export const updateSmtpConfigStatus = async (id: number) => {
  const response = await apiClient.put(
    ENDPOINTS.emailConfigToggle(Number(id)),
  );

  return response.data;
};

export const toggleSmtpConfig = async (id: number) => {
  try {
    const response = await apiClient.put(
      ENDPOINTS.emailConfigToggle(Number(id)),
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserEmailPreferences = async (
  userId: string,
): Promise<UserEmailPreferences> => {
  try {
    const response = await apiClient.get(
      `${BASE_URL}users/${userId}/email-preferences`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserEmailPreferences = async (
  userId: number,
  preferences: UserEmailPreferences,
): Promise<void> => {
  try {
    await apiClient.put(
      `${BASE_URL}users/${userId}/email-preferences`,
      preferences,
    );
  } catch (error) {
    throw error;
  }
};

export const getNotificationRules = async (): Promise<NotificationRule[]> => {
  try {
    const response = await apiClient.get(`${BASE_URL}notification-rules`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateNotificationRule = async (
  ruleId: string,
  rule: NotificationRule,
): Promise<NotificationRule> => {
  try {
    const response = await apiClient.put(
      `${BASE_URL}notification-rules/${ruleId}`,
      rule,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export interface NotificationPointSetup {
  id: number;
  eventType: string;
  description: string;
  isEnabled: boolean;
  subject?: string;
  body?: string;
}

export const getAllEmailPointSetups = async (): Promise<
  NotificationPointSetup[]
> => {
  try {
    const response = await apiClient.get(ENDPOINTS.emailPointSetup);

    const templates = Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];

    return templates.map((template: any) => ({
      id: Number(template.templateId),
      eventType: template.emailNotificationType || "",
      description:
        template.description ||
        template.subject ||
        template.emailNotificationType?.replaceAll("_", " ") ||
        "",
      isEnabled: Boolean(template.status),
      subject: template.subject || "",
      body: template.body || "",
    }));
  } catch (error) {
    throw error;
  }
};

export const getAllEmailTemplateVariable = async (templateId: number) => {
  const response = await apiClient.get(
    ENDPOINTS.emailTemplateVariable(templateId),
  );
  return response.data;
};

export const getAssignedPointSetupIdsForRole = async (
  roleId: number,
): Promise<number[]> => {
  try {
    const response = await apiClient.get(ENDPOINTS.roleAssignedPoints(roleId));
    return response.data?.data || response.data || [];
  } catch (error) {
    throw error;
  }
};

export const getRoleNotificationChannels = async (
  roleId: number,
): Promise<Record<number, string>> => {
  try {
    const response = await apiClient.get(ENDPOINTS.roleAssignedPoints(roleId));

    const data = response.data?.data ?? response.data ?? {};

    const result: Record<number, string> = {};
    Object.entries(data).forEach(([key, value]) => {
      result[Number(key)] = String(value).toLowerCase();
    });

    return result;
  } catch (error) {
    throw error;
  }
};

export const updateRoleNotificationRules = async (
  roleId: number,
  pointChannels: Map<number, string>,
): Promise<void> => {
  try {
    const pointSetupIds = Array.from(pointChannels.entries())
      .filter(([_, channel]) => channel !== "none")
      .map(([id]) => id);

    const payload: RoleNotificationUpdateRequest = {
      roleId,
      pointSetupIds,
      pointChannels: Object.fromEntries(pointChannels),
    };

    await apiClient.put(ENDPOINTS.roleNotificationUpdate, payload)
  } catch (error) {
    throw error;
  }
};

export const getUserExtraPoints = async (userId: number): Promise<number[]> => {
  try {
    const response = await apiClient.get(ENDPOINTS.getAlluserPreferences(userId));
    return response.data?.data || [];
  } catch (error) {
    return [];
  }
};

export const getUserExtraChannels = async (
  userId: number,
): Promise<Record<number, string>> => {
  const response = await apiClient.get(
    `/user/${userId}/notification-preferences`,
  );

  const data = response.data?.data ?? response.data ?? {};

  return Object.fromEntries(
    Object.entries(data).map(([id, channel]) => [
      Number(id),
      String(channel).toLowerCase(),
    ]),
  );
};

export const updateUserExtraPoints = async (
  userId: number,
  pointChannels: Map<number, string>,
): Promise<void> => {
  await apiClient.put(
    `/user/notification-preferences/update`,
    {
      userId,
      pointChannels: Object.fromEntries(pointChannels),
    },
  );
};

export const updateEmailPointSetupStatus = async (
  id: number,
  isEnabled: boolean,
) => {
  const response = await apiClient.patch(ENDPOINTS.emailPointSetupEnable(id), {
    isEnabled,
  });
  return response.data;
};

export const getAllEmailTemplates = async () => {
  const response = await apiClient.get(ENDPOINTS.emailTemplate);
  return response.data;
};

export const updateEmailTemplate = async (
  id: number,
  data: { subject: string; body: string },
) => {
  const response = await apiClient.put(ENDPOINTS.emailTemplateById(id), data);
  return response.data;
};

export const resetEmailTemplate = async (id: number) => {
  const response = await apiClient.put(ENDPOINTS.emailTemplateReset(id), {});
  return response.data;
};

export const sendEmail = async (data: EmailRequest) => {
  const response = await apiClient.post(ENDPOINTS.emailSent, data);
  return response.data;
};

export const findByEmailTemplate_TemplateIdAndStatusTrue = async (
  templateId: number,
): Promise<RoleBasedPreference[]> => {
  try {
    const response = await apiClient.get(
      `${BASE_URL}notification-rules?templateId=${templateId}&status=true`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
