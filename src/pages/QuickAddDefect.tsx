import React, { useState, useEffect } from "react";
import { Bug, Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { ImagePicker } from "../components/ui/ImagePicker";
import { useApp } from "../context/AppContext";
import { importDefects } from "../api/importTestCase";
import { getModulesByProjectId } from "../api/module/getModule";
import { getSubmodulesByModuleId } from "../api/submodule/submoduleget";
import { getDefectTypes } from "../api/defectType";
import { getSeverities } from "../api/severity";
import { getAllPriorities } from "../api/priority";
import { projectReleaseCardView } from "../api/releaseView/ProjectReleaseCardView";
import { addDefects } from "../api/defect/addNewDefect";
import { createTestCase, CreateTestCaseRequest } from "../api/testCase/createTestcase";
import { getStartingStatus } from "../api/workflow";
import {
  getAllocatedUsersByModuleId,
  getUsersByAllocation,
} from "../api/module/getModule";
import AlertModal from "../components/ui/AlertModal";
import { getActiveReleasesByProject } from "../api/releaseView/getActiveReleasesByProject";
import { useAuth } from "../context/AuthContext";
import { usePermission } from "../context/PermissionContext";
import { useAccessibleProjects } from "../api/useAccessibleProjects";

import { getAllSubmoduleAllocatedDevBySubmoduleId } from "../api/subModuleDevAlloc";

interface QuickAddDefectProps {
  projectModules: {
    id: string;
    name: string;
    submodules: { id: string; name: string }[];
  }[];
  onDefectAdded?: () => void;
}

const QuickAddDefect: React.FC<QuickAddDefectProps> = ({
  projectModules,
  onDefectAdded,
}) => {
  const { selectedProjectId, projects, addDefect, employees, triggerDefectRefresh } = useApp();
  const { can } = usePermission();
  const { user, isAuthenticated } = useAuth();
  const { projects: accessibleProjects } = useAccessibleProjects();

  const selectedProject = accessibleProjects.find(
    (p) => String(p.id ?? p.projectId) === String(selectedProjectId),
  );
  const isProjectActive =
    !selectedProject || selectedProject.status?.toLowerCase() === "active";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    steps: "",
    moduleId: "",
    subModuleId: "",
    severityId: "",
    priorityId: "",
    typeId: "",
    assigntoId: "",
    assignbyId: "",
    releaseId: "",
    attachment: "",
    statusId: "",
    testCaseRequired: false,
    attachmentFile: null as File | null,
  });

  const isOnlyNumberText = (value: string) => {
    const trimmed = value.trim();
    return trimmed !== "" && /^[-+]?\d+(\.\d+)?$/.test(trimmed);
  };

  const isDescriptionOnlyNumber = isOnlyNumberText(formData.description);

  const [success, setSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [modules, setModules] = useState<{ id: string; name: string }[]>([]);
  const [submodules, setSubmodules] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [defectTypes, setDefectTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const [severities, setSeverities] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [priorities, setPriorities] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [releasesData, setReleasesData] = useState<any[]>([]);
  const [isReleaseLoading, setIsReleaseLoading] = useState(false);
  const [workflowStartStatusId, setWorkflowStartStatusId] = useState<string>("");

  const normalizeIdName = (
    item: any,
    idKeys: string[],
    nameKeys: string[],
  ) => ({
    id: idKeys.map((k) => item?.[k]).find((v) => v !== undefined),
    name: nameKeys.map((k) => item?.[k]).find((v) => v !== undefined),
  });

  const fetchModules = async () => {
    if (!selectedProjectId) {
      setModules([]);
      return;
    }
    try {
      const res = await getModulesByProjectId(Number(selectedProjectId));
      let moduleData = [];
      if (Array.isArray(res)) {
        moduleData = res;
      } else if (res?.data && Array.isArray(res.data)) {
        moduleData = res.data;
      } else if (res?.content && Array.isArray(res.content)) {
        moduleData = res.content;
      } else if (res?.data?.content && Array.isArray(res.data.content)) {
        moduleData = res.data.content;
      }
      setModules(
        moduleData.map((m: any) =>
          normalizeIdName(m, ["moduleId", "id"], ["moduleName", "name"]),
        ) as any,
      );
    } catch (error) {
setModules([]);
    }
  };

  const fetchReleases = async () => {
    if (!selectedProjectId) {
      setReleasesData([]);
      return;
    }
    try {
      const data = await getActiveReleasesByProject(selectedProjectId);
      setReleasesData(Array.isArray(data) ? data : []);
    } catch (error) {
setReleasesData([]);
    }
  };

  const [allocatedUsers, setAllocatedUsers] = useState<
    { userId: number; userName: string }[]
  >([]);
  const [isAllocatedUsersLoading, setIsAllocatedUsersLoading] = useState(false);

  const [alert, setAlert] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const showAlert = (message: string) => setAlert({ open: true, message });
  const closeAlert = () => setAlert({ open: false, message: "" });

  useEffect(() => {
    getSeverities()
      .then((res: any) => {
        const raw = res?.data?.content || res?.data || [];
        const list = Array.isArray(raw) ? raw : [];
        setSeverities(
          list.map((s: any) =>
            normalizeIdName(s, ["severityId", "id"], ["severityName", "name"]),
          ) as any,
        );
      })
      .catch((error: any) => {
setSeverities([]);
      });

    getAllPriorities()
      .then((res: any) => {
        let raw: any[] = [];
        if (res?.data?.data && Array.isArray(res.data.data)) {
          raw = res.data.data;
        } else if (res?.data?.content && Array.isArray(res.data.content)) {
          raw = res.data.content;
        } else if (res?.data && Array.isArray(res.data)) {
          raw = res.data;
        } else if (Array.isArray(res)) {
          raw = res;
        } else if (res?.content && Array.isArray(res.content)) {
          raw = res.content;
        }
        setPriorities(
          raw.map((p: any) =>
            normalizeIdName(p, ["priorityId", "id"], ["priorityName", "name"]),
          ) as any,
        );
      })
      .catch((error: any) => {
setPriorities([]);
      });

    (getDefectTypes as any)(0, 1000)
      .then((res: any) => {
        const raw = res?.data?.content || res?.data || res?.content || [];
        const list = Array.isArray(raw) ? raw : [];
        setDefectTypes(
          list.map((t: any) =>
            normalizeIdName(
              t,
              ["defectTypeId", "id"],
              ["defectTypeName", "name"],
            ),
          ) as any,
        );
      })
      .catch((error: any) => {
setDefectTypes([]);
      });

    getStartingStatus()
      .then((statusId: number) => {
        setWorkflowStartStatusId(String(statusId));
      })
      .catch(() => {
        setWorkflowStartStatusId("");
      });
  }, []);

  useEffect(() => {
    if (isModalOpen && selectedProjectId) {
      fetchModules();
      fetchReleases();
    }
  }, [isModalOpen, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      getActiveReleasesByProject(selectedProjectId)
        .then((data) => {
          setReleasesData(Array.isArray(data) ? data : []);
        })
        .catch(() => setReleasesData([]));

      fetchModules();
    } else {
      setReleasesData([]);
      setModules([]);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    setFormData({
      description: "",
      steps: "",
      moduleId: "",
      subModuleId: "",
      severityId: "",
      priorityId: "",
      typeId: "",
      assigntoId: "",
      assignbyId: "",
      releaseId: "",
      attachment: "",
      statusId: "",
      testCaseRequired: false,
      attachmentFile: null,
    });
    setModules([]);
    setSubmodules([]);
    setAllocatedUsers([]);
  }, [selectedProjectId]);

  useEffect(() => {
    if (formData.moduleId) {
      getSubmodulesByModuleId(Number(formData.moduleId))
        .then((res) => {
          const rawList = Array.isArray(res.data)
            ? res.data
            : res.data?.content || [];
          const mapped = rawList.map((sm: any) => ({
            id: (sm.id ?? sm.subModuleId)?.toString(),
            name: sm.subModuleName || sm.name || "",
          }));
          setSubmodules(mapped);
        })
        .catch(() => setSubmodules([]));

      setFormData((f) => ({ ...f, subModuleId: "", assigntoId: "" }));
      setAllocatedUsers([]);
    } else {
      setSubmodules([]);
    }
  }, [formData.moduleId]);

  useEffect(() => {
    if (!formData.subModuleId) {
      setAllocatedUsers([]);
      return;
    }
    setIsAllocatedUsersLoading(true);
console.log("Fetching allocated developers for subModuleId:", formData.subModuleId);
    getAllSubmoduleAllocatedDevBySubmoduleId(Number(formData.moduleId),Number(formData.subModuleId))
      .then((res: any) => {
        const rawList = Array.isArray(res) ? res : res?.data || [];

        const mappedUsers = rawList
          .map((allocation: any) => ({
            userId: allocation.employee?.empId,
            userName: allocation.employee
              ? `${allocation.employee.firstName || ""} ${allocation.employee.lastName || ""}`.trim()
              : "Unknown Employee",
            empId: allocation.employee?.empId,
          }))
          .filter((u: any) => u.userId);

        setAllocatedUsers(mappedUsers);

        if (mappedUsers.length === 1) {
          setFormData((prev) => ({
            ...prev,
            assigntoId: mappedUsers[0].userId.toString(),
          }));
        } else {
          setFormData((prev) => ({ ...prev, assigntoId: "" }));
        }
      })
      .catch((error: any) => {
        if (error?.response?.status !== 404) {
}
        setAllocatedUsers([]);
      })
      .finally(() => setIsAllocatedUsersLoading(false));
  }, [formData.subModuleId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setReleasesData([]);
      return;
    }
    setIsReleaseLoading(true);
    fetchReleases().finally(() => setIsReleaseLoading(false));
  }, [selectedProjectId]);

  const resetForm = () => {
    setIsModalOpen(false);
    setFormData({
      description: "",
      steps: "",
      moduleId: "",
      subModuleId: "",
      severityId: "",
      priorityId: "",
      typeId: "",
      assigntoId: "",
      assignbyId: "",
      releaseId: "",
      attachment: "",
      statusId: "",
      testCaseRequired: false,
      attachmentFile: null,
    });
    setSubmodules([]);
    setAllocatedUsers([]);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "testCaseRequired") {
      setFormData((prev) => ({ ...prev, [field]: value === "true" }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

if (!isAuthenticated || !user) {
      showAlert("Please log in to add defects.");
      return;
    }
    if (!formData.releaseId) {
  showAlert("Failed to add defect: Release cannot be null");
  return;
}

    if (!formData.description.trim()) {
      showAlert("Please enter a description");
      return;
    }

    if (isDescriptionOnlyNumber) {
      showAlert("Brief Description can't be only numbers");
      return;
    }

    if (!formData.severityId) {
      showAlert("Please select a severity");
      return;
    }
    if (!formData.priorityId) {
      showAlert("Please select a priority");
      return;
    }
    if (!formData.typeId) {
      showAlert("Please select a type");
      return;
    }
    if (!formData.moduleId) {
      showAlert("Please select a module");
      return;
    }
    if (!formData.steps.trim()) {
      showAlert("Please enter steps");
      return;
    }
    if (!formData.assigntoId) {
      showAlert("Please select an assignee");
      return;
    }
setSuccess(true);

    const payload: any = {
      briefDescription: formData.description,  // Changed field name
      steps: formData.steps,
      expectedResult: "",
      actualResult: "",
      projectId: selectedProjectId ? Number(selectedProjectId) : undefined,  // Added
      moduleId: formData.moduleId ? Number(formData.moduleId) : undefined,  // Changed format
      subModuleId: formData.subModuleId ? Number(formData.subModuleId) : undefined,
      defectTypeId: formData.typeId ? Number(formData.typeId) : undefined,
      severityId: formData.severityId ? Number(formData.severityId) : undefined,
      priorityId: formData.priorityId ? Number(formData.priorityId) : undefined,
      releaseIds: formData.releaseId ? [Number(formData.releaseId)] : [],  // Now an array!
      statusTypeId: workflowStartStatusId ? Number(workflowStartStatusId) : undefined,
      assignToId: formData.assigntoId ? Number(formData.assigntoId) : null,  // Changed from assignTo
      testCaseRequired: formData.testCaseRequired,  // Changed field name
      testCaseId: null,  // Added
      enterBy: undefined,  // Added (optional)
    };

    try {
      const response = await addDefects(
  payload,
  formData.attachmentFile
);
      if (
        response.status?.toLowerCase() === "created" ||
        response.statusCode === 200 || response.statusCode === 201 || response.statusCode === 2000
      ) {
        showAlert("Defect added successfully!");
        triggerDefectRefresh();

        if (formData.testCaseRequired) {
          try {
            const testCasePayload = {
              projectId: selectedProjectId ? Number(selectedProjectId) : undefined,
              moduleId: formData.moduleId ? Number(formData.moduleId) : undefined,
              subModuleId: formData.subModuleId
                ? Number(formData.subModuleId)
                : undefined,
              testCaseName: "Test Case",
              defectTypeId: formData.typeId ? Number(formData.typeId) : undefined,
              severityId: formData.severityId
                ? Number(formData.severityId)
                : undefined,
              description: formData.description,
              testSteps: formData.steps,
            };
            await createTestCase(
              testCasePayload.projectId as number,
              testCasePayload.moduleId as number,
              testCasePayload.subModuleId as number,
              testCasePayload as unknown as CreateTestCaseRequest,
            );
          } catch (tcError) {
            console.error("Failed to create test case:", tcError);
            showAlert("Defect created, but failed to create linked test case.");
          }
        }

        setTimeout(() => {
          setSuccess(false);
          setIsModalOpen(false);
          setFormData({
            description: "",
            steps: "",
            moduleId: "",
            subModuleId: "",
            severityId: "",
            priorityId: "",
            typeId: "",
            assigntoId: "",
            assignbyId: "",
            releaseId: "",
            attachment: "",
            statusId: "",
            testCaseRequired: false,
            attachmentFile: null,
          });
        }, 2500);
      } else {
        setSuccess(false);
        showAlert(response.message || "Failed to add defect.");
      }
    } catch (error: any) {
      setSuccess(false);
let errorMessage = "Error adding defect. Please try again.";

      if (error?.response?.status === 403) {
        errorMessage =
          "Access denied (403 Forbidden). Please check your permissions or try logging in again.";
      } else if (error?.response?.status === 401) {
        errorMessage =
          "Authentication failed (401 Unauthorized). Please log in again.";
      } else if (error?.response?.data?.message) {
        errorMessage = `Backend error: ${error.response.data.message}`;
      } else if (error?.response?.data?.error) {
        errorMessage = `Backend error: ${error.response.data.error}`;
      } else if (error?.message) {
        errorMessage = `Network error: ${error.message}`;
      }

      showAlert(errorMessage);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedProjectId) {
      showAlert("Please select a project before importing defects.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await importDefects(formData, selectedProjectId);
      showAlert("Import succeeded but no data returned.");
    } catch (error: any) {
      showAlert("Failed to import defects: " + (error?.message || error));
    }
  };

  return (
    <div>
      {can.defect.create && (
        <div className="relative flex items-center w-44 h-12">
          <span className="absolute left-0 flex items-center justify-center w-12 h-12 rounded-lg bg-rose-500 shadow-md">
            <Bug size={20} style={{ color: "#fff" }} />
          </span>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="pl-14 pr-4 py-1 bg-white rounded-xl shadow border border-gray-200 w-full h-12 flex items-center font-semibold text-gray-900 hover:shadow-lg hover:bg-gray-50 transition-all justify-start"
            disabled={!selectedProjectId || !isProjectActive}
            title={!isProjectActive ? "Defects can only be added to Active projects" : undefined}
            style={{ fontWeight: 500, borderStyle: "solid" }}
          >
            <span className="text-base font-medium text-gray-900 whitespace-nowrap">
              Add Defect
            </span>
          </Button>
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title="Add New Defect"
        size="xl"
      >
        {selectedProjectId && (
          <div className="font-bold text-blue-600 text-base mb-2">
            {projects.find((p) => p.id === selectedProjectId)?.name}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {}
          <Input
            label="Brief Description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            required
            error={
              isDescriptionOnlyNumber
                ? "Brief Description can't be only numbers."
                : undefined
            }
          />
          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Steps
            </label>
            <textarea
              value={formData.steps}
              onChange={(e) => handleInputChange("steps", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              required
            />
          </div>
          {}
          <ImagePicker
            label="Attachment Image (Optional)"
            value={formData.attachmentFile}
            onChange={(file) =>
              setFormData((prev) => ({ ...prev, attachmentFile: file }))
            }
          />
          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Case Required
            </label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleInputChange("testCaseRequired", "true")}
                className={`w-20 h-8 text-xs transition-all duration-200 ${
                  formData.testCaseRequired
                    ? "bg-green-500 hover:bg-green-600 text-white border-2 border-green-600 shadow-md"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700 border-2 border-gray-300"
                }`}
              >
                Yes
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleInputChange("testCaseRequired", "false")}
                className={`w-20 h-8 text-xs transition-all duration-200 ${
                  !formData.testCaseRequired
                    ? "bg-red-500 hover:bg-red-600 text-white border-2 border-red-600 shadow-md"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700 border-2 border-gray-300"
                }`}
              >
                No
              </Button>
            </div>
          </div>
          {}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modules
              </label>
              <select
                value={formData.moduleId}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, moduleId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Submodules
              </label>
              <select
                value={formData.subModuleId}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, subModuleId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!formData.moduleId}
              >
                <option value="">
                  {submodules.length === 0
                    ? "No submodules"
                    : "Select a submodule"}
                </option>
                {submodules.map((submodule) => (
                  <option key={submodule.id} value={submodule.id}>
                    {submodule.name}
                  </option>
                ))}
              </select>
              {}
              {formData.subModuleId &&
                !isAllocatedUsersLoading &&
                allocatedUsers.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Assigned dev{allocatedUsers.length > 1 ? "s" : ""}:{" "}
                    {allocatedUsers.map((u) => u.userName).join(", ")}
                  </p>
                )}
              {formData.subModuleId &&
                !isAllocatedUsersLoading &&
                allocatedUsers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No developers assigned to this submodule
                  </p>
                )}
            </div>
          </div>
          {}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.typeId}
                onChange={(e) => handleInputChange("typeId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select type</option>
                {defectTypes.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={formData.severityId}
                onChange={(e) =>
                  handleInputChange("severityId", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select severity</option>
                {severities.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Found in Release
              </label>
              <select
                value={formData.releaseId}
                onChange={(e) => handleInputChange("releaseId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isReleaseLoading || !selectedProjectId}
              >
                {!selectedProjectId ? (
                  <option value="">Please select a project first</option>
                ) : isReleaseLoading ? (
                  <option value="">Loading releases...</option>
                ) : releasesData.length === 0 ? (
                  <option value="">No active release available</option>
                ) : (
                  <>
                    <option value="">Select release (optional)</option>
                    {releasesData.map((release: any) => (
                      <option key={release.releaseId} value={release.releaseId}>
                        {release.releaseName}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priorityId}
                onChange={(e) =>
                  handleInputChange("priorityId", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select priority</option>
                {priorities.map((p: any) => (
                  <option key={p.id} value={p?.id?.toString()}>
                    {p?.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              {}
              <select
                value={formData.assigntoId}
                onChange={(e) =>
                  handleInputChange("assigntoId", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isAllocatedUsersLoading || !formData.subModuleId}
                required
              >
                <option value="">
                  {isAllocatedUsersLoading
                    ? "Loading users..."
                    : allocatedUsers.length === 0
                      ? "No users available for this submodule"
                      : allocatedUsers.length === 1
                        ? "Auto-selected (only one)"
                        : "Select assignee"}
                </option>
                {allocatedUsers.map((user) => (
                  <option key={user.userId} value={user.userId.toString()}>
                    {user.userName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={success || isDescriptionOnlyNumber}>
              {success ? "Added!" : "Submit"}
            </Button>
          </div>
        </form>
      </Modal>
      <AlertModal
        isOpen={alert.open}
        message={alert.message}
        onClose={closeAlert}
      />
    </div>
  );
};

export default QuickAddDefect;