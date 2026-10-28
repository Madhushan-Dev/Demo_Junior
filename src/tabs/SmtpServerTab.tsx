import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import {
  Server,
  Plus,
  Edit,
  Trash2,
  Mail,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { SmtpConfig, ToastState } from "../types/emailConfiguration";
import {
  getSmtpConfigs,
  createSmtpConfig,
  updateSmtpConfig,
  deleteSmtpConfig,
  CreateSmtpConfigRequest,
  toggleSmtpConfig,
} from "../services/emailConfigurationApi";
import { usePermission } from "../context/PermissionContext";

export const SmtpServerTab: React.FC = () => {
  const [configs, setConfigs] = useState<SmtpConfig[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SmtpConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SmtpConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
//   const [formData, setFormData] = useState<CreateSmtpConfigRequest>({
//     name: "",
//     smtpHost: "",
//     smtpPort: 587,
//     username: "",
//     password: "",
//     fromEmail: "",
//     fromName: "",
//     isEnabled: false,
//   });

const [formData, setFormData] = useState<CreateSmtpConfigRequest>({
  name: "",
  host: "smtp.gmail.com",
  port: 587,
  smtpUserName: "",
  smtpPassword: "",
  fromEmail: "",
  fromName: "",
  status: false,
});
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  const [savingStates, setSavingStates] = useState<Record<number, boolean>>({});

  const { can } = usePermission();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await getSmtpConfigs();

const mappedData = data.map((item: any) => ({
  ...item,
  status: Boolean(item.status),
}))
 .sort((a, b) => Number(b.status) - Number(a.status));

setConfigs(mappedData);

    } catch (error) {
        console.error("Failed to load SMTP configurations:", error);
setConfigs([]);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    if (!formData.name.trim()) {
      showToast("Name is required", "error");
      return;
    }

    if (!formData.smtpPassword.trim()) {
        showToast("SMTP password is required", "error");
        return;
      }

  if (!formData.fromName.trim()) {
    showToast("From Name is required", "error");
    return;
  }

    setLoading(true);
    try {
      if (editingConfig) {
        await updateSmtpConfig(editingConfig.id, formData);
        showToast("Configuration updated successfully", "success");
      } else {
        await createSmtpConfig({
              name: formData.name,
              fromEmail: formData.fromEmail,
              host: formData.host,
              port: Number(formData.port),
              status: false,
              smtpUserName: formData.smtpUserName,
              smtpPassword: formData.smtpPassword,
              fromName: formData.fromName,
            });
        showToast("Configuration created successfully", "success");
      }
      await loadConfigs();
      resetForm();
      setModalOpen(false);
    } catch (error) {
          setModalOpen(false);
  const message =
      error?.response?.data?.data?.[0]?.message ||
            error?.response?.data?.message ||
      "Failed to save configuration";

    showToast( "username or password is not valid");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setLoading(true);

    try {
      const response = await deleteSmtpConfig(deleteTarget.id);

      await loadConfigs();
      setDeleteTarget(null);

      showToast(
        response?.message || "Configuration deleted successfully",
        "success",
      );
    } catch (error: any) {
const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to delete configuration";
      setDeleteTarget(null);
      showToast(backendMessage, "error");
    } finally {
      setLoading(false);
    }
  };
//   const handleToggleStatus = async (config: SmtpConfig) => {
//     const newStatus = !Boolean(config.status);
//
//     setSavingStates((prev) => ({ ...prev, [config.id]: true }));
//
//     try {
//       await updateSmtpConfigStatus(config.id, newStatus);
//       await loadConfigs();
//
//       showToast(
//         `SMTP configuration ${newStatus ? "enabled" : "disabled"} successfully`,
//         "success",
//       );
//     } catch (error) {
//       showToast("Failed to update SMTP status", "error");
//     } finally {
//       setSavingStates((prev) => ({ ...prev, [config.id]: false }));
//     }
//   };

const handleToggleStatus = async (config: SmtpConfig) => {
  setSavingStates((prev) => ({
    ...prev,
    [config.id]: true,
  }));

  try {
    const response = await toggleSmtpConfig(config.id);

    await loadConfigs();

    showToast(
      response?.message ||
        `SMTP configuration ${
          !Boolean(config.status) ? "enabled" : "disabled"
        } successfully`,
      "success",
    );
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Failed to update SMTP status";

    showToast(backendMessage, "error");
  } finally {
    setSavingStates((prev) => ({
      ...prev,
      [config.id]: false,
    }));
  }
};

  const handleEdit = (config: SmtpConfig) => {
    setEditingConfig(config);
   setFormData({
  name: config.name,
  host: config.host,
  port: config.port,
  smtpUserName: config.smtpUserName,
  smtpPassword: "",
  fromEmail: config.fromEmail,
  fromName: config.fromName || "",
  status: Boolean(config.status),
});

setFormData({
  name: config.name,
  host: config.host,
  port: config.port,
  smtpUserName: config.smtpUserName,
  smtpPassword: "",
  fromEmail: config.fromEmail,
  fromName: config.fromName || "",
  status: Boolean(config.status),
});
    setModalOpen(true);
  };

//   const resetForm = () => {
//     setEditingConfig(null);
//     setFormData({
//       name: "",
//       smtpHost: "",
//       smtpPort: 587,
//       username: "",
//       password: "",
//       fromEmail: "",
//       fromName: "",
//       isEnabled: false,
//     });
//   };

const resetForm = () => {
  setEditingConfig(null);

  setFormData({
    name: "",
    host: "smtp.gmail.com",
    port: 587,
    smtpUserName: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "",
    status: false,
  });
};

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  return (
    <div className="space-y-6">
      {toast.show && (
        <div
          className={`fixed top-20 right-4 z-[9999] flex items-center p-4 rounded-lg shadow-lg ${
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

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Server className="w-5 h-5 mr-2 text-blue-500" />
            SMTP Configurations
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage email server configurations
          </p>
        </div>
        {can.emailConfig.create && (
          <Button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}

            className="flex items-center shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Configuration
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {configs.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No SMTP configurations found</p>
            {can.emailConfig.create && (
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setModalOpen(true);
                }}
                className="mt-4"
              >
                Create your first configuration
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              {}
              <div className="grid grid-cols-[1.4fr_1.7fr_1.5fr_0.6fr_1fr_0.7fr] items-center px-7 py-4 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
                <div>Name</div>
                <div>From Email</div>
                <div>SMTP Email</div>
                <div>Port</div>
                <div>Status</div>
                <div className="text-center">Actions</div>
              </div>

              <div className="divide-y divide-gray-200">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className="grid grid-cols-[1.4fr_1.7fr_1.5fr_0.6fr_1fr_0.7fr] items-center px-5 py-6 hover:bg-gray-50 transition-colors"
                  >
                    {}
                    <div className="flex items-center min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full mr-4 flex-shrink-0 ${
                          config.status ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <h3 className="font-semibold text-gray-900 truncate text-base">
                        {config.name}
                      </h3>
                    </div>

                    {}
                    <div className="flex items-center min-w-0 text-sm text-gray-500">
                      <Mail className="w-5 h-5 mr-3 flex-shrink-0 text-gray-500" />
                      <span className="truncate">{config.fromEmail}</span>
                    </div>

                    {}
                    <div className="text-sm text-gray-900 truncate">
                      {config.host}
                    </div>

                    {}
                    <div className="font-semibold text-gray-700 text-base">
                      {config.port}
                    </div>

                    {}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleStatus(config)}
                        disabled={
                          savingStates[config.id] ||
                          !can.emailConfig.statusUpdate
                        }
                        className={`relative inline-flex h-6 w-12 rounded-full border-2 border-transparent transition-colors ${
                          Boolean(config.status)
                            ? "bg-green-600"
                            : "bg-gray-300"
                        } ${savingStates[config.id] ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                            Boolean(config.status)
                              ? "translate-x-6"
                              : "translate-x-0"
                          }`}
                        />
                      </button>

                      <span
                        className={`text-sm font-semibold ${
                          config.status ? "text-green-700" : "text-gray-500"
                        }`}
                      >
                        {Boolean(config.status) ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    {}
                    <div className="flex items-center justify-center gap-5">
                      {can.emailConfig.edit && (
                        <button
                          onClick={() => handleEdit(config)}
                          className="text-gray-800 hover:text-blue-600"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      )}

                      {can.emailConfig.delete && (
  <button
    onClick={() => setDeleteTarget(config)}
    disabled={Boolean(config.status)}
    className={`${
      config.status
        ? "text-gray-400 cursor-not-allowed"
        : "text-red-600 hover:text-red-700"
    }`}
    title={
      config.status
        ? "Disable the configuration before deleting"
        : "Delete configuration"
    }
  >
    <Trash2 className="w-5 h-5" />
  </button>
)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingConfig ? "Edit Configuration" : "Add Configuration"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            type="text"
            value={formData.name}
            onChange={(e) => {
               const value = e.target.value.replace(/[^A-Za-z\s]/g, "");

              setFormData({ ...formData, name: value });
            }}
            placeholder="Production SMTP"
            required
          />
         <Input
  label="SMTP Host"
  value={formData.host}
  readOnly
/>
          <Input
            label="SMTP Port"
            type="number"
            value={String(formData.port)}
            onChange={(e) =>
              setFormData({ ...formData, port: Number(e.target.value) })
            }
            placeholder="587"
            required
          />
          <Input
            label="Username"
            type="email"
            value={formData.smtpUserName}
            onChange={(e) =>
              setFormData({ ...formData, smtpUserName: e.target.value })
            }
            placeholder="your-email@gmail.com"
            required
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.smtpPassword}
              onChange={(e) =>
                setFormData({ ...formData, smtpPassword: e.target.value })
              }
              placeholder="Enter SMTP password"
                required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400"
            >
              {showPassword ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
          <Input
            label="From Email"
            type="email"
            value={formData.fromEmail}
            onChange={(e) =>
              setFormData({ ...formData, fromEmail: e.target.value })
            }
            placeholder="noreply@example.com"
            required
          />
          <Input
            label="From Name"
            value={formData.fromName}
            onChange={(e) =>
              setFormData({ ...formData, fromName: e.target.value })
            }
            placeholder="Your Company"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editingConfig ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Configuration"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete{" "}
          <span className="font-medium">{deleteTarget?.name}</span>? This action
          cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
