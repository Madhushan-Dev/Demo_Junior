import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";

import {
  FileText,
  Edit,
  Eye,
  EyeOff,
  RefreshCw,
  MessageSquare,
  GripVertical,
  Code,
  Copy,
  Save,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EmailTemplate, ToastState } from "../types/emailConfiguration";
import {
  getAllEmailTemplates,
  updateEmailTemplate,
  resetEmailTemplate,
  getAllEmailPointSetups,
  updateEmailPointSetupStatus,
} from "../services/emailConfigurationApi";
import { usePermission } from "../context/PermissionContext";

const EVENT_VARIABLES: Record<string, string[]> = {
  DEFECT_REASSIGNED: [
    "recipientName",
    "recipientEmail",
    "projectName",
    "companyName",
    "defectId",
    "title",
    "description",
    "severity",
    "priority",
    "assignedBy",
    "dueDate",
    "defectUrl",
  ],
  DEFECT_UPDATED: [
    "projectId",
    "projectName",
    "defectId",
    "oldStatus",
    "newStatus",
  ],
  PROJECT_CREATED: ["projectName", "managerName"],
  PROJECT_ALLOCATION: [
    "projectName",
    "startDate",
    "endDate",
    "employeeName",
    "roleName",
  ],
  PROJECT_DEALLOCATION: ["projectName", "employeeName", "roleName"],
  MODULE_ALLOCATION: ["moduleName", "employeeName"],
  SUBMODULE_ALLOCATION: [
  "employeeName",
  "subModuleName",
],
//   SUBMODULE_ALLOCATION: [
//   "employeeName",
//   "subModuleName",
// ],
  EMPLOYEE_CREATED: ["employeeName", "email", "password"],
  EMPLOYEE_ACTIVATED: ["employeeName"],
  EMPLOYEE_DEACTIVATED: ["employeeName"],
  PASSWORD_RESET: ["employeeName", "resetLink"],
  PASSWORD_CHANGED: ["employeeName"],
  ACCOUNT_LOCKED: ["employeeName"],
  LOGIN_SUCCESS: ["employeeName", "loginTime"],
  LOGIN_SUCCESSFUL: ["employeeName", "loginTime"],
};

const ALWAYS_ENABLED_TEMPLATES: string[] = [
  "EMPLOYEE_CREATED",
  "PASSWORD_RESET",
];

const canBeDisabled = (eventType: string): boolean => {
  return !ALWAYS_ENABLED_TEMPLATES.includes(eventType);
};

const DEFAULT_VARIABLES = ["recipientName", "recipientEmail", "companyName"];

const renderBody = (body: string) => {
  const isHtml = /<[a-z][\s\S]*>/i.test(body);
  if (isHtml) {
    return <div dangerouslySetInnerHTML={{ __html: body }} />;
  }
  return (
    <pre style={{ fontFamily: "inherit", whiteSpace: "pre-wrap", margin: 0 }}>
      {body}
    </pre>
  );
};

interface MergedTemplate {
  id: number;
  pointSetupId: number;
  eventType: string;
  eventLabel: string;
  subject: string;
  body: string;
  variables: string[];
  isEnabled: boolean;
  updatedAt: string;
}

const SortableTemplateItem: React.FC<{
  template: MergedTemplate;
  saving: boolean;
  onToggle: (id: number, pointSetupId: number, enabled: boolean) => void;
  onEdit: (template: MergedTemplate) => void;
  onPreview: (template: MergedTemplate) => void;
  onReset: (template: MergedTemplate) => void;
}> = ({ template, saving, onToggle, onEdit, onPreview, onReset }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const { can } = usePermission();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-5 hover:bg-gray-50 transition-colors border-b border-gray-200 ${isDragging ? "shadow-lg" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mr-3 mt-1"
          >
            <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </div>

          <div className="flex-1">
            <div className="flex items-center mb-2">
              <MessageSquare className="w-4 h-4 text-blue-500 mr-2" />
              <h3 className="font-semibold text-gray-900">
                {template.eventLabel}
              </h3>
            </div>
            <p className="text-xs text-gray-400 truncate">
              Subject: {template.subject}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {can.emailTemplate.view && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview(template)}
            >
              <Eye className="w-4 h-4 mr-1" /> Preview
            </Button>
          )}
          {can.emailTemplate.edit && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(template)}
              >
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReset(template)}
                className="text-orange-600"
              >
                <RefreshCw className="w-4 h-4 mr-1" /> Reset
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 ml-7 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          {canBeDisabled(template.eventType) ? (
            <>
              <button
                onClick={() =>
                  onToggle(
                    template.id,
                    template.pointSetupId,
                    !template.isEnabled,
                  )
                }
                disabled={saving || !can.pointSetup?.statusUpdate}
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  template.isEnabled ? "bg-green-600" : "bg-gray-300"
                } ${saving ? "opacity-50 cursor-wait" : ""}`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition ${
                    template.isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${template.isEnabled ? "text-green-700" : "text-gray-500"}`}
              >
                {template.isEnabled ? "Enabled" : "Disabled"}
              </span>
              {saving && (
                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              )}
            </>
          ) : (
            <>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Enabled
              </div>
              <span className="text-sm text-gray-500">(Always enabled)</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const EmailTemplatesTab: React.FC = () => {
  const [templates, setTemplates] = useState<MergedTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingStates, setSavingStates] = useState<Record<number, boolean>>({});

  const [editTarget, setEditTarget] = useState<MergedTemplate | null>(null);
  const [editForm, setEditForm] = useState({ subject: "", body: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

  const [previewTemplate, setPreviewTemplate] = useState<MergedTemplate | null>(
    null,
  );
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
  console.log("🔥 loadAll STARTED");

  setLoading(true);

  try {
    const tplRes = await getAllEmailTemplates();

    console.log("🔥 TEMPLATE API RESPONSE:", tplRes);

    const apiTemplates: any[] = Array.isArray(tplRes)
  ? tplRes
  : tplRes?.data || [];

    console.log("🔥 API TEMPLATES:", apiTemplates);

    const merged: MergedTemplate[] = apiTemplates.map((t: any) => ({
      id: t.templateId,
      eventType: t.emailNotificationType,
      eventLabel: t.emailNotificationType
        ? t.emailNotificationType.replaceAll("_", " ")
        : "",
      subject: t.subject || "",
      body: t.body || "",
      variables:
        EVENT_VARIABLES[t.emailNotificationType] ||
        DEFAULT_VARIABLES,
      isEnabled: t.status ?? true,
      updatedAt: t.updatedAt,
    }));

    console.log("🔥 MAPPED TEMPLATES:", merged);

    setTemplates(merged);

  } catch (err) {
    console.error("❌ Failed to load email templates:", err);
    showToast("Failed to load email templates", "error");
  } finally {
    setLoading(false);
  }
};

 const handleToggle = async (templateId: number) => {
  try {
    const template = templates.find(
      (t) => t.id === templateId
    );

    if (!template) {
      return;
    }

    const newStatus = !template.isEnabled;

    const res = await updateEmailTemplate(templateId, {
      status: newStatus,
    });

    const updated = res?.data || res;

    setTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId
          ? {
              ...t,
              isEnabled: updated?.status ?? newStatus,
            }
          : t
      )
    );

    showToast(
      newStatus
        ? "Email template enabled"
        : "Email template disabled",
      "success"
    );

  } catch (error: any) {
    console.error(
      "Failed to update email template status:",
      error
    );

    showToast(
      "Failed to update email template status",
      "error"
    );
  }
};

  const handleEdit = (template: MergedTemplate) => {
    setEditTarget(template);
    setEditForm({ subject: template.subject, body: template.body });
    setShowHtmlPreview(false);
  };

  const handleSaveTemplate = async () => {
    if (!editTarget) return;
    setSavingEdit(true);
    try {
      const res = await updateEmailTemplate(editTarget.id, {
        subject: editForm.subject,
        body: editForm.body,
      });
      const updated = res?.data || res;
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editTarget.id
            ? {
                ...t,
                subject: updated.subject || editForm.subject,
                body: updated.body || editForm.body,
              }
            : t,
        ),
      );
      setEditTarget(null);
      showToast("Template saved successfully", "success");
    } catch {
      showToast("Failed to save template", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleReset = async (template: MergedTemplate) => {
    try {
      const res = await resetEmailTemplate(template.id);
      const updated = res?.data || res;
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === template.id
            ? {
                ...t,
                subject: updated.subject || t.subject,
                body: updated.body || t.body,
              }
            : t,
        ),
      );
      showToast("Template reset to default", "success");
    } catch {
      showToast("Failed to reset template", "error");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = templates.findIndex((t) => t.id === active.id);
    const newIndex = templates.findIndex((t) => t.id === over.id);
    setTemplates(arrayMove(templates, oldIndex, newIndex));
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    setCopiedVariable(variable);
    setTimeout(() => setCopiedVariable(null), 2000);
    showToast(`Copied {{${variable}}}`, "success");
  };

  const handleVariableDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    variable: string,
  ) => {
    e.dataTransfer.setData("text/plain", `{{${variable}}}`);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDropVariable = (
    e: React.DragEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: "subject" | "body",
  ) => {
    e.preventDefault();
    const variable = e.dataTransfer.getData("text/plain");
    if (!variable) return;
    const input = e.currentTarget;
    const start = input.selectionStart ?? editForm[field].length;
    const end = input.selectionEnd ?? editForm[field].length;
    const newValue =
      editForm[field].substring(0, start) +
      variable +
      editForm[field].substring(end);
    setEditForm((prev) => ({ ...prev, [field]: newValue }));
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
      {}
      {toast.show && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center p-4 border rounded-lg shadow-lg ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-500" />
            Email Templates
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Drag and drop to reorder. Enable/disable notifications for each
            template.
            {templates.length > 0 && (
              <span className="ml-2 text-blue-500">
                ({templates.length} templates loaded)
              </span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
            <span className="text-sm text-gray-500">Loading templates...</span>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={templates.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-200">
                {templates.map((template) => (
                  <SortableTemplateItem
                    key={template.id}
                    template={template}
                    saving={!!savingStates[template.id]}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onPreview={setPreviewTemplate}
                    onReset={handleReset}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit Template: ${editTarget?.eventLabel}`}
        size="xl"
      >
        {editTarget && (
          <div className="space-y-6">
            {}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                <Code className="w-4 h-4 mr-2" />
                Available Variables
              </h4>
              <div className="flex flex-wrap gap-2">
                {editTarget.variables.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    draggable
                    onDragStart={(e) => handleVariableDragStart(e, variable)}
                    onClick={() => copyVariable(variable)}
                    className={`relative px-3 py-1.5 bg-white rounded-lg text-sm font-mono text-blue-700 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                      copiedVariable === variable
                        ? "ring-2 ring-green-500 bg-green-50"
                        : ""
                    }`}
                  >
                    {`{{${variable}}}`}
                    {copiedVariable === variable && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Copied!
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-3 flex items-center">
                <Copy className="w-3 h-3 mr-1" />
                Click to copy. Drag and drop into subject or body.
              </p>
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Subject
              </label>
              <Input
                value={editForm.subject}
                onChange={(e) =>
                  setEditForm({ ...editForm, subject: e.target.value })
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropVariable(e, "subject")}
                placeholder="Email subject"
                className="font-medium"
              />
            </div>

            {}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Body HTML
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                >
                  {showHtmlPreview ? (
                    <EyeOff className="w-4 h-4 mr-1" />
                  ) : (
                    <Eye className="w-4 h-4 mr-1" />
                  )}
                  {showHtmlPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <textarea
                  value={editForm.body}
                  onChange={(e) =>
                    setEditForm({ ...editForm, body: e.target.value })
                  }
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropVariable(e, "body")}
                  rows={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="HTML email body..."
                />
                {showHtmlPreview && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-3 py-2 border-b text-sm font-medium text-gray-700">
                      Live Preview
                    </div>
                    <div className="p-4 bg-white max-h-[500px] overflow-auto">
                      {renderBody(editForm.body)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setEditTarget(null)}
                disabled={savingEdit}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={savingEdit}
                className="flex items-center"
              >
                {savingEdit ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Template
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {}
      <Modal
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={`Preview: ${previewTemplate?.eventLabel}`}
        size="xl"
      >
        {previewTemplate && (
          <div className="space-y-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Subject:</p>
              <p className="text-sm text-gray-900">{previewTemplate.subject}</p>
            </div>
            <div className="border rounded-lg bg-white overflow-auto max-h-[600px]">
              {renderBody(previewTemplate.body)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};