import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import {
  Mail,
  ChevronLeft,
  Users,
  Shield,
  FileText,
  Server,
} from "lucide-react";
import { UserPreferencesTab } from "../tabs/UserPreferencesTab";
import { RoleBasedRulesTab } from "../tabs/RoleBasedRulesTab";
import { EmailTemplatesTab } from "../tabs/EmailTemplatesTab";
import { SmtpServerTab } from "../tabs/SmtpServerTab";
import { usePermission } from "../context/PermissionContext";

type TabKey = "users" | "roles" | "templates" | "server";

const EmailConfiguration: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [activeTab, setActiveTab] = useState<TabKey>("users");

  const tabs = useMemo(
    () => [
      {
        key: "users" as TabKey,
        label: "User Preferences",
        icon: Users,
        allowed: can.employeeEmailRecipient?.view,
        component: <UserPreferencesTab />,
      },
      {
        key: "roles" as TabKey,
        label: "Role Rules",
        icon: Shield,
        allowed: can.roleEmailRecipient?.view,
        component: <RoleBasedRulesTab />,
      },
      {
        key: "templates" as TabKey,
        label: "Email Templates",
        icon: FileText,
        allowed: can.pointSetup?.view,
        component: <EmailTemplatesTab />,
      },
      {
        key: "server" as TabKey,
        label: "SMTP Server",
        icon: Server,
        allowed: can.emailConfig?.view,
        component: <SmtpServerTab />,
      },
    ],
    [can],
  );

  const allowedTabs = tabs.filter((tab) => tab.allowed);

  useEffect(() => {
    const saved = localStorage.getItem("emailConfigTab") as TabKey | null;
    const savedAllowed = allowedTabs.find((tab) => tab.key === saved);

    if (savedAllowed) {
      setActiveTab(savedAllowed.key);
    } else if (allowedTabs.length > 0) {
      setActiveTab(allowedTabs[0].key);
      localStorage.setItem("emailConfigTab", allowedTabs[0].key);
    }
  }, [allowedTabs]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    localStorage.setItem("emailConfigTab", tab);
  };

  const activeContent = allowedTabs.find(
    (tab) => tab.key === activeTab,
  )?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Email Configuration
                </h1>
                <p className="text-xs text-gray-500">
                  Configure email servers, templates and notifications
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate("/configurations")}
              className="flex items-center shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex flex-wrap">
            {allowedTabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center px-5 py-3 text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeContent}
      </div>
    </div>
  );
};

export default EmailConfiguration;
