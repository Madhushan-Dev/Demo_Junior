import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Toast } from "../components/ui/Toast";
import { useApp } from "../context/AppContext";
import { importTestCases } from "../api/importTestCase";
import { getSeverities } from "../api/severity";
import { getDefectTypes } from "../api/defectType";
import { getModulesByProjectId } from "../api/module/getModule";
import { getSubmodulesByModuleId } from "../api/submodule/submoduleget";
import {
  createTestCase,
  CreateTestCaseRequest,
} from "../api/testCase/createTestcase";
import { usePermission } from "../context/PermissionContext";

const QuickAddTestCase: React.FC<{
  selectedProjectId: string;
  selectedModuleId?: string;
  selectedSubModuleId?: string;
  onTestCaseAdded?: () => void;
}> = ({
  selectedProjectId,
  selectedModuleId,
  selectedSubModuleId,
  onTestCaseAdded,
}) => {
  const { projects } = useApp();
  const { can } = usePermission();
  const [modal, setModal] = useState({
    open: false,
    formData: {
      moduleId: "",
      subModuleId: "",
      description: "",
      steps: "",
      type: "",
      severity: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [severities, setSeverities] = useState<
    { id: number; name: string; color: string }[]
  >([]);
  const [defectTypes, setDefectTypes] = useState<
    { id: number; defectTypeName: string }[]
  >([]);
  const [subModules, setSubModules] = useState<any[]>([]);

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => {
      setToast({ isOpen: false, message: "", type: "success" });
    }, 5000);
  };

  const [projectModules, setProjectModules] = useState<any[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setModal((prev) => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
    }));
  };

  const handleImportExcel = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  // Validate file type
  const fileName = file.name.toLowerCase();

  if (
    !fileName.endsWith(".xlsx") &&
    !fileName.endsWith(".xls") &&
    !fileName.endsWith(".csv")
  ) {
    showToast(
      "Only Excel files (.xlsx, .xls) or CSV files are allowed.",
      "error"
    );

    e.target.value = "";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    setIsSubmitting(true);

    await importTestCases(
      formData,
      selectedProjectId
    );

    showToast(
      "Test cases imported successfully!",
      "success"
    );

    // Reset file input
    e.target.value = "";

    // Close modal after successful import
    setModal({
      open: false,
      formData: {
        moduleId: "",
        subModuleId: "",
        description: "",
        steps: "",
        type: "",
        severity: "",
      },
    });

    setSubModules([]);

    // Refresh test cases
    if (onTestCaseAdded) {
      onTestCaseAdded();
    }

    window.dispatchEvent(
      new CustomEvent("testCaseCreated", {
        detail: {
          projectId: selectedProjectId,
        },
      })
    );

  } catch (error: any) {

    console.error(
      "IMPORT TEST CASE ERROR:",
      error
    );

    let errorMessage =
      "Failed to import test cases.";

    if (
      error?.response?.data?.data?.[0]?.message
    ) {
      errorMessage =
        error.response.data.data[0].message;

    } else if (
      error?.response?.data?.message
    ) {
      errorMessage =
        error.response.data.message;

    } else if (
      error?.response?.data?.statusMessage
    ) {
      errorMessage =
        error.response.data.statusMessage;

    } else if (
      error?.response?.data?.error
    ) {
      errorMessage =
        error.response.data.error;

    } else if (error?.message) {
      errorMessage = error.message;
    }

    showToast(errorMessage, "error");

    // Reset input
    e.target.value = "";

  } finally {
    setIsSubmitting(false);
  }
};

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const formData = modal.formData;

    const selectedSeverity = severities.find(
      (sev) => sev.name === formData.severity,
    );
    const selectedDefectType = defectTypes.find(
      (dt) => dt.defectTypeName === formData.type,
    );

    if (!selectedSeverity || !selectedDefectType) {
      showToast("Please fill all required fields before submitting.", "error");
      return;
    }

    const subModuleId = formData.subModuleId
      ? Number(formData.subModuleId)
      : null;
    if (!subModuleId) {
      showToast("Please select a submodule before submitting.", "error");
      return;
    }

    const payload: CreateTestCaseRequest = {
      testCaseName: "Test Case",
      description: formData.description,
      testSteps: formData.steps,
      severityId: selectedSeverity.id,
      defectTypeId: selectedDefectType.id,
      projectId: Number(selectedProjectId),
      moduleId: Number(formData.moduleId),
      subModuleId: Number(formData.subModuleId),
    };
    setIsSubmitting(true);

    try {
      const response = await createTestCase(
        Number(selectedProjectId),
        Number(formData.moduleId),
        Number(formData.subModuleId),
        payload,
      );
      if (
        response?.status === "Created" ||
        response?.status === "Success" ||
        response?.statusCode === 201 ||
        response?.statusCode === 200
      ) {
          showToast(
            response?.statusMessage || "Test case created successfully!",
            "success",
          );

          setModal({
            open: false,
            formData: {
              moduleId: "",
              subModuleId: "",
              description: "",
              steps: "",
              type: "",
              severity: "",
            },
          });

          setSubModules([]);

          if (onTestCaseAdded) {
            onTestCaseAdded();
          }

          window.dispatchEvent(
            new CustomEvent("testCaseCreated", {
              detail: { projectId: selectedProjectId },
            }),
          );
        } else {
            showToast(
              response?.message ||
                response?.statusMessage ||
                "Failed to create test case.",
              "error",
            );
          }
    } catch (error: any) {
      let errorMessage = "Failed to create test case.";

      if (error?.response?.data?.data?.[0]?.message) {
        errorMessage = error.response.data.data[0].message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.statusMessage) {
        errorMessage = error.response.data.statusMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    } finally {
            setIsSubmitting(false);
          }
        };

        const isFormValid = () => {
          return (
            modal.formData.moduleId &&
            modal.formData.subModuleId &&
            modal.formData.description &&
            modal.formData.steps &&
            modal.formData.type &&
            modal.formData.severity
          );
        };

  useEffect(() => {
  getSeverities(0, 100)
    .then((res: any) => {
      console.log("SEVERITY API RESPONSE:", res);

      let severityData: any[] = [];

      if (Array.isArray(res?.data?.content)) {
        severityData = res.data.content;
      } else if (Array.isArray(res?.data?.data)) {
        severityData = res.data.data;
      } else if (Array.isArray(res?.data)) {
        severityData = res.data;
      } else if (Array.isArray(res)) {
        severityData = res;
      }

      console.log("SEVERITY ARRAY:", severityData);

      const mappedSeverities = severityData
        .map((sev: any) => ({
          id: sev.severityId ?? sev.id,
          name:
            sev.severityName ??
            sev.name ??
            "",
          color:
            sev.colorCode ??
            sev.color ??
            "",
        }))
        .filter((sev: any) => sev.id && sev.name);

      console.log(
        "MAPPED SEVERITIES:",
        mappedSeverities,
      );

      setSeverities(mappedSeverities);
    })
    .catch((error: any) => {
      console.error(
        "Failed to fetch severities:",
        error,
      );
      setSeverities([]);
    });
}, []);



useEffect(() => {
  getDefectTypes(0, 100)
    .then((res: any) => {
      console.log("DEFECT TYPE API RESPONSE:", res);

      let defectTypeData: any[] = [];

      if (Array.isArray(res?.data?.content)) {
        defectTypeData = res.data.content;
      } else if (Array.isArray(res?.data?.data)) {
        defectTypeData = res.data.data;
      } else if (Array.isArray(res?.data)) {
        defectTypeData = res.data;
      } else if (Array.isArray(res)) {
        defectTypeData = res;
      }

      console.log("DEFECT TYPE ARRAY:", defectTypeData);

      const mappedDefectTypes = defectTypeData
        .map((dt: any) => ({
          id: dt.defectTypeId ?? dt.id,
          defectTypeName:
            dt.defectTypeName ??
            dt.name ??
            "",
        }))
        .filter(
          (dt: any) => dt.id && dt.defectTypeName,
        );

      console.log(
        "MAPPED DEFECT TYPES:",
        mappedDefectTypes,
      );

      setDefectTypes(mappedDefectTypes);
    })
    .catch((error: any) => {
      console.error(
        "Failed to fetch defect types:",
        error,
      );
      setDefectTypes([]);
    });
}, []);

  

  const fetchModules = async () => {
    if (!selectedProjectId) {
      setProjectModules([]);
      return;
    }
    try {
const res = await getModulesByProjectId(Number(selectedProjectId));
let modules = [];
      if (Array.isArray(res)) {
        modules = res;
      } else if (res?.data && Array.isArray(res.data)) {
        modules = res.data;
      } else if (res?.content && Array.isArray(res.content)) {
        modules = res.content;
      } else if (res?.data?.content && Array.isArray(res.data.content)) {
        modules = res.data.content;
      }

      const mapped = modules.map((mod: any) => ({
  id: String(
    mod.moduleId ??
    mod.id
  ),
  name:
    mod.moduleName ??
    mod.name ??
    "",
  submodules: Array.isArray(mod.submodules)
    ? mod.submodules
        .map((sm: any) => ({
          id: String(
            sm.subModuleId ??
            sm.id
          ),
          name:
            sm.subModuleName ??
            sm.getSubModuleName ??
            sm.submoduleName ??
            sm.name ??
            "",
        }))
        .filter(
          (sm: any) => sm.id && sm.name,
        )
    : [],
}));
setProjectModules(mapped);
    } catch (error) {
setProjectModules([]);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [selectedProjectId]);

useEffect(() => {
  const moduleId = Number(modal.formData.moduleId);

  if (!moduleId || Number.isNaN(moduleId)) {
    setSubModules([]);
    return;
  }

  setSubModules([]);

  getSubmodulesByModuleId(moduleId)
    .then((res) => {
      console.log("SUBMODULE API RESPONSE:", res);

      const data = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data)
          ? res.data
          : [];

      const mapped = data.map((item: any) => ({
        id: Number(item.id ?? item.subModuleId),
        name:
          item.name ??
          item.subModuleName ??
          item.submoduleName ??
          "",
      }));

      console.log("MAPPED SUBMODULES:", mapped);

      setSubModules(mapped);
    })
    .catch((error) => {
      console.error("SUBMODULE API ERROR:", error);
      setSubModules([]);
    });
}, [modal.formData.moduleId]);

  useEffect(() => {
    setModal({
      open: false,
      formData: {
        moduleId: "",
        subModuleId: "",
        description: "",
        steps: "",
        type: "",
        severity: "",
      },
    });
    setSubModules([]);
    setProjectModules([]);
  }, [selectedProjectId]);

  return (
    <>
      {}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

      <div>
        { 
          <div className="relative flex items-center w-44 h-12">
            <span className="absolute left-0 flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500 shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-clipboard-check"
                style={{ color: "#fff" }}
              >
                <rect x="9" y="2" width="6" height="4" rx="1" />
                <path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
                <path d="m9 14 2 2 4-4" stroke="#22c55e" />
              </svg>
            </span>
            <Button
              onClick={() => {
                setModal({
                  open: true,
                  formData: {
                    moduleId:  selectedModuleId ? String(selectedModuleId) : "",
                    subModuleId: "",
                    description: "",
                    steps: "",
                    type: "",
                    severity: "",
                  },
                });
              }}
              className="pl-14 pr-4 py-1 bg-white rounded-xl shadow border border-gray-200 w-full h-12 flex items-center font-semibold text-gray-900 hover:shadow-lg hover:bg-gray-50 transition-all justify-start"
              // disabled={!selectedProjectId}
              style={{ fontWeight: 500, borderStyle: "solid" }}
            >
              <span className="text-base font-medium text-gray-900 whitespace-nowrap">
                Add Test Case
              </span>
            </Button>
          </div>
        }

        {modal.open && (
          <Modal
            isOpen={modal.open}
            onClose={() => {
              setModal({
                ...modal,
                open: false,
                formData: {
                  moduleId: selectedModuleId ? String(selectedModuleId) : "",
                  subModuleId: "",
                  description: "",
                  steps: "",
                  type: "",
                  severity: "",
                },
              });
            }}
            title={
              projects &&
              projects.find((p: { id: string }) => p.id === selectedProjectId)
                ? `Add New Test Case (${
                    projects.find(
                      (p: { id: string }) => p.id === selectedProjectId,
                    )?.name
                  })`
                : "Add New Test Case"
            }
            size="xl"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-4"
            >
              <div className="flex items-center mb-2">
                <button
                  type="button"
                  className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow mr-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                    />
                  </svg>
                  Import from Excel/CSV
                </button>
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleImportExcel}
                  ref={fileInputRef}
                  className="hidden"
                />
              </div>

              <div className="border rounded-lg p-4 mb-2 relative">
                <div className="grid grid-cols-2 gap-4">
                  {}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Module <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={modal.formData.moduleId}
  onChange={(e) => {
    const moduleId = e.target.value;

    console.log("SELECTED MODULE ID:", moduleId);

    handleInputChange("moduleId", moduleId);
    handleInputChange("subModuleId", "");
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={!selectedProjectId}
                    >
                      <option value="">Select Module</option>
                      {projectModules.map(
                        (module: { id: string; name: string }) => (
                          <option key={module.id} value={module.id}>
                            {module.name}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  {}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sub Module <span className="text-red-500">*</span>
                    </label>
                    
                    <select
                    value={modal.formData.subModuleId}
                    onChange={(e) => {
                      handleInputChange("subModuleId", e.target.value);
                      console.log("SELECTED SUBMODULE ID:", e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!modal.formData.moduleId}
                    required
                  >
                    <option value="">Select Sub Module</option>

                    {subModules.map((submodule: any) => (
                      <option
                        key={submodule.id}
                        value={String(submodule.id)}
                      >
                        {submodule.name}
                      </option>
                    ))}
                  </select>
                  </div>

                  {}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={modal.formData.type}
                      onChange={(e) =>
                        handleInputChange("type", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Type</option>
                      {defectTypes.length === 0 ? (
                        <option value="" disabled>
                          No defect types available
                        </option>
                      ) : (
                        defectTypes.map((type) => (
                          <option key={type.id} value={type.defectTypeName}>
                            {type.defectTypeName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={modal.formData.severity}
                      onChange={(e) =>
                        handleInputChange("severity", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Severity</option>
                      {severities.length === 0 ? (
                        <option value="" disabled>
                          No severities available
                        </option>
                      ) : (
                        severities.map((severity) => (
                          <option key={severity.id} value={severity.name}>
                            {severity.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-1">
                    Description must contain letters and at least one number or
                    special character
                  </p>
                  <textarea
                    value={modal.formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    required
                  />
                </div>

                {}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Steps <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-1">
                    Steps must contain letters and at least one number or
                    special character (e.g., "1. Step one", "Step 1!")
                  </p>
                  <textarea
                    value={modal.formData.steps}
                    onChange={(e) => handleInputChange("steps", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    required
                  />
                </div>
              </div>

              {}
              <div className="flex justify-end items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setModal({
                      open: false,
                      formData: {
                        moduleId: "",
                        subModuleId: "",
                        description: "",
                        steps: "",
                        type: "",
                        severity: "",
                      },
                    });
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !isFormValid()}>
                  {isSubmitting ? "Creating..." : "Submit"}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </>
  );
};

export default QuickAddTestCase;
