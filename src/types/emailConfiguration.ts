export interface SmtpConfig {
  id: number;
  name: string;
  host: string;
  port: number;
  smtpUserName: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  status: boolean;
}

export interface UserEmailPreferences {
  defectEmailStatus: boolean;
  projectAllocationEmailStatus: boolean;
  moduleAllocationEmailStatus: boolean;
  submoduleAllocationEmailStatus: boolean;
}

export interface SimpleUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export interface EmailTemplate {
  id: string;
  eventType: string;
  eventLabel: string;
  description: string;
  subject: string;
  body: string;
  variables: string[];
  isCustom: boolean;
  lastModified?: string;
}

export interface NotificationRule {
  id: string;
  eventType: string;
  eventLabel: string;
  description: string;
  enabled: boolean;
  recipientRoles: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}
