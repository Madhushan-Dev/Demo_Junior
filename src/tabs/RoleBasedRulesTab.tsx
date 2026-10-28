import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import {
  Bell,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
  Mail,
  Users,
  Search,
  MessageCircle,
  Smartphone,
  Zap,
  XCircle,
} from "lucide-react";
import { ToastState } from "../types/emailConfiguration";
import {
  getAllEmailPointSetups,
  getRoleNotificationChannels,
  updateRoleNotificationRules,
} from "../services/emailConfigurationApi";
import { getAllRoles, Role } from "../api/role/viewrole";
import { usePermission } from "../context/PermissionContext";

type NotificationChannel = "none" | "whatsapp" | "email" | "both";

interface RoleOption {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const RoleBasedRulesTab: React.FC = () => {
  const [pointSetups, setPointSetups] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [notificationPreferences, setNotificationPreferences] = useState<
    Map<number, NotificationChannel>
  >(new Map());
  const [originalPreferences, setOriginalPreferences] = useState<
    Map<number, NotificationChannel>
  >(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const { can } = usePermission();
  const canAssign = can.roleEmailRecipient?.assign;

  const ALWAYS_ASSIGNED_TEMPLATES: string[] = [
    "EMPLOYEE_CREATED",
    "PASSWORD_RESET",
  ];

  useEffect(() => {
    loadPointSetups();
    loadRoles();
  }, []);

 useEffect(() => {
  if (selectedRole && pointSetups.length > 0) {
    loadAssignedRulesForRole(Number(selectedRole));
  }
}, [selectedRole, pointSetups.length]);

  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const response = await getAllRoles(0, 100);
      const rolesData = response?.content || [];
      const mappedRoles = rolesData.map((role: Role) => ({
        id: String(role.roleId),
        label: role.roleName || role.name,
        icon: "👥",
        description: "Role based notification access",
      }));
      setRoleOptions(mappedRoles);
    } catch (error) {
showToast("Failed to load roles", "error");
    } finally {
      setRolesLoading(false);
    }
  };

  const loadPointSetups = async () => {
    setLoading(true);
    try {
      const pointSetupsData = await getAllEmailPointSetups();

      const filteredData = pointSetupsData.filter((point: any) => {
        return !ALWAYS_ASSIGNED_TEMPLATES.includes(point.eventType);
      });

      setPointSetups(filteredData);
    } catch (error) {
showToast("Failed to load notification points", "error");
      setPointSetups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedRulesForRole = async (roleId: number) => {
    setLoading(true);
    try {
      const channelsMap = await getRoleNotificationChannels(roleId);
      const newPreferences = new Map<number, NotificationChannel>();

      pointSetups.forEach((point) => {
        const channel = channelsMap[point.id];
        if (channel && channel !== "none") {
          newPreferences.set(point.id, channel as NotificationChannel);
        } else {
          newPreferences.set(point.id, "none");
        }
      });

      setNotificationPreferences(newPreferences);
      setOriginalPreferences(new Map(newPreferences));
    } catch (error) {
showToast("Failed to load notification rules", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChannelChange = (
    pointSetupId: number,
    channel: NotificationChannel,
  ) => {
    setNotificationPreferences((prev) => {
      const newMap = new Map(prev);
      newMap.set(pointSetupId, channel);
      return newMap;
    });
  };

  const handleSelectAll = (channel: NotificationChannel) => {
    const newPreferences = new Map(notificationPreferences);
    filteredPointSetups.forEach((point) => {
      newPreferences.set(point.id, channel);
    });
    setNotificationPreferences(newPreferences);
  };

  const handleSave = async () => {
    if (!selectedRole) {
      showToast("Please select a role", "error");
      return;
    }

    setSaving(true);
    try {
      await updateRoleNotificationRules(
        Number(selectedRole),
        notificationPreferences,
      );
      setOriginalPreferences(new Map(notificationPreferences));
      showToast("Rules updated successfully", "success");
    } catch (error) {
showToast("Failed to save rules", "error");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = (): boolean => {
    if (notificationPreferences.size !== originalPreferences.size) return true;
    for (const [id, channel] of notificationPreferences) {
      if (originalPreferences.get(id) !== channel) return true;
    }
    return false;
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const filteredPointSetups = pointSetups.filter((point) => {
    const search = searchTerm.toLowerCase();
    const eventLabel = point.eventType?.replaceAll("_", " ") || "";
    return (
      eventLabel.toLowerCase().includes(search) ||
      (point.description || "").toLowerCase().includes(search)
    );
  });

  const getIconForEvent = (eventType: string): string => {
    const iconMap: Record<string, string> = {
      PROJECT_CREATED: "📁",
      PROJECT_ALLOCATION: "🎯",
      PROJECT_DEALLOCATION: "🚫",
      MODULE_ALLOCATION: "📦",
      SUBMODULE_ALLOCATION: "🔧",
      DEFECT_CREATED: "🐛",
      DEFECT_ASSIGNED: "📋",
      DEFECT_REASSIGNED: "🔄",
      DEFECT_UPDATED: "✏️",
      PASSWORD_CHANGED: "🔒",
      ACCOUNT_LOCKED: "🔐",
      EMPLOYEE_ACTIVATED: "✅",
      EMPLOYEE_DEACTIVATED: "⛔",
    };
    return iconMap[eventType] || "📧";
  };

  const selectedRoleLabel =
    roleOptions.find((r) => r.id === selectedRole)?.label || "";

  const stats = {
    total: filteredPointSetups.length,
    active: Array.from(notificationPreferences.values()).filter(
      (c) => c !== "none",
    ).length,
    email: Array.from(notificationPreferences.values()).filter(
      (c) => c === "email" || c === "both",
    ).length,
    whatsapp: Array.from(notificationPreferences.values()).filter(
      (c) => c === "whatsapp" || c === "both",
    ).length,
    both: Array.from(notificationPreferences.values()).filter(
      (c) => c === "both",
    ).length,
  };

  return (
    <div className="space-y-6">
      {toast.show && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {toast.message}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Role Notification Rules
              </h1>
              <p className="text-gray-500 mt-1">
                Configure notification channels for each role
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl px-4 py-2 shadow-sm">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Zap className="w-4 h-4 text-blue-500" />
              <span>
                {stats.active} of {stats.total} rules active
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notification events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all bg-gray-50"
            />
          </div>
          <div className="sm:w-80">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl h-11">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto bg-gray-50">
                {roleOptions.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center">
                      <span className="mr-2 text-lg">{role.icon}</span>
                      <div>
                        <div className="font-medium text-gray-800">
                          {role.label}
                        </div>
                        <div className="text-xs text-gray-400">
                          {role.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!selectedRole ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Role Selected
            </h3>
            <p className="text-gray-400">
              Please select a role from the dropdown above to configure
              notification rules
            </p>
          </div>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-gray-400 mt-3">Loading notification rules...</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                  {roleOptions.find((r) => r.id === selectedRole)?.icon}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">
                    {selectedRoleLabel}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {
                      roleOptions.find((r) => r.id === selectedRole)
                        ?.description
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll("none")}
                  className="border-gray-200 text-gray-600 hover:bg-gray-100"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> None All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll("whatsapp")}
                  className="border-green-200 text-green-600 hover:bg-green-50"
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll("email")}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Mail className="w-3.5 h-3.5 mr-1" /> Email All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll("both")}
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <Smartphone className="w-3.5 h-3.5 mr-1" /> Both All
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Rules</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {stats.active}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Email Only</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {stats.email - stats.both}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">WhatsApp Only</p>
                  <p className="text-2xl font-bold text-green-500">
                    {stats.whatsapp - stats.both}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Both Channels</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {stats.both}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-700">
                Notification Events
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Select delivery channels for each notification type
              </p>
            </div>

            <div className="divide-y divide-gray-50">
              {filteredPointSetups.map((point) => {
                const pointId = point.id;
                const currentChannel =
                  notificationPreferences.get(pointId) || "none";
                const isPointEnabled = point.isEnabled;
                const eventLabel = point.eventType?.replaceAll("_", " ") || "";

                return (
                  <div
                    key={pointId}
                    className={`p-5 transition-all hover:bg-gray-50/50 ${currentChannel !== "none" ? "bg-blue-50/20" : ""}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3">
                          <div className="text-3xl">
                            {getIconForEvent(point.eventType)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <h4 className="font-medium text-gray-700">
                                {eventLabel}
                              </h4>
                              {!isPointEnabled && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              {point.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-auto">
                        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                          <button
                            onClick={() => handleChannelChange(pointId, "none")}
                            disabled={!isPointEnabled || !canAssign}
                            className={`
                              flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium
                              ${
                                currentChannel === "none"
                                  ? "bg-gray-400 text-white shadow-sm"
                                  : "bg-transparent text-gray-500 hover:bg-gray-200"
                              }
                              ${!isPointEnabled || !canAssign ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                            `}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">None</span>
                          </button>
                          <button
                            onClick={() =>
                              handleChannelChange(pointId, "whatsapp")
                            }
                            disabled={!isPointEnabled || !canAssign}
                            className={`
                              flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium
                              ${
                                currentChannel === "whatsapp"
                                  ? "bg-green-500 text-white shadow-sm"
                                  : "bg-transparent text-gray-500 hover:bg-gray-200"
                              }
                              ${!isPointEnabled || !canAssign ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                            `}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                          <button
                            onClick={() =>
                              handleChannelChange(pointId, "email")
                            }
                            disabled={!isPointEnabled || !canAssign}
                            className={`
                              flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium
                              ${
                                currentChannel === "email"
                                  ? "bg-blue-500 text-white shadow-sm"
                                  : "bg-transparent text-gray-500 hover:bg-gray-200"
                              }
                              ${!isPointEnabled || !canAssign ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                            `}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Email</span>
                          </button>
                          <button
                            onClick={() => handleChannelChange(pointId, "both")}
                            disabled={!isPointEnabled || !canAssign}
                            className={`
                              flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium
                              ${
                                currentChannel === "both"
                                  ? "bg-purple-500 text-white shadow-sm"
                                  : "bg-transparent text-gray-500 hover:bg-gray-200"
                              }
                              ${!isPointEnabled || !canAssign ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                            `}
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Both</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredPointSetups.length === 0 && (
                <div className="p-12 text-center">
                  <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">
                    No notification events match your search
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-sm text-gray-500">
                <span className="font-medium text-gray-600">
                  {stats.active}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-600">{stats.total}</span>{" "}
                rules active
              </div>
              <Button
                onClick={handleSave}
                disabled={
                  !selectedRole || saving || !hasChanges() || !canAssign
                }
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow transition-all px-6"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? "Saving Changes..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
