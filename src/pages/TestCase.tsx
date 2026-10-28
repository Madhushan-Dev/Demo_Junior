import ENDPOINTS from "../utils/endpoints";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { OrbitProgress } from "react-loading-indicators";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import AlertModal from "../components/ui/AlertModal";
import { useParams, useNavigate } from "react-router-dom";

import * as XLSX from "xlsx";
import { TestCase as TestCaseType } from "../types/index";
import { ProjectSelector } from "../components/ui/ProjectSelector";
import ModuleSelector from "../components/ui/ModuleSelector";
import { Project } from "../types";

import {
  getTestCasesByProject,
  getTestCasesByProjectAndModule,
  getTestCasesByProjectAndSubmodule,
  deleteTestCase,
} from "../api/testCase/testCaseApi";

import { getSeverities } from "../api/severity";
import { getDefectTypes } from "../api/defectType";
import { updateTestCase } from "../api/testCase/updateTestCase";
import { getModulesByProjectId } from "../api/module/getModule";
import {
  getSubmodulesByModule,
  Submodule,
} from "../api/submodule/submoduleget";
import {
  createTestCase,
  CreateTestCaseRequest,
} from "../api/testCase/createTestcase";
const BASE_URL = import.meta.env.VITE_BASE_URL;

import { Toast } from "../components/ui/Toast";
import QuickAddTestCase from "./QuickAddTestCase";
import { useApp } from "../context/AppContext";
import apiClient from "../lib/api";
import { importTestCases, ImportTestCaseResponse } from "../api/importTestCase";

import { useAccessibleProjects } from "../api/useAccessibleProjects";
import { usePermission } from "../context/PermissionContext";

export const TestCase: React.FC = () => {
  const { projectId, moduleId, subModuleId } = useParams();
  const navigate = useNavigate();
  const { setSelectedProjectId: setGlobalProjectId } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    String(projectId ?? ""),
  );
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(
    moduleId ?? null,
  );
  const [selectedSubmoduleId, setSelectedSubmoduleId] = useState<string | null>(
    subModuleId ?? null,
  );

  const { can } = usePermission();

  const [filterDescription, setFilterDescription] = useState("");


const [testCases, setTestCases] = useState<TestCaseType[]>([]);
const [filteredTestCases, setFilteredTestCases] = useState<TestCaseType[]>([]);



  const [totalPagesFromServer, setTotalPagesFromServer] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isServerPaginated, setIsServerPaginated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [allModuleTestCases, setAllModuleTestCases] = useState<TestCaseType[]>(
    [],
  );
 const sortTestCasesByNo = (testCases: TestCaseType[]) => {
  return [...testCases].sort((a, b) => {
    const aNo = Number(a.testcaseNo);
    const bNo = Number(b.testcaseNo);

    return aNo - bNo;
  });
};

  const [modulesByProject, setModulesByProject] = useState<
    Record<
      string,
      { id: string; name: string; submodules: { id: string; name: string }[] }[]
    >
  >({});
 const { projects } = useAccessibleProjects();

/**
 * The backend does not expose:
 *   GET /api/v1/module/{moduleId}/testcase
 *
 * Test cases are exposed through the project/module/submodule endpoint.
 * When only a module is selected, fetch its submodules and merge their
 * test cases on the client.
 */
const fetchTestCasesForModule = async (
  projId: string,
  modId: string,
  page = 0,
  size = 10,
  fetchAll = false,
): Promise<TestCaseType[]> => {
  const modules = modulesByProject[projId] || [];
  const module = modules.find((mod) => String(mod.id) === String(modId));

  if (!module || !module.submodules?.length) {
    return [];
  }

  const results = await Promise.all(
    module.submodules.map((sub) =>
      getTestCasesByProjectAndSubmodule(
        projId,
        modId,
        String(sub.id),
        0,
        100000,
      ).catch((error) => {
        console.error(
          `Failed to fetch test cases for submodule ${sub.id}:`,
          error,
        );
        return [];
      }),
    ),
  );

  const merged = results.flat() as any[];

  const mapped = merged.map((tc: any) => ({
    ...tc,
    id: tc.testCaseId ?? tc.id,
    no: tc.testCaseNumber ?? tc.no,
    testcaseNo: tc.testCaseNumber ?? tc.no,
    testCaseId: tc.testCaseId ?? tc.id,
    moduleId: tc.moduleId ?? Number(modId),
    module: tc.moduleName || tc.module || module.name,
    subModuleId: tc.subModuleId,
    subModule:
      tc.subModuleName ||
      tc.subModule ||
      module.submodules.find(
        (sm) => String(sm.id) === String(tc.subModuleId),
      )?.name ||
      "",
    steps: tc.detailsSteps ?? tc.steps ?? "",
    severity:
      severities.find((s) => s.id === tc.severityId)?.name ||
      tc.severityName ||
      "",
    type:
      defectTypes.find((dt) => dt.id === tc.defectTypeId)?.name ||
      tc.defectTypeName ||
      "",
  })) as TestCaseType[];

  const sorted = sortTestCasesByNo(mapped);

  if (fetchAll) {
    return sorted;
  }

  const start = page * size;
  return sorted.slice(start, start + size);
};


const fetchAllTestCasesForProject = async (projId: string) => {
  if (!projId) {
    setTestCases([]);
    setAllModuleTestCases([]);
    setFilteredTestCases([]);
    setTotalElements(0);
    setTotalPagesFromServer(1);
    setIsServerPaginated(false);
    return;
  }

  try {
    const response = await getTestCasesByProject(
      projId,
      0,
      1000
    );

    const mappedTestCases = (response as any[]).map((tc: any) => ({
      ...tc,

      id: tc.testCaseId ?? tc.id,

      testCaseId: tc.testCaseId ?? tc.id,

      testcaseNo: String(
        tc.testCaseNumber ??
        tc.testCaseId ??
        tc.id ??
        ""
      ),

      testCaseNumber:
        tc.testCaseNumber ??
        tc.testCaseId ??
        tc.id,

      description: tc.description ?? "",

      steps:
        tc.testSteps ??
        tc.detailsSteps ??
        tc.steps ??
        "",

      projectId:
        tc.projectId ??
        Number(projId),

      projectName:
        tc.projectName ??
        "",

      moduleId:
        tc.moduleId,

      module:
        tc.moduleName ??
        tc.module ??
        "",

      subModuleId:
        tc.subModuleId,

      subModule:
        tc.subModuleName ??
        tc.subModule ??
        "",

      severityId:
        tc.severityId,

      severity:
        severities.find(
          (s) => s.id === tc.severityId
        )?.name ??
        tc.severityName ??
        "",

      defectTypeId:
        tc.defectTypeId,

      type:
        defectTypes.find(
          (dt) => dt.id === tc.defectTypeId
        )?.name ??
        tc.defectTypeName ??
        "",
    })) as TestCaseType[];

  const sortedMapped = sortTestCasesByNo(mappedTestCases);

setTestCases(sortedMapped);
setAllModuleTestCases(sortedMapped);
setFilteredTestCases(sortedMapped);
setTotalElements(sortedMapped.length);

   setTotalPagesFromServer(
  Math.ceil(sortedMapped.length / rowsPerPage) || 1
);

    setIsServerPaginated(false);

    console.log(
  "PROJECT ALL TEST CASES:",
  sortedMapped
);
  } catch (error) {
    console.error(
      "Failed to fetch project test cases:",
      error
    );

    setTestCases([]);
    setAllModuleTestCases([]);
    setFilteredTestCases([]);
    setTotalElements(0);
    setTotalPagesFromServer(1);
    setIsServerPaginated(false);
  }
};


 useEffect(() => {
  if (!selectedProjectId) return;

  getModulesByProjectId(Number(selectedProjectId))
    .then((res: any) => {
      console.log("MODULE API RESPONSE:", res);

      // Handle different response wrapper structures
      const rawModules =
        res?.data?.data?.content ??
        res?.data?.data ??
        res?.data?.content ??
        res?.data ??
        [];

      console.log("RAW MODULES:", rawModules);

      const modulesArray = Array.isArray(rawModules)
        ? rawModules
        : [];

      const modules = modulesArray.map((mod: any) => {

        console.log("MODULE:", mod);

        const rawSubModules =
          mod?.submodules ??
          mod?.subModules ??
          mod?.subModuleList ??
          mod?.submodulesList ??
          [];

        return {
          id: String(
            mod?.moduleId ??
            mod?.id
          ),

          name:
            mod?.moduleName ??
            mod?.name ??
            "",

          submodules: (
            Array.isArray(rawSubModules)
              ? rawSubModules
              : []
          ).map((sm: any) => ({
            id: String(
              sm?.subModuleId ??
              sm?.id
            ),

            name:
              sm?.subModuleName ??
              sm?.name ??
              "",
          })),
        };
      });

      console.log("MAPPED MODULES:", modules);

      setModulesByProject((prev) => ({
        ...prev,
        [String(selectedProjectId)]: modules,
      }));
    })
    .catch((error: any) => {
      console.error(
        "FAILED TO LOAD MODULES:",
        error
      );

      setModulesByProject((prev) => ({
        ...prev,
        [String(selectedProjectId)]: [],
      }));
    });

}, [selectedProjectId]);

  const projectModules = useMemo(() => {
    return selectedProjectId ? modulesByProject[selectedProjectId] || [] : [];
  }, [modulesByProject, selectedProjectId]);

  const [isViewStepsModalOpen, setIsViewStepsModalOpen] = useState(false);
  const [isViewTestCaseModalOpen, setIsViewTestCaseModalOpen] = useState(false);

  const [viewingTestCase, setViewingTestCase] = useState<TestCaseType | null>(
    null,
  );

  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [selectedModules] = useState<string[]>([]);
  const [selectedSubmodules] = useState<string[]>([]);

  interface ModalFormData {
    testCaseName: string;
    module: string;
    subModule: string;
    description: string;
    steps: string;
    type: string | number;
    severity: string;
    severityId?: string | number;
    projectId: string | undefined;
    id?: string;
    moduleId?: string | number;
    subModuleId?: string | number;
  }
  const defaultFormData: ModalFormData = {
    testCaseName: "",
  module: "",
  subModule: "",
  description: "",
  steps: "",
  type: "",
  severity: "",
  severityId: "",
  projectId: selectedProjectId,
};

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ModalFormData>({
    ...defaultFormData,
    projectId: selectedProjectId,
  });
  const isEditMode = !!formData.id;

  const [modals, setModals] = useState<
    {
      open: boolean;
      formData: ModalFormData;
    }[]
  >([
    {
      open: false,
        formData: {
          testCaseName: "",
        module: "",
        subModule: "",
        description: "",
        steps: "",
        type: "functional",
        severity: "",
        severityId: "", 
        projectId: projectId,
      },
    },
  ]);

  const [currentModalIdx, setCurrentModalIdx] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submodules, setSubmodules] = useState<Submodule[]>([]);
  const [submoduleError, setSubmoduleError] = useState<string>("");

//   useEffect(() => {
//   if (!selectedModuleId) {
//     setSubmodules([]);
//     setSubmoduleError("");
//     return;
//   }

//   getSubmodulesByModule(Number(selectedModuleId))
//   .then((res) => {
//     console.log("SUBMODULE API RESPONSE:", res);

//     const mappedSubmodules = (res.data || []).map((sm: any) => ({
//   ...sm,
//   id: String(sm.subModuleId ?? sm.id),
//   name:
//     sm.subModuleName ??
//     sm.getSubModuleName ??
//     sm.submoduleName ??
//     sm.name ??
//     "",
// }));

//     console.log("MAPPED SUBMODULES:", mappedSubmodules);

//     setSubmodules(mappedSubmodules);
//     setSubmoduleError("");
//   })
//   .catch((error) => {
//     console.error("SUBMODULE API ERROR:", error);

//     setSubmodules([]);
//     setSubmoduleError("Failed to fetch submodules.");
//   });
// }, [selectedModuleId]);

useEffect(() => {
  if (!selectedModuleId) {
    setSubmodules([]);
    setSubmoduleError("");
    return;
  }

  getSubmodulesByModule(Number(selectedModuleId))
    .then((res) => {
      console.log("SUBMODULE API RESPONSE:", res);

      const mappedSubmodules = (res.data || []).map(
        (sm: any) => ({
          ...sm,
          id: String(sm.subModuleId ?? sm.id),
          name:
            sm.subModuleName ??
            sm.getSubModuleName ??
            sm.submoduleName ??
            sm.name ??
            "",
        })
      );

      console.log(
        "MAPPED SUBMODULES:",
        mappedSubmodules
      );

      setSubmodules(mappedSubmodules);
      setSubmoduleError("");
    })
    .catch((error) => {
      console.error(
        "SUBMODULE API ERROR:",
        error
      );

      setSubmodules([]);
      setSubmoduleError(
        "Failed to fetch submodules."
      );
    });
}, [selectedModuleId]);

  const [severities, setSeverities] = useState<
    { id: number; name: string; color: string }[]
  >([]);
  const [defectTypes, setDefectTypes] = useState<
    { id: number; name: string }[]
  >([]);

  useEffect(() => {
    Promise.all([getSeverities(0, 1000), getDefectTypes(0, 1000)])
      .then(([severityResponse, defectTypeResponse]) => {
        const severityContent = severityResponse?.data?.content ?? [];
        const defectTypeContent = defectTypeResponse?.data?.content ?? [];

        setSeverities(
          severityContent.map((severity: any) => ({
            id: Number(severity.severityId ?? severity.id),
            name: severity.severityName ?? severity.name ?? "",
            color: severity.colorCode ?? severity.color ?? "",
          })),
        );
        setDefectTypes(
          defectTypeContent.map((defectType: any) => ({
            id: Number(defectType.defectTypeId ?? defectType.id),
            name: defectType.defectTypeName ?? defectType.name ?? "",
          })),
        );
      })
      .catch((error) => {
        console.error("Failed to load test case filters:", error);
        setSeverities([]);
        setDefectTypes([]);
      });
  }, []);

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });

  const [createAlert, setCreateAlert] = useState({
    isOpen: false,
    message: "",
  });
  const [updateAlert, setUpdateAlert] = useState({
    isOpen: false,
    message: "",
  });
  const [deleteAlert, setDeleteAlert] = useState({
    isOpen: false,
    message: "",
  });

  const [pendingCreateSuccess, setPendingCreateSuccess] = useState(false);
  const [pendingUpdateSuccess, setPendingUpdateSuccess] = useState(false);
  const [pendingDeleteSuccess, setPendingDeleteSuccess] = useState(false);

  useEffect(() => {
    if (selectedProjectId) {
      if (selectedModuleId) {
        refreshTestCases();
      } else if (modulesByProject[selectedProjectId]?.length > 0) {
        fetchAllTestCasesForProject(selectedProjectId);
      } else {
        setTestCases([]);
      }
    } else {
      setTestCases([]);
    }
  }, [
    selectedProjectId,
    selectedModuleId,
    selectedSubmoduleId,
    currentPage,
    rowsPerPage,
    modulesByProject,
  ]);

  const [allSubmoduleTestCases, setAllSubmoduleTestCases] = useState<{
    [submoduleId: string]: TestCaseType[];
  }>({});

  const fetchAllSubmoduleTestCases = React.useCallback(() => {
    if (
      !selectedProjectId ||
      !selectedModuleId ||
      !Array.isArray(submodules) ||
      submodules.length === 0
    )
      return;

    Promise.all(
      submodules.map((sm) =>
        getTestCasesByProjectAndSubmodule(
          selectedProjectId,
          selectedModuleId,
          String(sm.id),
          0,
          1000000,
        ).then((data) => ({ submoduleId: String(sm.id), testCases: data })),
      ),
    ).then((results) => {
      const testCaseMap: { [submoduleId: string]: TestCaseType[] } = {};
      const moduleMap = Object.fromEntries(
        projectModules.map((m: any) => [m.id, m.name]),
      );
      const submoduleMap = Object.fromEntries(
        submodules.map((sm: any) => [sm.id, sm.name]),
      );

      results.forEach(({ submoduleId, testCases }) => {
        const mappedList = (testCases as any[]).map((tc: any) => ({
          ...tc,
          moduleId: tc.moduleId,
          module: moduleMap[tc.moduleId] || tc.moduleName || tc.module,
          subModuleId: tc.subModuleId,
          subModule:
            submoduleMap[tc.subModuleId] || tc.subModuleName || tc.subModule,
          severity: ((severities &&
            severities.find((s) => s.id === tc.severityId)?.name) ||
            "") as TestCaseType["severity"],
          type: ((defectTypes &&
            defectTypes.find((dt) => dt.id === tc.defectTypeId)?.name) ||
            "") as TestCaseType["type"],
        })) as TestCaseType[];

        (mappedList as any).totalPages = (testCases as any).totalPages;
        (mappedList as any).totalElements = (testCases as any).totalElements;
        (mappedList as any).isServerPaginated = (
          testCases as any
        ).isServerPaginated;

        testCaseMap[submoduleId] = mappedList;
      });
      setAllSubmoduleTestCases(testCaseMap);
    });
  }, [
    selectedProjectId,
    selectedModuleId,
    submodules,
    projectModules,
    severities,
    defectTypes,
  ]);

  useEffect(() => {
    fetchAllSubmoduleTestCases();
  }, [fetchAllSubmoduleTestCases]);

  useEffect(() => {
    const handleTestCaseCreated = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const createdProjectId = detail.projectId;

      if (
        createdProjectId &&
        selectedProjectId &&
        String(createdProjectId) !== String(selectedProjectId)
      ) {
        return;
      }

      if (!selectedProjectId) return;

      if (selectedSubmoduleId) {
        // Submodule selected
        refreshTestCases();
      } else if (selectedModuleId) {
        // Module selected
        refreshTestCases();
      } else {
        // Project selected
        fetchAllTestCasesForProject(selectedProjectId);
      }

      fetchAllSubmoduleTestCases();
    };

    window.addEventListener("testCaseCreated", handleTestCaseCreated);
    return () => {
      window.removeEventListener("testCaseCreated", handleTestCaseCreated);
    };
  }, [
    selectedProjectId,
    selectedModuleId,
    selectedSubmoduleId,
    fetchAllSubmoduleTestCases,
  ]);

  const selectedTestCaseIds = useMemo(() => {
    let ids: string[] = [];
    if (selectedModules.length > 0) {
      ids = [
        ...new Set(
          testCases
            .filter(
              (tc) =>
                tc.projectId === String(selectedProjectId) &&
                selectedModules.includes(tc.module ?? ""),
            )
            .map((tc) => tc.id),
        ),
      ];
    }
    if (selectedSubmodules.length > 0) {
      ids = [
        ...ids,
        ...new Set(
          testCases
            .filter(
              (tc) =>
                tc.projectId === String(selectedProjectId) &&
                selectedSubmodules.includes(tc.subModule ?? ""),
            )
            .map((tc) => tc.id),
        ),
      ];
    }
    return Array.from(new Set(ids));
  }, [selectedModules, selectedSubmodules, testCases, selectedProjectId]);

  

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImportExcelButton = () => {
    fileInputRef.current?.click();
  };
  const handleImportExcelInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedProjectId) {
      showAlert("Please select a project before importing test cases.");
      return;
    }

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (
      !allowedTypes.includes(file.type) &&
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".csv")
    ) {
      showAlert("Please select a valid Excel (.xlsx) or CSV (.csv) file.");
      return;
    }
    const formData = new FormData();

    formData.append("file", file);

    setIsImporting(true);
    importTestCases(formData, selectedProjectId)
      .then((response) => {
        setCreateAlert({
          isOpen: true,
          message: response?.message || "Test cases imported successfully!",
        });
        if (selectedProjectId) {
          if (selectedModuleId) {
            refreshTestCases();
          } else {
            fetchAllTestCasesForProject(selectedProjectId);
          }
        }
        setSearchResults(null);
        setClientFilteredResults(null);
        setSearchFilters({
          description: "",
          typeId: "",
          severityId: "",
          submoduleId: "",
        });

        if (fileInputRef.current) fileInputRef.current.value = "";
      })
      .catch((error) => {
        setCreateAlert({
          isOpen: true,
          message:
            error?.response?.data?.message ||
            "Failed to import test cases. Please try again.",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
      })
      .finally(() => {
        setIsImporting(false);
      });
  };
  const handleExportExcel = () => {
    const wsData = [
      [
        "Module",
        "Sub Module",
        "Description",
        "Steps",
        "Type",
        "Severity",
        "Test Case ID",
      ],
      ...filteredTestCases.map((tc) => [
        tc.module,
        tc.subModule,
        tc.description,
        tc.steps,
        tc.type,
        tc.severity,
        tc.id,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TestCases");
    XLSX.writeFile(
      wb,
      `TestCases_${selectedProjectId}_${selectedModuleId}.xlsx`,
    );
  };

  const handleSubmitAll = async (e?: React.FormEvent) => {
  if (e) e.preventDefault();

  // =========================
  // UPDATE
  // =========================
  if (formData.id) {
    const severityId = Number(formData.severityId);

    const defectTypeId = defectTypes.find(
      (dt) => dt.name === formData.type
    )?.id;

    const originalTestCase = testCases.find(
      (tc: any) =>
        String(tc.id) === String(formData.id) ||
        String(tc.testCaseId) === String(formData.id)
    );

    if (originalTestCase) {
      const originalDescription = String(
        originalTestCase.description ?? ""
      );

      const originalSteps = String(
        originalTestCase.testSteps ??
          originalTestCase.detailsSteps ??
          originalTestCase.steps ??
          ""
      );

      const currentDescription = String(
        formData.description ?? ""
      );

      const currentSteps = String(
        formData.steps ?? ""
      );

      const descriptionChanged =
        originalDescription.trim() !==
        currentDescription.trim();

      const stepsChanged =
        originalSteps.trim() !==
        currentSteps.trim();

      // No changes
      if (!descriptionChanged && !stepsChanged) {
        setUpdateAlert({
          isOpen: true,
          message: "No changes were made to the test case.",
        });

        return;
      }
    }

    const payload: any = {
      testCaseName:
        formData.testCaseName || "Test Case",
      description: formData.description,
      testSteps: formData.steps,
      severityId: severityId,
      defectTypeId: defectTypeId,
      subModuleId: Number(formData.subModuleId),
      moduleId: Number(formData.moduleId),
      projectId: Number(formData.projectId),
    };

    try {
      const response = await updateTestCase(
        Number(formData.subModuleId),
        formData.id,
        payload
      );

      if (
        response?.status === "Failure" ||
        response?.statusCode === 400 ||
        response?.statusCode === 40004
      ) {
        setUpdateAlert({
          isOpen: true,
          message:
            response?.statusMessage ||
            response?.message ||
            "Failed to update test case.",
        });

        return;
      }

      setUpdateAlert({
        isOpen: true,
        message:
          response?.statusMessage ||
          "Test case updated successfully!",
      });

      if (selectedSubmoduleId) {
        await refreshTestCases();
        await fetchAllSubmoduleTestCases();
      } else if (selectedModuleId) {
        await refreshTestCases();
        await fetchAllSubmoduleTestCases();
      } else if (selectedProjectId) {
        await fetchAllTestCasesForProject(
          selectedProjectId
        );
      }

      setTimeout(() => {
        setFormData(defaultFormData);
        setIsModalOpen(false);
        setUpdateAlert({
          isOpen: false,
          message: "",
        });
      }, 5000);

    } catch (error: any) {
      console.error(
        "Failed to update test case:",
        error
      );

      setUpdateAlert({
        isOpen: true,
        message:
          error?.response?.data?.statusMessage ||
          error?.response?.data?.message ||
          "Failed to update test case.",
      });
    }

    return;
  }

  // =========================
  // CREATE
  // =========================

  const subModuleId = formData.subModuleId
    ? Number(formData.subModuleId)
    : null;

  const severityId = Number(formData.severityId);

  const defectTypeId = defectTypes.find(
    (dt) => dt.name === formData.type
  )?.id;

  if (!subModuleId || !severityId || !defectTypeId) {
    setCreateAlert({
      isOpen: true,
      message: "Missing required fields.",
    });

    return;
  }

  const payload: CreateTestCaseRequest = {
    testCaseName: "Test Case",
    description: formData.description,
    testSteps: formData.steps,
    severityId,
    defectTypeId,
    projectId: Number(selectedProjectId),
    moduleId: Number(selectedModuleId),
    subModuleId: subModuleId,
  };

  console.log("CREATE PAYLOAD:", payload);

  try {
    const response = await createTestCase(
      Number(selectedProjectId),
      Number(selectedModuleId),
      Number(selectedSubmoduleId),
      payload
    );

    if (
      response?.statusCode === 201 ||
      response?.status === "Created"
    ) {
      setCreateAlert({
        isOpen: true,
        message:
          response?.statusMessage ||
          "Test case created successfully!",
      });

      if (selectedModuleId) {
        await refreshTestCases();
        await fetchAllSubmoduleTestCases();
      } else if (selectedProjectId) {
        await fetchAllTestCasesForProject(
          selectedProjectId
        );
      }

      setTimeout(
        () => resetFormAndRefresh(),
        1200
      );
    } else {
      setCreateAlert({
        isOpen: true,
        message:
          response?.statusMessage ||
          "Failed to create.",
      });
    }

  } catch (error: any) {
    setCreateAlert({
      isOpen: true,
      message:
        error?.response?.data?.statusMessage ||
        error?.response?.data?.message ||
        "Failed to create test case.",
    });
  }
};
    

  const resetFormAndRefresh = () => {
    setFormData(defaultFormData);
    setIsModalOpen(false);
    setCreateAlert({ isOpen: false, message: "" });
    setUpdateAlert({ isOpen: false, message: "" });
    refreshTestCases();
    fetchAllSubmoduleTestCases();
  };

  const getSeverityColor = (severityName: string | undefined | null) => {
    if (!severityName) return "bg-gray-100 text-gray-800";

    const severity = severities.find(
      (s) => s.name?.toLowerCase() === severityName?.toLowerCase(),
    );
    if (severity && severity.color) {
      const hexColor = severity.color.startsWith("#")
        ? severity.color
        : `#${severity.color}`;
      return { backgroundColor: hexColor, color: "white" };
    }

    switch (severityName.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTestCaseId = (
    testCase: TestCaseType | undefined | null,
  ): string => {
    if (!testCase) {
      return "N/A";
    }

    if (testCase.testCaseId) {
      return testCase.testcaseNo;
    }

    return "N/A";
  };
  const renderColoredSpan = (
    text: string | undefined | null,
    colorResult: string | React.CSSProperties,
  ) => {
    const displayText = text || "-";
    if (typeof colorResult === "string") {
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${colorResult}`}
        >
          {displayText}
        </span>
      );
    } else {
      return (
        <span
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={colorResult}
        >
          {displayText}
        </span>
      );
    }
  };

  const handleViewSteps = (testCase: TestCaseType) => {
    setViewingTestCase(testCase);
    setIsViewStepsModalOpen(true);
  };

  const handleViewTestCase = (testCase: TestCaseType) => {
    setViewingTestCase(testCase);
    setIsViewTestCaseModalOpen(true);
  };

  const [searchFilters, setSearchFilters] = useState({
    description: "",
    typeId: "",
    severityId: "",
    submoduleId: "",
  });
  const [searchResults, setSearchResults] = useState<TestCaseType[] | null>(
    null,
  );

  const [isSearching, setIsSearching] = useState(false);

  const [clientFilteredResults, setClientFilteredResults] = useState<
    TestCaseType[] | null
  >(null);

  const searchTimeoutRef = useRef<number | null>(null);
  const filterTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  const applyClientFilters = (filters: {
  description: string;
  typeId: string;
  severityId: string;
  submoduleId: string;
}) => {
  const filtered = testCases.filter((tc: any) => {
    const matchesDescription =
      !filters.description.trim() ||
      String(tc.description || "")
        .toLowerCase()
        .includes(filters.description.trim().toLowerCase());

    const typeId =
      tc.defectTypeId ??
      tc.typeId ??
      tc.defectType?.defectTypeId ??
      tc.defectType?.id ??
      defectTypes.find(
        (defectType) =>
          defectType.name.toLowerCase() ===
          String(tc.defectTypeName ?? tc.type ?? "").toLowerCase(),
      )?.id;

    const severityId =
      tc.severityId ??
      tc.severity?.severityId ??
      tc.severity?.id ??
      severities.find(
        (severity) =>
          severity.name.toLowerCase() ===
          String(tc.severityName ?? tc.severity ?? "").toLowerCase(),
      )?.id;

    const matchesType =
      !filters.typeId ||
      String(typeId) === String(filters.typeId);

    const matchesSeverity =
      !filters.severityId ||
      String(severityId) === String(filters.severityId);

    return (
      matchesDescription &&
      matchesType &&
      matchesSeverity
    );
  });

  setSearchResults(null);
  setClientFilteredResults(
    sortTestCasesByNo(filtered)
  );
  setCurrentPage(1);
};

  const handleSubmoduleSelect = (submoduleId: string | null) => {
    setSelectedSubmoduleId(submoduleId);
    setSearchResults(null);
    setClientFilteredResults(null);
    setSearchFilters({
      description: "",
      typeId: "",
      severityId: "",
      submoduleId: "",
    });
    setCurrentPage(1);

    if (submoduleId && selectedProjectId && selectedModuleId) {
    navigate(
      `/projects/${selectedProjectId}/module/${selectedModuleId}/subModule/${submoduleId}/test-cases`,
    );
  }
  };

  const getNameByIdOrValue = (
    value: string | number | undefined | null,
    list: any[],
    idKey: string = "id",
    nameKey: string = "name",
  ) => {
    if (!value) return "";
    const found = list.find(
      (item) =>
        String(item[idKey]) === String(value) || item[nameKey] === value,
    );
    return found ? found[nameKey] : String(value);
  };

  const getModuleName = (value: string | number | undefined | null) => {
    if (!value) return "";
    const found = projectModules.find(
      (m) => String(m.id) === String(value) || m.name === value,
    );
    return found ? found.name : "Unknown Module";
  };
  const getSubmoduleName = (value: string | number | undefined | null) => {
    if (!value) return "";
    for (const mod of projectModules) {
      const found = mod.submodules.find(
        (sm) => String(sm.id) === String(value) || sm.name === value,
      );
      if (found) return found.name;
    }
    if (Array.isArray(submodules)) {
      const foundGlobal = submodules.find(
        (sm) => String(sm.id) === String(value) || sm.name === value,
      );
      if (foundGlobal) return foundGlobal.name;
    }
    return "Unknown Submodule";
  };
  const getTypeName = (value: string | number | undefined | null) =>
    getNameByIdOrValue(value, defectTypes, "id", "name");
  const getSeverityName = (value: string | number | undefined | null) =>
    getNameByIdOrValue(value, severities, "id", "name");

  const handleDeleteTestCase = async (
  projectId: number,
  moduleId: number,
  subModuleId: number,
  testCaseId: number,
) => {
  try {
    const response = await deleteTestCase(
      projectId,
      moduleId,
      subModuleId,
      testCaseId,
    );

    return response;
  } catch (error: any) {
    throw error;
  }
};

  const tableData =
    searchResults !== null
      ? searchResults
      : clientFilteredResults !== null
        ? clientFilteredResults
        : filteredTestCases;
  const totalRows = isServerPaginated ? totalElements : tableData.length;
  const totalPages = isServerPaginated
    ? totalPagesFromServer
    : Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedTestCases = isServerPaginated
  ? tableData
  : tableData.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage,
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchResults, clientFilteredResults]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  useEffect(() => {}, [createAlert]);

  useEffect(() => {}, [updateAlert]);

  function extractNumericId(id: string) {
    return id.replace(/\D/g, "").replace(/^0+/, "");
  }

  const [alert, setAlert] = useState({ isOpen: false, message: "" });
  const showAlert = (message: string) => setAlert({ isOpen: true, message });
  const closeAlert = () => setAlert((a) => ({ ...a, isOpen: false }));

  const isCurrentModalValid = (modal: ModalFormData) => {
    return (
      modal.module &&
      modal.subModule &&
      modal.description &&
      modal.steps &&
      modal.type &&
      modal.severity
    );
  };

  const refreshTestCases = async () => {
    if (!selectedProjectId) {
  setTestCases([]);
  setAllModuleTestCases([]);
  setTotalElements(0);
  setTotalPagesFromServer(1);
  setIsServerPaginated(false);
  return;
}

    try {
      if (selectedSubmoduleId) {
        // Valid backend endpoint with server-side pagination.
        const responseArr = await getTestCasesByProjectAndSubmodule(
          selectedProjectId,
          selectedModuleId!,
          Number(selectedSubmoduleId),
          currentPage - 1,
          rowsPerPage,
        );

        const mappedTestCases = (responseArr as any[]).map((tc: any) => ({
          ...tc,
          id: tc.testCaseId,
  testCaseId: tc.testCaseId,
  testCaseNumber:
    tc.testCaseNumber ??
    tc.testCaseId,

  testcaseNo: String(
    tc.testCaseNumber ??
    tc.testCaseId
  ),

  description: tc.description,
  steps: tc.testSteps ?? tc.detailsSteps ?? tc.steps ?? "",

  module: tc.moduleName || "",

  subModule: tc.subModuleName || "",

  severity:
    severities.find((s) => s.id === tc.severityId)?.name ||
    tc.severityName ||
    "",

  type:
    defectTypes.find((dt) => dt.id === tc.defectTypeId)?.name ||
    tc.defectTypeName ||
    "",

  projectId: tc.projectId ?? Number(selectedProjectId),
  moduleId: tc.moduleId ?? Number(selectedModuleId),
  subModuleId: tc.subModuleId,
})) as TestCaseType[];

        const sorted = sortTestCasesByNo(mappedTestCases);

        setAllModuleTestCases(sorted);
        setTestCases(sorted);
        setFilteredTestCases(sorted);
        setTotalElements((responseArr as any).totalElements ?? sorted.length);
        setTotalPagesFromServer((responseArr as any).totalPages ?? 1);
        setIsServerPaginated(Boolean((responseArr as any).isServerPaginated));
      } else {
        // No module-only endpoint exists. Aggregate all submodules instead.
        const allModuleCases = await fetchTestCasesForModule(
          selectedProjectId,
          selectedModuleId!,
          0,
          rowsPerPage,
          true,
        );

        setAllModuleTestCases(allModuleCases);
        setTestCases(allModuleCases);
        setFilteredTestCases(allModuleCases);
        setTotalElements(allModuleCases.length);
        setTotalPagesFromServer(
          Math.ceil(allModuleCases.length / rowsPerPage) || 1,
        );
        setIsServerPaginated(false);
      }

      if (pageAfterDeleteRef.current !== null) {
        setCurrentPage(pageAfterDeleteRef.current);
        pageAfterDeleteRef.current = null;
      }
    } catch (error) {
      console.error("Failed to refresh test cases:", error);
      setTestCases([]);
      setAllModuleTestCases([]);
      setTotalElements(0);
      setTotalPagesFromServer(1);
      setIsServerPaginated(false);
    }
  };

 const [confirmOpen, setConfirmOpen] = useState(false);

const [pendingDeleteId, setPendingDeleteId] =
  useState<string | null>(null);

const [pendingDeleteSubModuleId, setPendingDeleteSubModuleId] =
  useState<number | null>(null);

const [pendingDeleteProjectId, setPendingDeleteProjectId] =
  useState<number | null>(null);

const [pendingDeleteModuleId, setPendingDeleteModuleId] =
  useState<number | null>(null);

const pageAfterDeleteRef = useRef<number | null>(null);

const [showQuickAdd, setShowQuickAdd] = useState(false);

  const exportTestCases = async () => {
    if (!selectedProjectId) {
      showAlert("Please select a project before exporting test cases.");
      return;
    }

    setIsExporting(true);
    try {
      const response = await apiClient.get(ENDPOINTS.testCaseBulkExport(Number(selectedProjectId)), {
        params: {
          projectId: selectedProjectId,
          moduleId: selectedModuleId,
          submoduleId: selectedSubmoduleId,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let fileName = `testcases_project_${selectedProjectId}.xlsx`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match?.[1]) fileName = match[1];
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message ||
          "Failed to export test cases. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto ">
      {}
      <div className="flex-none p-6 pb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Test Cases</h1>
          </div>
          {}
        </div>
        {}
       <ProjectSelector
  projects={projects}
  selectedProjectId={selectedProjectId || ""}
  onSelect={(id) => {
    setSelectedProjectId(id);
    setGlobalProjectId(id);

    // Reset module and submodule selection
    setSelectedModuleId(null);
    setSelectedSubmoduleId(null);
    

    // Reset pagination
    setCurrentPage(1);

    // Clear previous search/filter results
    setSearchResults(null);
    setClientFilteredResults(null);

    // Navigate to selected project
    navigate(`/projects/${id}/test-cases`);
     console.log(
    "NAVIGATING TO:",
    `/projects/${selectedProjectId}/module/${id}/test-cases`)
  }}
/>

        {}
        {selectedProjectId && (
          <div className="flex justify-end gap-2 mb-2 py-5 ">
            {can.testCase.create && (
              <button
                type="button"
                className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
                onClick={handleImportExcelButton}
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
                Import from Excel
              </button>
            )}
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleImportExcelInput}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              type="button"
              className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow"
              onClick={exportTestCases}
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
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0l-4 4m4-4l4 4"
                />
              </svg>
              Export to Excel
            </button>
          </div>
        )}
      </div>

      {}
      <div className="flex-1 px-6 pb-6">
        <div className="flex flex-col">
          {}
          {selectedProjectId && (
<ModuleSelector
  modules={projectModules}
  selectedModuleId={selectedModuleId}
  onSelect={async (id) => {
    setSelectedModuleId(id);
    setSelectedSubmoduleId(null);
    setSearchResults(null);
    setClientFilteredResults(null);
    setCurrentPage(1);

  try {
    const data = await getTestCasesByProjectAndModule(
      selectedProjectId!,
      id,
      0,
      1000,
    );

    console.log(
      "PROJECT + MODULE TEST CASES:",
      data,
    );

    const mapped = data.map((tc: any) => ({
      ...tc,
      id: tc.testCaseId,

      testCaseId: tc.testCaseId,

      testCaseNumber:
        tc.testCaseNumber ??
        tc.testCaseId,

      testcaseNo: String(
        tc.testCaseNumber ??
        tc.testCaseId
      ),
      defectTypeId: tc.defectTypeId,
      severityId: tc.severityId,
      steps: tc.testSteps ?? "",
      module: tc.moduleName ?? "",
      subModule: tc.subModuleName ?? "",
      severity: tc.severityName ?? "",
      type: tc.defectTypeName ?? "",
    }));

    setTestCases(mapped);
    setAllModuleTestCases(mapped);
    setFilteredTestCases(mapped);
    setTotalElements(mapped.length);

    const url =
      `/projects/${selectedProjectId}/module/${id}/test-cases`;

    console.log("NAVIGATING TO:", url);

    navigate(url);

  } catch (error) {
    console.error(
      "Failed to load project + module test cases:",
      error,
    );

    setTestCases([]);
    setAllModuleTestCases([]);
    setFilteredTestCases([]);
  }
}}
              className="mb-4"
            />
          )}

          {}
          {selectedProjectId &&
            (selectedModuleId ? (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Submodule Selection
                    </h2>
                  </div>
                  {submoduleError && (
                    <div className="mb-2 text-red-600 text-sm">
                      {submoduleError}
                    </div>
                  )}
                  <div className="relative flex items-center">
                    <button
                      onClick={() => {
                        const container =
                          document.getElementById("submodule-scroll");
                        if (container) container.scrollLeft -= 200;
                      }}
                      className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 mr-2"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div
                      id="submodule-scroll"
                      className="flex space-x-2 overflow-x-auto pb-2 scroll-smooth flex-1"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        maxWidth: "100%",
                      }}
                    >
                      {submodules.map((x: any) => {
                        const subCases =
                          allSubmoduleTestCases[String(x.id)] || [];
                        const submoduleTestCasesCount =
                          (subCases as any).totalElements ?? subCases.length;
                        return (
                          <div key={x.id} className="flex items-center">
                            <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-white hover:border-gray-300 transition-colors">
                              <Button
                                variant={
                                  selectedSubmoduleId === x.id
                                    ? "primary"
                                    : "secondary"
                                }
                                onClick={() => handleSubmoduleSelect(x.id)}
                                className="whitespace-nowrap border-0 m-2"
                              >
                                {x.name}
                                <Badge variant="info" className="ml-2">
                                  {submoduleTestCasesCount}
                                </Badge>
                              </Button>
                              {can.testCase.create && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSearchFilters({
                                      description: "",
                                      typeId: "",
                                      severityId: "",
                                      submoduleId: "",
                                    });
                                    setSearchResults(null);
                                    setClientFilteredResults(null);

                                    if (selectedSubmoduleId) {
                                      setTestCases(
                                        allModuleTestCases.filter(
                                          (tc) =>
                                            String(tc.subModuleId) ===
                                            String(selectedSubmoduleId),
                                        ),
                                      );
                                    } else {
                                      setTestCases(allModuleTestCases);
                                    }
                                    const currentModule = projectModules.find(
                                      (m) => m.id === selectedModuleId,
                                    );
                                    const moduleName =
                                      currentModule?.name || "";
                                    const subModuleName =
                                      x.subModuleName || x.name || "";

                                    setFormData({
                                      module: currentModule?.name || "",
                                      subModule:
                                        x.subModuleName || x.name || "",
                                      description: "",
                                      steps: "",
                                      type: "",
                                      severity: "",
                                      projectId: selectedProjectId,
                                      moduleId: selectedModuleId ?? undefined,
                                      subModuleId: String(x.id),
                                    });
                                    setIsModalOpen(true);
                                  }}
                                  className="p-1 border-0 hover:bg-gray-50"
                                  disabled={selectedSubmoduleId !== x.id}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => {
                        const container =
                          document.getElementById("submodule-scroll");
                        if (container) container.scrollLeft += 200;
                      }}
                      className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 ml-2"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ) : null)}

          {}
          {}

          {}
          {selectedProjectId && selectedModuleId && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <form
                  className="flex flex-wrap gap-4 items-end"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSearching(true);
                    try {
                      setClientFilteredResults(null);

                      let raw: any[] = [];

                      if (selectedSubmoduleId) {
                        // Valid submodule endpoint. Fetch all rows for searching.
                        raw = await getTestCasesByProjectAndSubmodule(
                          selectedProjectId,
                          selectedModuleId,
                          Number(selectedSubmoduleId),
                          0,
                          100000,
                        );
                      } else {
                        // Aggregate the selected module's submodules.
                        raw = await fetchTestCasesForModule(
                          selectedProjectId,
                          selectedModuleId,
                          0,
                          100000,
                          true,
                        );
                      }


                      const filtered = raw.filter((tc: any) => {
                      const matchesDescription =
                        !searchFilters.description.trim() ||
                        String(tc.description || "")
                          .toLowerCase()
                          .includes(searchFilters.description.trim().toLowerCase());

                     const typeId =
                      tc.defectTypeId ??
                      tc.typeId ??
                      tc.defectType?.defectTypeId ??
                      tc.defectType?.id;

                    const severityId =
                      tc.severityId ??
                      tc.severity?.severityId ??
                      tc.severity?.id;



                    const matchesType =
                      !searchFilters.typeId ||
                      String(typeId) === String(searchFilters.typeId);

                    const matchesSeverity =
                      !searchFilters.severityId ||
                      String(severityId) === String(searchFilters.severityId);

                    return (
                      matchesDescription &&
                      matchesType &&
                      matchesSeverity
                      );
                    })
                        .map((tc: any) => ({
                          ...tc,
                          id: tc.testCaseId,
                          no: tc.testCaseNo,
                          testcaseNo: String(tc.testCaseId),
                          testCaseId: tc.testCaseId,

                          description: tc.description,

                          testSteps: tc.testSteps,
                          detailsSteps: tc.testSteps,
                          steps: tc.testSteps ?? tc.detailsSteps ?? tc.steps ?? "",

                          expectedResult: tc.expectedResult,

                          subModuleId: tc.subModuleId,
                          subModuleName: tc.subModuleName,
                          subModule: tc.subModuleName || tc.subModule,

                          severityId: tc.severityId,
                          severity:
                            severities.find(
                              (s) => s.id === tc.severityId,
                            )?.name ||
                            tc.severityName ||
                            "",

                          defectTypeId: tc.defectTypeId,

                          type:
                            defectTypes.find(
                              (dt) => dt.id === tc.defectTypeId,
                            )?.name ||
                            tc.defectTypeName ||
                            "",

                          moduleId: tc.moduleId ?? Number(selectedModuleId),

                          module:
                            tc.moduleName ||
                            tc.module ||
                            getModuleName(
                              tc.moduleId ?? selectedModuleId,
                            ),
                        }));

                      setSearchResults(
                        sortTestCasesByNo(filtered as TestCaseType[]),
                      );
                    } catch (error) {
                      setSearchResults([]);
                    } finally {
                      setIsSearching(false);
                    }
                  }}
                >
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                     <input
  type="text"
  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  placeholder="Type to filter..."
  value={searchFilters.description}
  onChange={(e) => {
    const newFilters = {
      ...searchFilters,
      description: e.target.value,
    };

    setSearchFilters(newFilters);

    // Auto filter
    applyClientFilters(newFilters);
  }}
/>
</div>  

<div>
  <label className="block text-xs font-medium text-gray-700 mb-1">
    Type
  </label>           
  

  <select
    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    value={searchFilters.typeId}
    onChange={(e) => {
      const newFilters = {
        ...searchFilters,
        typeId: e.target.value,   
      };

      setSearchFilters(newFilters);
      applyClientFilters(newFilters);
    }}
  >
    <option value="">All</option>

    {defectTypes.map((type: any) => (
      <option key={type.id} value={type.id}>
        {type.name}
      </option>
    ))}
  </select>
</div>
                 <div>
  <label className="block text-xs font-medium text-gray-700 mb-1">
    Severity
  </label>

  <select
    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    value={searchFilters.severityId}
    onChange={(e) => {
      const newFilters = {
        ...searchFilters,
        severityId: e.target.value,
      };

      setSearchFilters(newFilters);
      applyClientFilters(newFilters);
    }}
  >
    <option value="">All</option>

    {severities.map((sev: any) => (
      <option key={sev.id} value={sev.id}>
        {sev.name}
      </option>
    ))}
  </select>
</div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Searching...
                        </>
                      ) : (
                        "Search"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-4 py-2 rounded"
                      onClick={() => {
                        setSearchFilters({
                          description: "",
                          typeId: "",
                          severityId: "",
                          submoduleId: "",
                        });
                        setSearchResults(null);
                        setClientFilteredResults(null);

                        if (selectedModuleId && allModuleTestCases.length > 0) {
                          setTestCases(allModuleTestCases);
                        } else if (selectedProjectId && selectedModuleId) {
                          refreshTestCases();
                        }
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {}
          {selectedProjectId && (
            <Card>
              <CardContent className="p-0">
                <table className="w-full testcase-table">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      {}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TEST CASE ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        DESCRIPTION
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        STEPS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TYPE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SEVERITY
                      </th>
                      {(can.testCase.edit || can.testCase.delete) && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ACTIONS
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedTestCases.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          {searchResults !== null ||
                          clientFilteredResults !== null ? (
                            <div>
                              <p className="text-lg font-medium mb-2">
                                No test cases found
                              </p>
                              <p className="text-sm">
                                Try adjusting your search criteria or clear the
                                filters
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-lg font-medium mb-2">
                                No test cases available
                              </p>
                              <p className="text-sm">
                                {selectedModuleId
                                  ? "No test cases found for the selected module. You can select a submodule for more specific results or add new test cases."
                                  : "Select a module to view test cases"}
                              </p>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedTestCases.map((testCase: TestCaseType) => (
                        <tr key={testCase.testCaseId} className="hover:bg-gray-50">
                          {}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {testCase.testCaseNumber != null
    ? testCase.testCaseNumber
    : "N/A"}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-500 max-w-xs description-cell"
                            title={testCase.description}
                          >
                            <div className="description-text">
                              {testCase.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <button
                              onClick={() => handleViewSteps(testCase)}
                              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                              title="View Steps"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {testCase.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderColoredSpan(
                              testCase.severityName || testCase.severity,
                              getSeverityColor(testCase.severityName || testCase.severity),
                            )}
                          </td>
                          {(can.testCase.edit || can.testCase.delete) && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                {can.testCase.edit && (
                                  <button
                                    onClick={() => {
                                      const subModuleId =
                                        (testCase as any).subModuleId ??
                                        testCase.subModule;

                                      let moduleId = (testCase as any).moduleId;
                                      let moduleName = testCase.moduleName;

                                      let subModuleName =
                                        testCase.subModuleName ||
                                        testCase.subModule ||
                                        "";

                                      for (const mod of projectModules) {
                                        const foundSub = mod.submodules.find(
                                          (sm: any) =>
                                            String(sm.id) ===
                                            String(subModuleId),
                                        );
                                        if (foundSub) {
                                          moduleId = mod.id;
                                          moduleName = mod.name;
                                          subModuleName =
                                            foundSub.name || subModuleName;
                                          break;
                                        }
                                      }

                                      if (!moduleName && selectedModuleId) {
                                        const currentModule =
                                          projectModules.find(
                                            (m) => m.id === selectedModuleId,
                                          );
                                        if (currentModule) {
                                          moduleName = currentModule.name;
                                          moduleId = currentModule.id;
                                        }
                                      }

                                      const typeName = getTypeName(
                                        testCase.type ||
                                          testCase.defectTypeName,
                                      );
                                      const severityName = getSeverityName(
                                        testCase.severity ||
                                          testCase.severityName,
                                      );

                                      setFormData({
                                        module: moduleName,
                                        subModule: subModuleName,
                                        description: testCase.description || "",
                                        steps:
                                          testCase.testSteps ||
                                          testCase.detailsSteps ||
                                          testCase.steps ||
                                          "",
                                        type: typeName || testCase.type || "",
                                         severity:
                                            testCase.severityName ||
                                            testCase.severity ||
                                            "",

                                        severityId: testCase.severityId ?? "",

                                        projectId:
                                          testCase.projectId ||
                                          selectedProjectId,
                                        id: testCase.id,
                                        moduleId: moduleId,
                                        subModuleId: subModuleId,
                                      });
                                      setIsModalOpen(true);
                                    }}
                                    className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                                {can.testCase.delete && (
                                  <button
                                    onClick={() => {
                                      setPendingDeleteId(String(testCase.id));

                                        setPendingDeleteProjectId(
                                          Number(testCase.projectId ?? selectedProjectId)
                                        );

                                        setPendingDeleteModuleId(
                                          Number(testCase.moduleId ?? selectedModuleId)
                                        );

                                        setPendingDeleteSubModuleId(
                                          Number(testCase.subModuleId)
                                        );

                                        setConfirmOpen(true);
                                    }}
                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {}
                <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      Rows per page:
                    </span>
                    <select
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      {[5, 10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {totalRows === 0
                      ? "No test cases"
                      : `Showing ${(currentPage - 1) * rowsPerPage + 1}–${Math.min(currentPage * rowsPerPage, totalRows)} of ${totalRows}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {}
      {}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData(defaultFormData);
          setCreateAlert({ isOpen: false, message: "" });
          setUpdateAlert({ isOpen: false, message: "" });
        }}

        title={isEditMode ? "Edit Test Case" : "Create New Test Case"}
        size="xl"
      >
        <form onSubmit={handleSubmitAll} className="space-y-4">
          <div className="flex items-center mb-2">{}</div>
          <div className="border rounded-lg p-4 mb-2 relative">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module
                </label>
                <div className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800 border border-gray-300">
                  {}
                  {formData.module}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub Module
                </label>
                <div className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800 border border-gray-300">
                  {}
                  {formData.subModule || "-"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}

                  onChange={(e) => handleInputChange("type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Type</option>
                  {}
                  {defectTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={formData.severityId || ""}
                  onChange={(e) =>
                    handleInputChange("severityId", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Severity</option>
                  {severities.map((sev: any) => (
                    <option key={sev.id} value={sev.id}>
                      {sev.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <p className="text-xs text-gray-500 mb-1">
                Description must contain letters and at least one number or
                special character
              </p>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Steps
              </label>
              <p className="text-xs text-gray-500 mb-1">
                Steps must contain letters and at least one number or special
                character (e.g., "1. Step one", "Step 1!")
              </p>
              <textarea
                value={formData.steps}
                onChange={(e) => handleInputChange("steps", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                required
              />
            </div>
          </div>
          <div className="flex justify-between items-center pt-4">
            {}
            <div className="flex items-center space-x-3">
              {}
              <Button
                type="button"
                variant="secondary"

                onClick={() => {
                  setIsModalOpen(false);
                  setFormData(defaultFormData);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"

                disabled={
                  !formData.description ||
                  !formData.steps ||
                  !formData.module ||
                  !formData.subModule ||
                  !formData.type ||
                  !formData.severityId
                }
              >
                {isEditMode ? "Update Test Case" : "Save Test Case"}
                {}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
      {}
      {}

      {}
      <Modal
        isOpen={isViewStepsModalOpen}
        onClose={() => {
          setIsViewStepsModalOpen(false);
          setViewingTestCase(null);
        }}
        title={`Test Step - ${viewingTestCase?.testcaseNo ? viewingTestCase.testcaseNo : "N/A"}`}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap break-words">
              {viewingTestCase?.detailsSteps || viewingTestCase?.steps}
            </p>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsViewStepsModalOpen(false);
                setViewingTestCase(null);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isViewTestCaseModalOpen}
        onClose={() => {
          setIsViewTestCaseModalOpen(false);
          setViewingTestCase(null);
        }}
        title={`Test Case Details - ${viewingTestCase?.testcaseNo}`}
        size="xl"
      >
        {viewingTestCase && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Description
                </h3>
                <p className="mt-1 text-sm text-gray-900">
                  {viewingTestCase.description}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Test Steps
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-line">
                  {viewingTestCase.steps}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Severity</h3>
                <div className="mt-1">
                  {renderColoredSpan(
                    viewingTestCase.severity,
                    getSeverityColor(viewingTestCase.severity),
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Module</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {viewingTestCase.module} / {viewingTestCase.subModule}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsViewTestCaseModalOpen(false);
                  setViewingTestCase(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {}
      <Modal
        isOpen={isDescriptionModalOpen}
        onClose={() => {
          setIsDescriptionModalOpen(false);
          setSelectedDescription("");
        }}
        title="Test Case Description"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">
              {selectedDescription}
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDescriptionModalOpen(false);
                setSelectedDescription("");
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {}
      <AlertModal
        isOpen={createAlert.isOpen}
        message={createAlert.message}
        onClose={() => {
          setCreateAlert({ isOpen: false, message: "" });
        }}
      />
      {}
      <AlertModal
        isOpen={updateAlert.isOpen}
        message={updateAlert.message}
        onClose={() => {
          setUpdateAlert({ isOpen: false, message: "" });
        }}
      />
      {}
      <AlertModal
        isOpen={deleteAlert.isOpen}
        message={deleteAlert.message}
        onClose={() => {
          setDeleteAlert({ isOpen: false, message: "" });
        }}
      />
      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex justify-center items-start bg-black bg-opacity-40">
          <div
            className="mt-8 bg-[#444] text-white rounded-lg shadow-2xl min-w-[400px] max-w-[95vw]"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
          >
            <div className="px-6 pb-4 pt-5 text-base text-white">
              Are you sure you want to delete this test case?
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-2 rounded mr-2"
                onClick={() => {
                  setConfirmOpen(false);
                  setPendingDeleteId(null);
                  setPendingDeleteSubModuleId(null);
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded"
                onClick={async () => {
                  if (pendingDeleteId && pendingDeleteSubModuleId) {
                    try {
                      await handleDeleteTestCase(
                        Number(pendingDeleteProjectId),
                        Number(pendingDeleteModuleId),
                        Number(pendingDeleteSubModuleId),
                        Number(pendingDeleteId),
                      );
                      setDeleteAlert({
                        isOpen: true,
                        message: "Test case deleted successfully!",
                      });

                      setTestCases((prev) => {
                        const updated = prev.filter(
                          (tc) =>
                            String(tc.testCaseId) !== String(pendingDeleteId) &&
                            String(tc.id) !== String(pendingDeleteId),
                        );

                        const newTotalRows = updated.length;
                        const newTotalPages =
                          Math.ceil(newTotalRows / rowsPerPage) || 1;
                        if (currentPage > newTotalPages && currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                        }
                        return updated;
                      });
                      setAllSubmoduleTestCases((prev) => {
                        const updated = { ...prev };
                        Object.keys(updated).forEach((submoduleId) => {
                          updated[submoduleId] = updated[submoduleId].filter(
                            (tc) =>
                              String(tc.testCaseId) !==
                                String(pendingDeleteId) &&
                              String(tc.id) !== String(pendingDeleteId),
                          );
                        });
                        return updated;
                      });

                      refreshTestCases();
                      fetchAllSubmoduleTestCases();
                    } catch (error: any) {
                      console.error("Delete test case error:", error);

                      const message =
                        error?.response?.data?.message ||
                        error?.response?.data?.statusMessage ||
                        "Failed to delete test case.";

                      setDeleteAlert({
                        isOpen: true,
                        message,
                      });
                    } finally {
                      setConfirmOpen(false);
                      setPendingDeleteId(null);
                    }
                  }
                }}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {}
      {showQuickAdd && (
        <QuickAddTestCase
          selectedProjectId={selectedProjectId}
          onTestCaseAdded={() => {
            setShowQuickAdd(false);

            if (selectedProjectId) {
              if (selectedModuleId) {
                refreshTestCases();
              } else {
                fetchAllTestCasesForProject(selectedProjectId);
              }
            }
          }}
        />
      )}

      {isImporting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[380px] rounded-2xl bg-white p-8 shadow-2xl">
            <div className="flex flex-col items-center">
              <OrbitProgress
                color="#2563eb"
                size="medium"
                text=""
                textColor=""
              />
              <h2 className="mt-6 text-2xl font-bold text-gray-800">
                Importing Test Cases
              </h2>
              <p className="mt-2 text-center text-gray-500">
                Please wait while we parse and save your Excel sheet...
              </p>
              <div className="mt-6 w-full rounded-full bg-gray-200 h-2 overflow-hidden">
                <div className="h-full w-full bg-blue-600 animate-pulse rounded-full"></div>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                This may take a few seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {isExporting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[380px] rounded-2xl bg-white p-8 shadow-2xl">
            <div className="flex flex-col items-center">
              <OrbitProgress
                color="#2563eb"
                size="medium"
                text=""
                textColor=""
              />
              <h2 className="mt-6 text-2xl font-bold text-gray-800">
                Exporting Test Cases
              </h2>
              <p className="mt-2 text-center text-gray-500">
                Please wait while we prepare and download your Excel sheet...
              </p>
              <div className="mt-6 w-full rounded-full bg-gray-200 h-2 overflow-hidden">
                <div className="h-full w-full bg-blue-600 animate-pulse rounded-full"></div>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                This may take a few seconds.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
