import React, { useState, useEffect, useRef } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { Card, CardContent } from "../components/ui/Card";

import { Button } from "../components/ui/Button";

import { Badge } from "../components/ui/Badge";

import { usePermission } from "../context/PermissionContext";
import { getAllProjects } from "../api/projectget";

import { getAllPriorities } from "../api/priority";
import type { Priority } from "../api/priority";

import {
  ChevronLeft,
  Eye,
  ChevronRight,
  Play,
  FileText,
  Calendar,
} from "lucide-react";

import { useApp } from "../context/AppContext";

import { Modal } from "../components/ui/Modal";

import { nanoid } from "nanoid";

import { Input } from "../components/ui/Input";

import { ProjectSelector } from "../components/ui/ProjectSelector";

import { ModuleSelector } from "../components/ui/ModuleSelector";

import { SubmoduleSelector } from "../components/ui/SubmoduleSelector";

import {
  projectReleaseCardView,
  getReleaseTestCaseCountsLoad,
} from "../api/releaseView/ProjectReleaseCardView";
//import { getReleaseTestCaseCounts } from "../api/releaseView/getReleaseTestCaseCount";


import { getAllSubmoduleAllocatedDevBySubmoduleId } from "../api/subModuleDevAlloc";
import { getDevelopersWithRolesByProjectId } from "../api/bench/projectAllocation";
import AuthService from "../services/authService";

import { Toast } from "../components/ui/Toast";

import { updateReleaseStatus } from "../api/projectAllocationHistory/updateReleaseStatus";

import { getModulesByProject } from "../api/module/getModuleByProject";

import { getSubmodulesByModule } from "../api/submodule/getSubmodulesByModule";

// import { getTestCasesByFilter } from "../api/testExecution/getTestCasesByFilter";
import { getTestCasesByFilter } from "../api/releasetestcase";

import { ImagePicker } from "../components/ui/ImagePicker";

import {
  getExecutionStatuses as getSavedExecutionStatuses,
  setExecutionStatus as persistExecutionStatus,
  ExecutionStatus,
  updateReleaseTestCaseStatus,
  updateReleaseTestCaseStatusWithImage,
} from "../api/testExecution/testExecution";

import { getSeverities } from "../api/severity";

import { getDefectTypes } from "../api/defectType";


import { getAllDefectStatuses } from "../api/defectStatus";

import { getUsersByModuleSubmoduleAllocation } from "../api/module/getUsersByAllocation";

import {
  filterDefectsForTest,
  getDefectsByProjectId,
} from "../api/defect/filterDefectByProject";

import { updateDefectById } from "../api/defect/updateDefect";
import {
  getDefectTestCaseCounts,
  getReleaseTestCases,
} from "../api/releasetestcase";import Priority from "./Priority";
import { useAccessibleProjects } from "../api/useAccessibleProjects";

interface TestCase {
  id: string;

  // Actual Test Case ID
  testCaseId: number;

  // Display ID
  no: string;

  // Release Test Case ID
  releaseTestCaseId?: number;
  testCaseNumber?: number;

  // Backend ID used for update API
  backendId?: number;

  module: string;
  subModule: string;

  // IDs needed for backend operations
  moduleId?: number;
  subModuleId?: number;

  description: string;
  steps: string;

  type: "functional" | "regression" | "smoke" | "integration" | string;

  severity: "low" | "medium" | "high" | "critical" | string;

  projectId: string;
  releaseId?: string;

  executionStatus?:
    | "not-started"
    | "in-progress"
    | "passed"
    | "failed"
    | "blocked";

  assignee?: string;
  assignedTo?: string;

  // Executor / QA
  employeeId?: number | null;
  employeeName?: string;

  // Defect assignment
  assignToId?: number | null;
  assignToName?: string;

  // Defect
  defectId?: number | null;

  // Priority
  priorityId?: number | null;
  priority?: string | null;

  executerDefect?: string;
  defectTypeName?: string;
}

const mockQA: any[] = [];

const mockTestCases = [
  {
    id: "TC-AUT-BIO-0001",

    module: "Authentication",

    subModule: "Biometric Login",

    description: "Verify that users can log in using biometric authentication",

    steps:
      "Open the mobile banking app\nSelect biometric login option\nAuthenticate using fingerprint/face ID\nVerify successful login and redirection to dashboard",

    type: "functional",

    severity: "high",

    status: "active",

    projectId: "PR0001",
  },

  {
    id: "TC-AUT-PIN-0001",

    module: "Authentication",

    subModule: "PIN Login",

    description: "Test PIN login security features",

    steps:
      "Enter incorrect PIN 3 times\nVerify account lockout\nWait for lockout period\nEnter correct PIN\nVerify successful login",

    type: "functional",

    severity: "critical",

    status: "active",

    projectId: "PR0001",
  },

  {
    id: "TC-PAY-001",

    module: "Payment",

    subModule: "Gateway Integration",

    description: "Test new payment gateway integration",

    steps:
      "Add items to cart\nProceed to checkout\nSelect new payment method\nComplete payment\nVerify order confirmation",

    type: "integration",

    severity: "high",

    status: "active",

    projectId: "PR0001",
  },

  {
    id: "TC-CART-002",

    module: "Shopping Cart",

    subModule: "Cart Management",

    description: "Test enhanced cart functionality",

    steps:
      "Add multiple items to cart\nModify quantities\nRemove items\nApply discount codes\nVerify total calculation",

    type: "functional",

    severity: "medium",

    status: "active",

    projectId: "PR0001",
  },

  {
    id: "TC-USER-003",

    module: "User Management",

    subModule: "Dashboard",

    description: "Test new user dashboard features",

    steps:
      "Login to user account\nNavigate to dashboard\nView order history\nUpdate profile information\nSave changes",

    type: "functional",

    severity: "medium",

    status: "active",

    projectId: "PR0001",
  },

  {
    id: "TC-ANALYTICS-001",

    module: "Analytics",

    subModule: "Real-time Data",

    description: "Test real-time analytics data display",

    steps:
      "Access analytics dashboard\nSelect real-time data view\nVerify data updates\nExport data\nGenerate reports",

    type: "functional",

    severity: "high",

    status: "active",

    projectId: "PR0002",
  },

  {
    id: "TC-REPORTS-002",

    module: "Reporting",

    subModule: "Custom Reports",

    description: "Test custom report generation",

    steps:
      "Navigate to reports section\nCreate custom report\nSelect data parameters\nGenerate report\nDownload report",

    type: "functional",

    severity: "medium",

    status: "active",

    projectId: "PR0002",
  },

  {
    id: "TC-VISUAL-003",

    module: "Visualization",

    subModule: "Charts",

    description: "Test data visualization components",

    steps:
      "Select chart type\nConfigure data source\nCustomize appearance\nSave chart configuration\nShare chart",

    type: "functional",

    severity: "low",

    status: "active",

    projectId: "PR0002",
  },
];
const DEV_ROLE_TYPES = [
  "DEV_LEAD",
  "SENIOR_DEVELOPER",
  "DEVELOPER",
  "JUNIOR_DEVELOPER",
];

const mockReleases = (() => {
  try {
    const stored = localStorage.getItem("mockReleases");

    if (stored) return JSON.parse(stored);
  } catch (e) {}

  return [
    {
      id: "R002",

      name: "Mobile Banking v2.1",

      version: "2.1.0",

      description: "Security enhancements and UI updates for mobile banking",

      projectId: "PR0001",

      status: "planned",

      releaseDate: "2024-04-01",

      testCases: ["TC-AUT-BIO-0001", "TC-AUT-PIN-0001"],

      features: ["Biometric login", "Quick transfer"],

      bugFixes: ["Fixed session timeout"],

      createdAt: "2024-03-10T09:00:00Z",
    },

    {
      id: "R003",

      name: "Inventory v1.2",

      version: "1.2.0",

      description:
        "Performance improvements and bug fixes for inventory system",

      projectId: "PR0003",

      status: "completed",

      releaseDate: "2024-02-15",

      testCases: [],

      features: ["Faster report generation"],

      bugFixes: ["Fixed database timeout"],

      createdAt: "2024-02-01T08:00:00Z",
    },

    {
      id: "R004",

      name: "E-commerce Platform v3.0",

      version: "3.0.0",

      description:
        "Major update with new payment gateway integration and improved user experience",

      projectId: "PR0001",

      status: "in-progress",

      releaseDate: "2024-05-15",

      testCases: ["TC-PAY-001", "TC-CART-002", "TC-USER-003"],

      features: ["New payment gateway", "Enhanced cart", "User dashboard"],

      bugFixes: ["Fixed checkout flow", "Improved search"],

      createdAt: "2024-04-01T10:00:00Z",
    },

    {
      id: "R005",

      name: "Analytics Dashboard v2.5",

      version: "2.5.0",

      description:
        "Advanced analytics with real-time data visualization and custom reports",

      projectId: "PR0002",

      status: "planned",

      releaseDate: "2024-06-01",

      testCases: ["TC-ANALYTICS-001", "TC-REPORTS-002", "TC-VISUAL-003"],

      features: ["Real-time analytics", "Custom reports", "Data export"],

      bugFixes: ["Fixed chart rendering", "Improved performance"],

      createdAt: "2024-04-15T14:00:00Z",
    },
  ];
})();

function useMockOrApiData(apiData: any, mockData: any): any {
  if (!apiData || (Array.isArray(apiData) && apiData.length === 0)) {
    return mockData;
  }

  return apiData;
}

export const TestExecution: React.FC = () => {
  const { projectId, releaseId } = useParams();

  const navigate = useNavigate();

  const {
    releases,

    testCases,

    setSelectedProjectId,

    addDefect,

    testCaseDefectMap,

    setTestCaseDefectMap,

    defects,

    modulesByProject,
  } = useApp();

  const { projects, switchProject } = useAccessibleProjects();

  const [selectedProject, setSelectedProject] = useState<string | null>(
    projectId || null,
  );

  const [selectedRelease, setSelectedRelease] = useState<string | null>(
    releaseId || null,
  );
  const [defectAllocatedUsers, setDefectAllocatedUsers] = useState<
    { userId: number; userName: string; empId: number }[]
  >([]);
  const [defectAllocatedUsersLoading, setDefectAllocatedUsersLoading] =
    useState(false);

  const [selectedModule, setSelectedModule] = useState("");

  const [selectedSubmodule, setSelectedSubmodule] = useState("");

  const [isViewStepsModalOpen, setIsViewStepsModalOpen] = useState(false);

  const [isViewTestCaseModalOpen, setIsViewTestCaseModalOpen] = useState(false);

  const [viewingTestCase, setViewingTestCase] = useState<TestCase | null>(null);
const [executionStatuses, setExecutionStatuses] = useState<{
    [key: string]: TestCase["executionStatus"];
  }>({});

  const [defectModalOpen, setDefectModalOpen] = useState<string | null>(null);

  const { can } = usePermission();

  const [defectFormData, setDefectFormData] = useState({
    title: "",

    description: "",

    module: "",

    subModule: "",

    type: "",

    priority: "",
    priorityId: 0,  

    severity: "",

    status: "",

    projectId: projectId || "",

    releaseId: releaseId || "",

    testCaseId: "",

    assignedTo: 0,

    reportedBy: "",

    rejectionComment: "",
    attachment: "",
    attachmentFile: null as File | null,
  });

  const [releaseLoading, setReleaseLoading] = useState(false);

  const [releaseError, setReleaseError] = useState("");

  const [projectReleaseCard, setProjectReleaseCard] = useState<any[]>([]);

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });

  const [modules, setModules] = useState<any[]>([]);

  const [modulesLoading, setModulesLoading] = useState(false);

  const [modulesError, setModulesError] = useState("");

  const [submodules, setSubmodules] = useState<any[]>([]);

  const [submodulesLoading, setSubmodulesLoading] = useState(false);

  const [submodulesError, setSubmodulesError] = useState("");

  const [releaseTestCaseCounts, setReleaseTestCaseCounts] = useState<{
    [key: string]: number;
  }>({});

  const [releaseTestCaseCountsLoading, setReleaseTestCaseCountsLoading] =
    useState(false);

  const [severities, setSeverities] = useState<any[]>([]);

  const [defectTypes, setDefectTypes] = useState<
    { id: number; defectTypeName: string }[]
  >([]);

  const [priorities, setPriorities] = useState<
    { id: number; name: string; color: string }[]
  >([]);

  const [defectStatuses, setDefectStatuses] = useState<
    { id: number; defectStatusName: string; colorCode: string }[]
  >([]);

  const [allocatedUsers, setAllocatedUsers] = useState<
    {
      userId: number;
      userName: string;
      userRole?: string;
      userWithRole: string;
    }[]
  >([]);

  const [allocatedUsersLoading, setAllocatedUsersLoading] = useState(false);

  const [defectSubmitting, setDefectSubmitting] = useState(false);

  const [existingDefects, setExistingDefects] = useState<any[]>([]);

  const [defectsLoading, setDefectsLoading] = useState(false);

  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{
    testCase: any;

    status: TestCase["executionStatus"];
  } | null>(null);
  // Keep the selected test case available while the defect modal is open.
  // State updates from the background refreshes can otherwise leave the modal
  // visible after the state value has been cleared.
  const pendingTestCaseRef = useRef<any>(null);

  const [previousStatusBeforeFail, setPreviousStatusBeforeFail] = useState<{
    testCaseId: string;

    previousStatus: TestCase["executionStatus"];
  } | null>(null);

  const [editingDefect, setEditingDefect] = useState<any | null>(null);

  const [isEditingDefect, setIsEditingDefect] = useState(false);
  const currentUser = AuthService.getCurrentUser();
  const currentUserId = currentUser?.userId || currentUser?.employeeId || null;

  const [allocatedTestCaseIds, setAllocatedTestCaseIds] = useState<number[]>([]);

const isAllocatedTestCase = (testCase: any) => {
  if (allocatedTestCaseIds.length === 0) {
    return true;
  }

  return allocatedTestCaseIds.includes(
    Number(testCase.testCaseId)
  );
};

  const canUserExecute = (_testCase: any): boolean => {
  return true;
};

  const [defectAssignments, setDefectAssignments] = useState<{
    [key: string]: string;
  }>({});

  const allocatedTestCasesMap = JSON.parse(
    localStorage.getItem("qaAllocatedTestCases") || "{}",
  );

  const qaAllocationsMap = JSON.parse(
    localStorage.getItem("qaAllocations") || "{}",
  );

  const submoduleHandledRef = useRef(false);
  const skipEffectUntilRef = useRef<number>(0);

  const [localTestCaseDefectMap, setLocalTestCaseDefectMap] = useState<{
    [key: string]: string;
  }>({});

  function getAssignedQAForRelease(testCaseId: string) {
    const allocations = qaAllocationsMap[selectedRelease || ""] || {};

    for (const [qaId, ids] of Object.entries(allocations)) {
      if ((ids as string[]).includes(testCaseId)) {
        const qa = effectiveQA && effectiveQA.find((q: any) => q.id === qaId);

        return qa ? qa.name : qaId;
      }
    }

    return null;
  }

  function getAssignedUserForDefect(defectId: string) {
    return defectAssignments[defectId] || null;
  }

  function normalize(text: string) {
    return (text || "")

      .toString()

      .toLowerCase()

      .replace(/\s+/g, " ")

      .trim();
  }

  function extractFieldValue(obj: any, fieldNames: string[]): string {
    for (const fieldName of fieldNames) {
      if (
        obj[fieldName] !== undefined &&
        obj[fieldName] !== null &&
        obj[fieldName] !== ""
      ) {
        return obj[fieldName];
      }
    }

    return "";
  }

  function findMatchingDefectForTestCase(testCase: any) {
    if (!existingDefects || existingDefects.length === 0 || !testCase)
      return null;

    const tcModule = normalize(
      extractFieldValue(testCase, ["module", "moduleName", "module_name"]),
    );

    const tcSubmodule = normalize(
      extractFieldValue(testCase, [
        "subModule",
        "subModuleName",
        "sub_module_name",
      ]),
    );

    const tcDesc = normalize(
      extractFieldValue(testCase, [
        "description",
        "release_test_case_description",
      ]),
    );
const match = existingDefects.find((defect: any) => {
      const dModule = normalize(
        extractFieldValue(defect, ["module_name", "moduleName", "module"]),
      );

      const dSubmodule = normalize(
        extractFieldValue(defect, [
          "sub_module_name",
          "subModuleName",
          "subModule",
        ]),
      );

      const dDesc = normalize(
        extractFieldValue(defect, [
          "release_test_case_description",
          "description",
          "steps",
        ]),
      );

      const descMatches =
        dDesc === tcDesc ||
        (dDesc &&
          tcDesc &&
          (dDesc.includes(tcDesc) ||
            tcDesc.includes(dDesc) ||
            dDesc.toLowerCase().includes(tcDesc.toLowerCase()) ||
            tcDesc.toLowerCase().includes(dDesc.toLowerCase())));

      const moduleMatch = dModule === tcModule;

      const submoduleMatch = dSubmodule === tcSubmodule;
return moduleMatch && submoduleMatch && descMatches;
    });

    if (match) {
} else {
}

    return match || null;
  }

  const safeProjectId = selectedProject || projectId || "";

  useEffect(() => {
    if (selectedProject) {
      setModulesLoading(true);

      setModulesError("");

      getModulesByProject(Number(selectedProject))
        .then((data) => setModules(data.data))

        .catch((err) => {
          setModulesError(err.message);

          setModules([]);
        })

        .finally(() => setModulesLoading(false));
    } else {
      setModules([]);
    }
  }, [selectedProject]);

  let storedMockTestCases = null;

  let storedMockQA = null;

  try {
    const stored = localStorage.getItem("mockTestCases");

    if (stored) storedMockTestCases = JSON.parse(stored);

    const storedQA = localStorage.getItem("mockQA");

    if (storedQA) storedMockQA = JSON.parse(storedQA);
  } catch (e) {}

  const effectiveTestCases = useMockOrApiData(
    testCases,
    storedMockTestCases || mockTestCases,
  );

  const effectiveQA = storedMockQA || mockQA;

  const testCaseIdToQA: Record<string, string> = {};

  if (qaAllocationsMap && Array.isArray(qaAllocationsMap.allocations)) {
    qaAllocationsMap.allocations.forEach((alloc: any) => {
      alloc.testCaseIds.forEach((tcId: string) => {
        const qa =
          effectiveQA &&
          effectiveQA.find(
            (q: any) => q.id === alloc.qaId || q.name === alloc.qaName,
          );

        testCaseIdToQA[tcId] = qa ? qa.name : alloc.qaName || alloc.qaId;
      });
    });
  }

  const [filteredTestCases, setFilteredTestCases] = useState<any[]>([]);

  useEffect(() => {
    if (selectedProject && selectedRelease) {
      const saved = getSavedExecutionStatuses(selectedProject, selectedRelease);

      setExecutionStatuses(
        saved as Record<string, TestCase["executionStatus"]>,
      );
    } else {
      setExecutionStatuses({});
    }
  }, [selectedProject, selectedRelease]);

  const [moduleTestCaseCounts, setModuleTestCaseCounts] = useState<{
    [key: string]: number;
  }>({});

  const [submoduleTestCaseCounts, setSubmoduleTestCaseCounts] = useState<{
    [key: string]: number;
  }>({});

  const [countsLoading, setCountsLoading] = useState(false);

  const [testCasesLoading, setTestCasesLoading] = useState(false);

//   useEffect(() => {
//     const fetchModuleTestCaseCounts = async () => {
//       if (selectedProject && selectedRelease && modules.length > 0) {
//         setCountsLoading(true);

//         const counts: { [key: string]: number } = {};

//         try {
//           for (const module of modules) {
//             const testCases = await getTestCasesByFilter({
//               projectId: parseInt(selectedProject),

//               releaseId: parseInt(selectedRelease),

//               moduleId: module.id,
//             });
// counts[module.moduleName || module.name] = testCases.length;
//           }

//           setModuleTestCaseCounts(counts);
//         } catch (err: any) {
// setModuleTestCaseCounts({});
//         } finally {
//           setCountsLoading(false);
//         }
//       }
//     };

//     fetchModuleTestCaseCounts();
//   }, [selectedProject, selectedRelease, modules]);

useEffect(() => {
  const fetchTestCaseCounts = async () => {
    if (!selectedProject || !selectedRelease || modules.length === 0) {
      setModuleTestCaseCounts({});
      setSubmoduleTestCaseCounts({});
      return;
    }

    setCountsLoading(true);

    try {
      const moduleCounts: { [key: string]: number } = {};

      for (const module of modules) {
        const moduleId = module.id ?? module.moduleId;
        if (!moduleId) continue;

        const testCases = await getTestCasesByFilter({
          projectId: Number(selectedProject),
          releaseId: Number(selectedRelease),
          moduleId: Number(moduleId),
        });

        console.log("RAW TEST CASE RESPONSE:", testCases);

        const moduleName = module.moduleName || module.name;
        if (moduleName) {
          moduleCounts[moduleName] = Array.isArray(testCases) ? testCases.length : 0;
        }
      }

      setModuleTestCaseCounts(moduleCounts);

      if (!selectedModule || submodules.length === 0) {
        setSubmoduleTestCaseCounts({});
        return;
      }

      const selectedModuleObj = modules.find(
        (m: any) => (m.moduleName || m.name) === selectedModule,
      );
      const selectedModuleId = selectedModuleObj?.id ?? selectedModuleObj?.moduleId;

      if (!selectedModuleId) {
        setSubmoduleTestCaseCounts({});
        return;
      }

      const submoduleCounts: { [key: string]: number } = {};

      for (const submodule of submodules) {
        const submoduleId = submodule.id ?? submodule.subModuleId;
        if (!submoduleId) continue;

        const testCases = await getTestCasesByFilter({
          projectId: Number(selectedProject),
          releaseId: Number(selectedRelease),
          moduleId: Number(selectedModuleId),
          subModuleId: Number(submoduleId),
        });

        const submoduleName = submodule.subModuleName || submodule.name;
        if (submoduleName) {
          if (allocatedTestCaseIds.length > 0) {
            const allocatedTestCases = testCases.filter(isAllocatedTestCase);
            submoduleCounts[submoduleName] = allocatedTestCases.length;
          } else {
            submoduleCounts[submoduleName] = Array.isArray(testCases) ? testCases.length : 0;
          }
        }
      }

      setSubmoduleTestCaseCounts(submoduleCounts);
    } catch (err) {
      console.error("Failed to fetch test case counts:", err);
      setModuleTestCaseCounts({});
      setSubmoduleTestCaseCounts({});
    } finally {
      setCountsLoading(false);
    }
  };

  fetchTestCaseCounts();
}, [
  selectedProject,
  selectedRelease,
  selectedModule,
  submodules,
  modules,
  allocatedTestCaseIds,
]);

 useEffect(() => {
  if (selectedProject) {
    setReleaseLoading(true);
    setReleaseError("");
    setReleaseTestCaseCounts({});

    projectReleaseCardView(selectedProject)
      .then((releasesRes) => {
        const releaseList = Array.isArray(releasesRes)
          ? releasesRes
          : releasesRes?.data || [];

        // const filtered = releaseList.filter(
        //   (r: any) =>
        //     String(r.project_id) === String(selectedProject) ||
        //     String(r.projectId) === String(selectedProject),
        // );

        const filtered = releaseList;

        setProjectReleaseCard(filtered);

        const releaseIds = filtered
          .map((r: any) => r.id || r.releaseId)
          .filter((id: any) => id != null)
          .map(Number);

        if (releaseIds.length > 0) {
          getReleaseTestCaseCountsLoad(releaseIds)
            .then((countsRes) => {
              const countsData = Array.isArray(countsRes)
                ? countsRes
                : countsRes?.data || [];

              const countsMap: { [key: string]: number } = {};

              countsData.forEach((item: any) => {
                const releaseId = item.releaseId;

                if (
                  releaseId != null &&
                  typeof item.testCaseCount === "number"
                ) {
                  countsMap[String(releaseId)] = item.testCaseCount;
                }
              });

              setReleaseTestCaseCounts(countsMap);
            })
            .catch(() => {
              setReleaseTestCaseCounts({});
            })
            .finally(() => {
              setReleaseLoading(false);
            });
        } else {
          setReleaseTestCaseCounts({});
          setReleaseLoading(false);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch releases:", error);
        setReleaseError("Failed to fetch releases. Please try again.");
        setProjectReleaseCard([]);
        setReleaseTestCaseCounts({});
        setReleaseLoading(false);
      });
  } else {
    setProjectReleaseCard([]);
    setReleaseTestCaseCounts({});
    setReleaseLoading(false);
  }
}, [selectedProject]);

  useEffect(() => {
    getDefectTypes()
      .then((res) => {
setDefectTypes(res.data.content);
      })

      .catch((error) => {
setDefectTypes([]);
      });
  }, []);

  useEffect(() => {
  getAllPriorities()
    .then((res) => {
      console.log("PRIORITIES RESPONSE:", res);

      setPriorities(res.data.content || []);
    })
    .catch((error) => {
      console.error("Failed to load priorities:", error);
      setPriorities([]);
    });
}, []);

  useEffect(() => {
    getAllDefectStatuses()
      .then((res) => {
setDefectStatuses(res.data);
      })

      .catch((error) => {
setDefectStatuses([]);
      });
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setAllocatedUsers([]);
      return;
    }

    setAllocatedUsersLoading(true);

    getUsersByModuleSubmoduleAllocation(parseInt(selectedProject))
      .then((response: any) => {
let dataArray: any[] = [];

        if (Array.isArray(response)) {
          dataArray = response;
        } else if (Array.isArray(response?.data)) {
          dataArray = response.data;
        } else if (Array.isArray(response?.data?.data)) {
          dataArray = response.data.data;
        } else if (Array.isArray(response?.content)) {
          dataArray = response.content;
        }


        const filtered = dataArray.filter((emp: any) => {
          const roleType = (emp.roleType || "").toString().toUpperCase().trim();
return DEV_ROLE_TYPES.includes(roleType);
        });
const mapped = filtered.map((emp: any) => ({
          userId: emp.employeeId || emp.userId || emp.id,
          userName:
            emp.firstName && emp.lastName
              ? `${emp.firstName} ${emp.lastName}`.trim()
              : emp.userName || emp.name || "Unknown User",
          userRole: emp.roleName || emp.role || "",
          userWithRole: emp.employeeName || emp.userName || emp.name || "",
        }));

        setAllocatedUsers(mapped);
      })
      .catch((error: any) => {
setAllocatedUsers([]);
      })
      .finally(() => {
        setAllocatedUsersLoading(false);
      });
  }, [selectedProject]);
  useEffect(() => {
    const savedMapping = localStorage.getItem("testCaseDefectMapping");

    if (savedMapping) {
      try {
        const parsedMapping = JSON.parse(savedMapping);
setLocalTestCaseDefectMap(parsedMapping);

        setTestCaseDefectMap(parsedMapping);
      } catch (error) {
}
    }

    const savedAssignments = localStorage.getItem("defectAssignments");

    if (savedAssignments) {
      try {
        const parsedAssignments = JSON.parse(savedAssignments);
setDefectAssignments(parsedAssignments);
      } catch (error) {
}
    }
  }, []);

  useEffect(() => {
    if (Object.keys(testCaseDefectMap).length > 0) {
setLocalTestCaseDefectMap(testCaseDefectMap);

      localStorage.setItem(
        "testCaseDefectMapping",
        JSON.stringify(testCaseDefectMap),
      );
    }
  }, [testCaseDefectMap]);

  useEffect(() => {
    return () => {
      setLocalTestCaseDefectMap({});

      setDefectAssignments({});

      setPendingStatusUpdate(null);
};
  }, []);

  useEffect(() => {
    const fetchExistingDefects = async () => {
      if (selectedProject) {
        setDefectsLoading(true);

        try {
const defects = await filterDefectsForTest({
            projectId: String(selectedProject),
            releaseId: selectedRelease ? parseInt(selectedRelease) : undefined,
          });


          defects.forEach((defect: any, index: number) => {
});

          setExistingDefects(Array.isArray(defects) ? defects : []);
const extractReleaseTestCaseIdFromDefect = (defect: any) =>
            defect.testCaseId ||
            defect.ReleaseTestCaseId ||
            defect.releaseTestCaseId ||
            defect.ReleaseTestCaseID ||
            defect.release_testcase_id ||
            defect.release_test_case_id ||
            defect.test_case_id;

          const defectMappings: { [key: string]: string } = {};

          const defectUserAssignments: { [key: string]: string } = {};

          defects.forEach((defect: any) => {

  // ============================================================
  // ACTUAL TEST CASE DB ID
  // ============================================================
  let testCaseId = defect.testCaseId;

  // ============================================================
  // FALLBACK MATCHING
  // Only use this when backend does not provide testCaseId
  // ============================================================
  if (
    !testCaseId &&
    (defect.module_name || defect.moduleName) &&
    (defect.sub_module_name || defect.subModuleName)
  ) {
    const matchingTestCase = filteredTestCases.find((tc: any) => {

      const tcModule =
        tc.module || tc.moduleName;

      const tcSubmodule =
        tc.subModule || tc.subModuleName;

      const dModule =
        defect.module_name || defect.moduleName;

      const dSub =
        defect.sub_module_name || defect.subModuleName;

      const dDesc =
        defect.description ||
        defect.release_test_case_description;

      const moduleMatch =
        tcModule === dModule;

      const submoduleMatch =
        tcSubmodule === dSub;

      const descMatch =
        tc.description === dDesc ||
        tc.description ===
          defect.release_test_case_description ||
        (
          dDesc &&
          tc.description &&
          (
            dDesc
              .toLowerCase()
              .includes(tc.description.toLowerCase()) ||

            tc.description
              .toLowerCase()
              .includes(dDesc.toLowerCase())
          )
        );

      return (
        moduleMatch &&
        submoduleMatch &&
        descMatch
      );
    });

    if (matchingTestCase) {
      testCaseId =
        matchingTestCase.testCaseId ??
        matchingTestCase.id;
    }
  }

  // ============================================================
  // CREATE TEST CASE -> DEFECT MAPPING
  // ============================================================
  if (
    testCaseId &&
    defect.projectDefectNumber != null
  ) {

    // IMPORTANT:
    // UI Defect No MUST be projectDefectNumber
    const defectNumber =
      String(defect.projectDefectNumber);

    defectMappings[String(testCaseId)] =
      defectNumber;

    // ============================================================
    // ASSIGNED USER
    // ============================================================
    if (
      defect.assigned_to_name ||
      defect.assignedToName
    ) {
      defectUserAssignments[defectNumber] =
        defect.assigned_to_name ||
        defect.assignedToName;
    }
  }
});

          if (Object.keys(defectMappings).length > 0) {
setTestCaseDefectMap((prev: any) => {
              const merged = { ...(prev || {}), ...defectMappings };

              setLocalTestCaseDefectMap(merged);

              localStorage.setItem(
                "testCaseDefectMapping",
                JSON.stringify(merged),
              );

              return merged;
            });
          }


          setDefectAssignments((prev) => {
            const merged = { ...(prev || {}), ...defectUserAssignments };

            localStorage.setItem("defectAssignments", JSON.stringify(merged));
return merged;
          });
        } catch (error: any) {
          setExistingDefects([]);
        } finally {
          setDefectsLoading(false);
        }
      } else {
        setExistingDefects([]);
      }
    };

    fetchExistingDefects();
  }, [selectedProject, selectedRelease, filteredTestCases]);

  useEffect(() => {
    if (selectedProject && selectedRelease && filteredTestCases.length > 0) {
      const timer = setTimeout(() => {
        refreshDefectData(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [selectedProject, selectedRelease, filteredTestCases.length]);

  useEffect(() => {
    if (selectedProject && selectedRelease) {
      const interval = setInterval(() => {
        if (filteredTestCases.length > 0) {
          refreshDefectData(false);
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [selectedProject, selectedRelease, filteredTestCases.length]);

  const safeReleases = Array.isArray(projectReleaseCard)
    ? projectReleaseCard
    : [];

  const projectReleases = safeReleases.filter(
    (r: any) =>
      String(r.project_id) === String(selectedProject) ||
      String(r.projectId) === String(selectedProject),
  );

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);

    setSelectedProjectId(projectId);

    setSelectedRelease(null);

    setSelectedModule("");

    setSelectedSubmodule("");
    setSubmodules([]);
    setSubmoduleTestCaseCounts({});
    setModuleTestCaseCounts({});
    setFilteredTestCases([]);

    setTestCaseDefectMap({});

    setLocalTestCaseDefectMap({});

    setDefectAssignments({});

    setPendingStatusUpdate(null);
localStorage.removeItem("testCaseDefectMapping");

    localStorage.removeItem("defectAssignments");
  };

//   const handleReleaseSelect = (releaseId: string) => {
//     setSelectedRelease(releaseId);

//     setSelectedModule("");

//     setSelectedSubmodule("");

//     setSubmodules([]);
//     setSubmoduleTestCaseCounts({});
//     setModuleTestCaseCounts({});
//     setFilteredTestCases([]);

//     setTestCaseDefectMap({});

//     setLocalTestCaseDefectMap({});

//     setDefectAssignments({});

//     setPendingStatusUpdate(null);
// localStorage.removeItem("testCaseDefectMapping");

//     localStorage.removeItem("defectAssignments");
//   };

const handleReleaseSelect = (releaseId: string) => {
  setSelectedRelease(releaseId);

  setSelectedModule("");
  setSelectedSubmodule("");

  setSubmodules([]);
  setSubmoduleTestCaseCounts({});
  setModuleTestCaseCounts({});
  setFilteredTestCases([]);

  setTestCaseDefectMap({});
  setLocalTestCaseDefectMap({});
  setDefectAssignments({});
  setPendingStatusUpdate(null);

  localStorage.removeItem("testCaseDefectMapping");
  localStorage.removeItem("defectAssignments");
};

// const mapReleaseTestCase = (tc: any): TestCase => {
//   console.log("RAW RELEASE TEST CASE:", tc);
// console.log(
//   "RAW RELEASE TEST CASE FULL:",
//   JSON.stringify(tc, null, 2)
// );
//   return {
//     ...tc,

//     backendId: tc.releaseTestCaseId,
//     releaseTestCaseId: tc.releaseTestCaseId,

//     id: String(tc.testCaseId),
//     testCaseId: tc.testCaseId,
//     no: String(
//   tc.testCaseNumber != null
//     ? tc.testCaseNumber
//     : tc.testCaseId
// ),

//     description: tc.description || "-",
//     steps: tc.testSteps || "",

//     module:
//       tc.module ||
//       tc.moduleName ||
//       tc.module_name ||
//       tc.module?.name ||
//       tc.module?.moduleName ||
//       "",

//     subModule:
//       tc.subModule ||
//       tc.subModuleName ||
//       tc.sub_module_name ||
//       tc.subModule?.name ||
//       tc.subModule?.subModuleName ||
//       "",

//     moduleId:
//       tc.moduleId ||
//       tc.module_id ||
//       tc.module?.id,
      

//     subModuleId:
//       tc.subModuleId ||
//       tc.sub_module_id ||
//       tc.subModule?.id,

//    type:
//   tc.defectTypeName ||
//   tc.defect_type_name ||
//   defectTypes.find(
//     (dt) => Number(dt.id) === Number(tc.defectTypeId)
//   )?.defectTypeName ||
//   tc.type ||
//   "",

//     severity:
//       tc.severityName?.toLowerCase() || "medium",

//     executionStatus:
//       tc.passOrFail === "pass"
//         ? "passed"
//         : tc.passOrFail === "fail"
//         ? "failed"
//         : "not-started",

//     // Defect
//     defectId: tc.defectId ?? null,

//     // Priority
//     priorityId: tc.priorityId ?? null,
//     priority: tc.priorityName ?? null,

//     // QA Executor
//     employeeId: tc.employeeId ?? null,
//     employeeName: tc.employeeName ?? "",

//     // Assigned Developer
//     assignToId: tc.assignToId ?? null,
//     assignToName: tc.assignToName ?? "",

//     benchAllocationId: tc.benchAllocationId,

//     rawReleaseTestCase: tc,
//   };
// };


const mapReleaseTestCase = (tc: any): TestCase => {
  return {
    ...tc,

    // Release Test Case ID
    backendId: tc.releaseTestCaseId,
    releaseTestCaseId: tc.releaseTestCaseId,

    // Actual Test Case DB ID
    id: String(tc.testCaseId),
    testCaseId: tc.testCaseId,

    // Project-wise Test Case Number
    testCaseNumber: tc.testCaseNumber,

    // Display number
    no:
      tc.testCaseNumber != null
        ? String(tc.testCaseNumber)
        : "",

    description: tc.description || "-",
    steps: tc.testSteps || "",

    severity: tc.severityName || "",
    priority: tc.priorityName || "",
    type: tc.defectTypeName || "",

    moduleId: tc.moduleId,
    moduleName: tc.moduleName || "",

    subModuleId: tc.subModuleId,
    subModuleName: tc.subModuleName || "",

    passOrFail: tc.passOrFail,
    status: tc.status,

    defectId: tc.defectId,
    projectDefectNumber: tc.projectDefectNumber,

    assignToId: tc.assignToId,
    assignToName: tc.assignToName,
    employeeId: tc.employeeId,
    employeeName: tc.employeeName,
    benchAllocationId: tc.benchAllocationId,
  };
};

  const handleModuleSelect = async (moduleName: string) => {
    skipEffectUntilRef.current = Date.now() + 5000;

    setSelectedModule(moduleName);
    setSelectedSubmodule("");
    setFilteredTestCases([]);
    setExecutionStatuses({});

    try {
      const moduleObj = modules.find(
        (m: any) => (m.moduleName || m.name) === moduleName,
      );

      if (!moduleObj) {
        setSubmodules([]);
        return;
      }

      const submods = Array.isArray(moduleObj.subModules) ? moduleObj.subModules : [];
      setSubmodules(submods);

      if (!selectedProject || !selectedRelease) {
        return;
      }

      setTestCasesLoading(true);

      const moduleId = moduleObj.id ?? moduleObj.moduleId;
      if (!moduleId) {
        setFilteredTestCases([]);
        return;
      }

      const testCases = await getTestCasesByFilter({
        projectId: Number(selectedProject),
        releaseId: Number(selectedRelease),
        moduleId: Number(moduleId),
      });

      console.log("API test cases:", testCases);

      const mappedTestCases = testCases
        .map(mapReleaseTestCase)
        .filter(isAllocatedTestCase);
      console.log(
  "MAPPED TEST CASES:",
  mappedTestCases.map((tc: any) => ({
    testCaseId: tc.testCaseId,
    testCaseNumber: tc.testCaseNumber,
    no: tc.no,
    releaseTestCaseId: tc.releaseTestCaseId,
  }))
);
      setFilteredTestCases(mappedTestCases);

      const databaseStatuses: {
        [key: string]: TestCase["executionStatus"];
      } = {};

      mappedTestCases.forEach((tc: TestCase) => {
        if (tc.executionStatus && tc.executionStatus !== "not-started") {
          databaseStatuses[tc.id] = tc.executionStatus;
        }
      });

      setExecutionStatuses(databaseStatuses);
    } catch (error: any) {
      console.error("Failed to fetch test cases:", error);
      setFilteredTestCases([]);
    } finally {
      setTestCasesLoading(false);
      setSubmodulesLoading(false);
    }
  };

  const handleSubmoduleSelect = async (submoduleName: string) => {
  skipEffectUntilRef.current = Date.now() + 5000;

  setSelectedSubmodule(submoduleName);
  setFilteredTestCases([]);
  setExecutionStatuses({});

    const moduleObj = modules.find((m: any) =>
       (m.moduleName || m.name) === selectedModule);

    const submoduleObj = submodules.find((s: any) => 
      (s.subModuleName || s.name) === submoduleName);

  console.log("Selected module:", moduleObj);
  console.log("Selected submodule:", submoduleObj);

  const moduleId = moduleObj?.moduleId ?? moduleObj?.id;
  const subModuleId = submoduleObj?.subModuleId ?? submoduleObj?.id;

  if (!moduleId || !subModuleId) {
    console.error("Module or submodule not found");
    return;
  }

  if (!selectedProject || !selectedRelease) {
    return;
  }

  try {
    setTestCasesLoading(true);

  const testCases = await getTestCasesByFilter({
  projectId: Number(selectedProject),
  releaseId: Number(selectedRelease),
  moduleId: Number(moduleId),
  subModuleId: Number(subModuleId),
});

    console.log("Submodule API test cases:", testCases);

    const mappedTestCases = testCases
      .map(mapReleaseTestCase)
      .filter(isAllocatedTestCase);

    console.log(
  "Mapped test cases:",
  mappedTestCases.map((tc: any) => ({
    id: tc.id,
    testCaseId: tc.testCaseId,
    testCaseNumber: tc.testCaseNumber,
    no: tc.no,
  }))
);

    setFilteredTestCases(mappedTestCases);

    const databaseStatuses: {
      [key: string]: TestCase["executionStatus"];
    } = {};

    mappedTestCases.forEach((tc: TestCase) => {
      if (
        tc.executionStatus &&
        tc.executionStatus !== "not-started"
      ) {
        databaseStatuses[tc.id] = tc.executionStatus;
      }
    });

    setExecutionStatuses(databaseStatuses);

  } catch (error: any) {
    console.error(
      "Failed to fetch submodule test cases:",
      error
    );

    setFilteredTestCases([]);
  } finally {
    setTestCasesLoading(false);
  }
};

  useEffect(() => {
  const loadReleaseAllocations = async () => {
    if (!selectedRelease) {
      setAllocatedTestCaseIds([]);
      return;
    }

    try {
      const allocations = await getReleaseTestCases(
        Number(selectedRelease),
      );

      const ids = allocations
  .map((item: any) => Number(item.testCaseId))
  .filter((id: number) => !Number.isNaN(id));

setAllocatedTestCaseIds(ids);

      console.log("Allocated Test Case IDs:", ids);
    } catch (error) {
      console.error(
        "Failed to load release test case allocations:",
        error,
      );

      setAllocatedTestCaseIds([]);
    }
  };

  loadReleaseAllocations();
}, [selectedRelease]);

  useEffect(() => {
    if (Date.now() < skipEffectUntilRef.current) {
      return;
    }

  const fetchTestCases = async () => {
  setFilteredTestCases([]);

  if (selectedProject && selectedRelease && selectedModule) {
    setTestCasesLoading(true);

    try {
      const moduleObj = modules.find(
        (m: any) =>
          (m.moduleName || m.name) === selectedModule
      );

      const submoduleObj = selectedSubmodule
        ? submodules.find(
            (s: any) =>
              (s.subModuleName || s.name) === selectedSubmodule
          )
        : null;

      // ============================================================
      // IMPORTANT
      // ============================================================
      // API call is handled by:
      // handleModuleSelect()
      // handleSubmoduleSelect()
      //
      // So DON'T call getTestCasesByFilter() here.
      // This prevents duplicate API calls.
      // ============================================================

      console.log(
        "🔥 fetchTestCases skipped API call"
      );

      // ============================================================
      // Do not process testCases here
      // ============================================================
      // The selected module/submodule handlers are responsible
      // for setting filteredTestCases.
      // ============================================================

    } catch (err: any) {

      setFilteredTestCases([]);

      setModulesError(
        err.message || "Failed to fetch test cases"
      );

    } finally {

      setTestCasesLoading(false);
    }
  }
};

    fetchTestCases();
  }, [
    selectedProject,
    selectedRelease,
    selectedModule,
    selectedSubmodule,
    modules,
    submodules,
  ]);

  const refreshDefectData = async (showToast: boolean = true) => {
    if (selectedProject) {
      try {
        setDefectsLoading(true);

        const defects = await filterDefectsForTest({
          projectId: String(selectedProject),
          releaseId: selectedRelease ? parseInt(selectedRelease) : undefined,
        });

        setExistingDefects(Array.isArray(defects) ? defects : []);

        const defectMappings: { [key: string]: string } = {};

        const defectUserAssignments: { [key: string]: string } = {};

//         defects.forEach((defect: any) => {
//           let testCaseId =
//             defect.testCaseId ||
//             defect.ReleaseTestCaseId ||
//             defect.releaseTestCaseId;
// if (
//             !testCaseId &&
//             (defect.module_name || defect.moduleName) &&
//             (defect.sub_module_name || defect.subModuleName)
//           ) {
//             const matchingTestCase = filteredTestCases.find((tc: any) => {
//               const tcModule = tc.module || tc.moduleName;

//               const tcSubmodule = tc.subModule || tc.subModuleName;

//               const dModule = defect.module_name || defect.moduleName;

//               const dSub = defect.sub_module_name || defect.subModuleName;

//               const dDesc =
//                 defect.description || defect.release_test_case_description;

//               const moduleMatch = tcModule === dModule;

//               const submoduleMatch = tcSubmodule === dSub;

//               const descMatch =
//                 tc.description === dDesc ||
//                 tc.description === defect.release_test_case_description ||
//                 (dDesc &&
//                   tc.description &&
//                   (dDesc.toLowerCase().includes(tc.description.toLowerCase()) ||
//                     tc.description
//                       .toLowerCase()
//                       .includes(dDesc.toLowerCase())));
// return moduleMatch && submoduleMatch && descMatch;
//             });

//             if (matchingTestCase) {
//               testCaseId = matchingTestCase.id;
// }
//           }

//           if (testCaseId && defect.defectId != null) {
//   const defectId = String(defect.defectId);

//   defectMappings[String(testCaseId)] = defectId;

//   if (defect.assigned_to_name || defect.assignedToName) {
//     defectUserAssignments[defectId] =
//       defect.assigned_to_name || defect.assignedToName;
//   }
// }
//         });

defects.forEach((defect: any) => {
  let testCaseId = defect.testCaseId;

  if (
    !testCaseId &&
    (defect.module_name || defect.moduleName) &&
    (defect.sub_module_name || defect.subModuleName)
  ) {
    const matchingTestCase = filteredTestCases.find((tc: any) => {
      const tcModule = tc.module || tc.moduleName;
      const tcSubmodule = tc.subModule || tc.subModuleName;

      const dModule = defect.module_name || defect.moduleName;
      const dSub = defect.sub_module_name || defect.subModuleName;

      const dDesc =
        defect.description || defect.release_test_case_description;

      const moduleMatch = tcModule === dModule;
      const submoduleMatch = tcSubmodule === dSub;

      const descMatch =
        tc.description === dDesc ||
        tc.description === defect.release_test_case_description ||
        (dDesc &&
          tc.description &&
          (dDesc.toLowerCase().includes(tc.description.toLowerCase()) ||
            tc.description.toLowerCase().includes(dDesc.toLowerCase())));

      return moduleMatch && submoduleMatch && descMatch;
    });

    if (matchingTestCase) {
      testCaseId =
        matchingTestCase.testCaseId ?? matchingTestCase.id;
    }
  }

  if (testCaseId && defect.projectDefectNumber != null) {
    const defectId = String(defect.projectDefectNumber);

    defectMappings[String(testCaseId)] = defectId;

    if (defect.assigned_to_name || defect.assignedToName) {
      defectUserAssignments[defectId] =
        defect.assigned_to_name || defect.assignedToName;
    }
  }
});

        if (Object.keys(defectMappings).length > 0) {
setTestCaseDefectMap((prev: any) => {
            const merged = { ...(prev || {}), ...defectMappings };

            setLocalTestCaseDefectMap(merged);

            localStorage.setItem(
              "testCaseDefectMapping",
              JSON.stringify(merged),
            );

            return merged;
          });
        }

        if (Object.keys(defectUserAssignments).length > 0) {
setDefectAssignments((prev) => {
            const merged = { ...(prev || {}), ...defectUserAssignments };

            localStorage.setItem("defectAssignments", JSON.stringify(merged));

            return merged;
          });
        }

        if (showToast) {
          setToast({
            isOpen: true,

            message: "Defect data refreshed successfully!",

            type: "success",
          });
        }
      } catch (error: any) {
if (showToast) {
          setToast({
            isOpen: true,

            message: "Failed to refresh defect data",

            type: "error",
          });
        }
      } finally {
        setDefectsLoading(false);
      }
    }
  };

  const handleExecutionStatusChange = (
    testCaseId: string,

    status: TestCase["executionStatus"],
  ) => {
    setExecutionStatuses((prev) => {
      const updated = { ...prev, [testCaseId]: status };

      if (selectedProject && selectedRelease) {
        persistExecutionStatus(
          selectedProject,

          selectedRelease,

          testCaseId,

          status as ExecutionStatus,
        );
      }

      return updated;
    });
  };

  const getDefaultPriorityId = (): number => {
    const medium = priorities.find(
      (p) => (p.name || "").toLowerCase() === "medium",
    );

    return medium?.id || priorities[0]?.id || 1;
  };

  const getDefaultDefectStatusId = (): number => {
    const newStatus = defectStatuses.find(
      (s) => (s.defectStatusName || "").toLowerCase() === "new",
    );

    return newStatus?.id || defectStatuses[0]?.id || 3;
  };

  const getReleaseTestCaseId = (tc: any): string | number => {
    if (tc && tc.backendId != null) return tc.backendId;
    return tc?.releaseTestCaseId || tc?.ReleaseTestCaseId;
  };

  const persistStatusToBackend = async (
    tc: any,
    status: TestCase["executionStatus"],
  ) => {
    if (!tc) {
return;
    }

    if (status !== "passed" && status !== "failed") {
return;
    }

    try {
      const releaseTestCaseId = getReleaseTestCaseId(tc);

      if (!releaseTestCaseId) {
setToast({
          isOpen: true,
          message: "Cannot update status: Missing release test case ID",
          type: "error",
        });

        return;
      }
      if (!selectedRelease) {
        throw new Error("Cannot update status: Missing release ID");
      }

      await updateReleaseTestCaseStatus(
        Number(selectedRelease),
        Number(releaseTestCaseId),
        status === "passed" ? "PASS" : "FAIL",
      );
setToast({
        isOpen: true,

        message: `Test case ${tc.id} status updated to ${status}`,

        type: "success",
      });
    } catch (e: any) {
setToast({
        isOpen: true,

        message: `Failed to update status for ${tc.id}: ${e?.message || "Unknown error"}`,

        type: "error",
      });
    }
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

  const getSeverityColor = (severityName: string | undefined | null) => {
    if (!severityName) return "bg-gray-100 text-gray-800";

    const severity = severities.find(
      (s) => s.name.toLowerCase() === severityName.toLowerCase(),
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

  const getExecutionStatusColor = (status: TestCase["executionStatus"]) => {
    switch (status) {
      case "passed":
        return "bg-green-100 text-green-800";

      case "failed":
        return "bg-red-100 text-red-800";

      case "in-progress":

        return "bg-blue-100 text-blue-800";

      case "blocked":
        return "bg-yellow-100 text-yellow-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewSteps = (testCase: TestCase) => {
    setViewingTestCase(testCase);

    setIsViewStepsModalOpen(true);
  };

  const handleViewTestCase = (testCase: TestCase) => {
  console.log("VIEW TEST CASE DATA:", testCase);
  console.log("MODULE:", testCase.module);
  console.log("SUBMODULE:", testCase.subModule);

  setViewingTestCase(testCase);
  setIsViewTestCaseModalOpen(true);
};

//   const getNextDefectId = () => {
//   const projectDefects = defects.filter(
//     (d) => Number(d.projectId) === Number(selectedProject)
//   );

//   const ids = projectDefects
//     .map((d) => Number(d.defectId))
//     .filter((id) => !isNaN(id));

//   return ids.length > 0 ? Math.max(...ids) + 1 : 1;
// };

  const formatTestCaseId = (id: string | number): string => {
    const idStr = String(id);

    if (idStr.includes("TC")) {
      const numericMatch = idStr.match(/\d+$/);

      if (numericMatch) {
        const numericId = numericMatch[0];

        return `TC${numericId}`;
      }
    }

    const numericMatch = idStr.match(/\d+/);

    if (numericMatch) {
      const numericId = numericMatch[0];

      return `TC${numericId}`;
    }

    return idStr;
  };

  const handleDefectInputChange = (field: string, value: string | number) => {
    setDefectFormData((prev) => ({ ...prev, [field]: value }));
  };

  const refreshCurrentTestCases = async () => {
  if (!selectedProject || !selectedRelease || !selectedModule) {
    return;
  }

  try {
    setTestCasesLoading(true);

    const moduleObj = modules.find(
      (m: any) =>
        (m.moduleName || m.name) === selectedModule
    );

    if (!moduleObj) return;

    const moduleId = moduleObj.moduleId ?? moduleObj.id;

    let testCases;

    if (selectedSubmodule) {
      const submoduleObj = submodules.find(
        (s: any) =>
          (s.subModuleName || s.name) === selectedSubmodule
      );

      if (!submoduleObj) return;

      const subModuleId =
        submoduleObj.subModuleId ?? submoduleObj.id;

      testCases = await getTestCasesByFilter({
        projectId: Number(selectedProject),
        releaseId: Number(selectedRelease),
        moduleId: Number(moduleId),
        subModuleId: Number(subModuleId),
      });
    } else {
      testCases = await getTestCasesByFilter({
        projectId: Number(selectedProject),
        releaseId: Number(selectedRelease),
        moduleId: Number(moduleId),
      });
    }

    const mappedTestCases = testCases
      .map(mapReleaseTestCase)
      .filter(isAllocatedTestCase);

    setFilteredTestCases(mappedTestCases);

    const databaseStatuses: {
      [key: string]: TestCase["executionStatus"];
    } = {};

    mappedTestCases.forEach((tc: TestCase) => {
      if (
        tc.executionStatus &&
        tc.executionStatus !== "not-started"
      ) {
        databaseStatuses[tc.id] = tc.executionStatus;
      }
    });

    setExecutionStatuses(databaseStatuses);

    console.log(
      "✅ Test Execution data refreshed:",
      mappedTestCases
    );

  } catch (error) {
    console.error(
      "❌ Failed to refresh Test Execution data:",
      error
    );
  } finally {
    setTestCasesLoading(false);
  }
};

  const handleDefectFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDefectSubmitting(true);

    try {
      const tc = pendingStatusUpdate?.testCase ?? pendingTestCaseRef.current;
      if (!tc) throw new Error("No test case selected.");

      const priorityObj = priorities.find(
        (p) => Number(p.priorityId) === Number(defectFormData.priorityId)
      );

      if (!priorityObj) {
        throw new Error("Please select a valid priority.");
      }
      if (!defectFormData.assignedTo || defectFormData.assignedTo === 0) {
        throw new Error("Please select an assigned user.");
      }

      console.log("Selected test case:", tc);
console.log("Release ID:", selectedRelease);
console.log("backendId:", tc.backendId);
console.log("testCase id:", tc.id);

      const releaseTestCaseId = Number(
  tc.releaseTestCaseId ?? tc.backendId
);
      const releaseId = Number(selectedRelease);

      if (!releaseTestCaseId || !releaseId) {
        throw new Error("Missing release or test case information.");
      }

      const formData = new FormData();



formData.append(
  "data",
  new Blob(
    [
      JSON.stringify({
        passOrFail: "FAIL",
        priorityId: Number(defectFormData.priorityId),
        assignedTo: Number(defectFormData.assignedTo),
      }),
    ],
    { type: "application/json" }
  )
);

const attachmentFile = (defectFormData as any).attachmentFile;

if (attachmentFile) {
  formData.append("attachmentFile", attachmentFile);
}



console.log("Sending status data:", {
  passOrFail: "FAIL",
  priorityId: Number(defectFormData.priorityId),
  assignedTo: Number(defectFormData.assignedTo),
  releaseId,
  releaseTestCaseId,
});

const response = await updateReleaseTestCaseStatusWithImage(
  releaseId,
  releaseTestCaseId,
  formData
);
console.log("Status update response:", response);

console.log(
  "FULL STATUS UPDATE RESPONSE:",
  JSON.stringify(response, null, 2)
);

const defectNo = response?.data?.defectNo || null;
      const executerDefectName = response?.data?.assignedTo || null;
      const priorityName = response?.data?.priorityName || null;

      setFilteredTestCases((prev) =>
        prev.map((t) =>
          t.id === tc.id
            ? {
                ...t,
                executionStatus: "failed",
                defectId: defectNo,
                executerDefect: executerDefectName,
                priority: priorityName,
              }
            : t,
        ),
      );

      setExecutionStatuses((prev) => ({ ...prev, [tc.id]: "failed" }));
      if (selectedProject && selectedRelease) {
        persistExecutionStatus(
          selectedProject,
          selectedRelease,
          tc.id,
          "failed" as ExecutionStatus,
        );
      }

      await refreshCurrentTestCases();

      if (defectNo) {
        setTestCaseDefectMap((prev: any) => ({ ...prev, [tc.id]: defectNo }));
        if (executerDefectName) {
          setDefectAssignments((prev) => ({
            ...prev,
            [defectNo]: executerDefectName,
          }));
        }
      }

      setToast({
        isOpen: true,
        message: "Test case marked as failed and defect created!",
        type: "success",
      });
      setPendingStatusUpdate(null);
      pendingTestCaseRef.current = null;
      setPreviousStatusBeforeFail(null);
      setIsEditingDefect(false);
      setEditingDefect(null);
      setDefectFormData({
        title: "",
        description: "",
        module: "",
        subModule: "",
        type: "",
        priority: "",
        severity: "",
        status: "",
        projectId: projectId || "",
        releaseId: releaseId?.toString() || "",
        testCaseId: "",
        assignedTo: 0,
        reportedBy: "",
        rejectionComment: "",
        attachment: "",
        attachmentFile: null,
      });
    } catch (error: any) {
setToast({
        isOpen: true,
        message:
          error?.response?.data?.message ||
          error.message ||
          "Failed to update test case status.",
        type: "error",
      });
    } finally {
      setDefectSubmitting(false);
    }
  };

  const handleFailClick = async (testCase: any) => {
    const existingDefectId = testCaseDefectMap[testCase.id];
    let existingDefect = null;

    if (existingDefectId) {
      existingDefect = existingDefects.find(
        (d) => d.defectId === existingDefectId,
      );
}

    setIsEditingDefect(!!existingDefect);
    setEditingDefect(existingDefect);

    const mapTestCaseTypeToDefectType = (testCaseType: string) => {
      if (defectTypes.length > 0) {
        const testCaseTypeLower = (testCaseType || "").toLowerCase();
        let defectType = defectTypes.find((dt) =>
          (dt.defectTypeName || "").toLowerCase().includes(testCaseTypeLower),
        );
        if (
          !defectType &&
          (testCaseTypeLower === "functional" ||
            testCaseTypeLower === "regression" ||
            testCaseTypeLower === "smoke" ||
            testCaseTypeLower === "integration")
        ) {
          defectType = defectTypes.find(
            (dt) =>
              (dt.defectTypeName || "").toLowerCase().includes("functional") ||
              (dt.defectTypeName || "").toLowerCase().includes("bug"),
          );
        }
        if (defectType) {
          return defectType.defectTypeName;
        }
      }
      switch (testCaseType) {
        case "functional":
          return "Functional Bug";
        case "regression":
          return "Functional Bug";
        case "smoke":
          return "Functional Bug";
        case "integration":
          return "Functional Bug";
        default:
          return defectTypes.length > 0
            ? defectTypes[0]?.defectTypeName || "Bug"
            : "Bug";
      }
    };

    const moduleName =
      testCase.module ||
      testCase.moduleName ||
      selectedModule ||
      "Not specified";
    const submoduleName =
      testCase.subModule ||
      testCase.subModuleName ||
      selectedSubmodule ||
      "Not specified";
    const mappedDefectType = mapTestCaseTypeToDefectType(testCase.type);
    const pendingUpdate = {
      testCase: testCase,
      status: "failed",
    } as const;
    pendingTestCaseRef.current = testCase;
    setPendingStatusUpdate(pendingUpdate);

    if (existingDefect) {
      setDefectFormData({
        title: existingDefect.description || testCase.description,
        description: existingDefect.steps || testCase.steps,
        module:
          (existingDefect as any).module_name ||
          (existingDefect as any).moduleName ||
          moduleName,
        subModule:
          (existingDefect as any).submodule_name ||
          (existingDefect as any).subModuleName ||
          submoduleName,
        type:
          (existingDefect as any).defect_type_name ||

          
          (existingDefect as any).defectTypeName ||
          mappedDefectType,
        priority:
          (existingDefect as any).priority_name ||
          (existingDefect as any).priorityName ||
          "medium",
        severity:
          (existingDefect as any).severity_name ||
          (existingDefect as any).severityName ||
          testCase.severity ||
          "medium",
        status:
          (existingDefect as any).defect_status_name ||
          (existingDefect as any).status ||
          "NEW",
        projectId: String(selectedProject) || "",
        releaseId: selectedRelease || "",
        testCaseId: testCase.id,
        assignedTo: (existingDefect as any).assignedTo || 0,
        reportedBy:
          (existingDefect as any).assigned_by_name ||
          (existingDefect as any).assignedByName ||
          "",
        rejectionComment: (existingDefect as any).rejectionComment || "",
        attachment: (existingDefect as any).attachment || "",
        attachmentFile: (existingDefect as any).attachmentFile || null,
      });
    } else {
      setDefectFormData({
        title: testCase.description,
        description: testCase.steps,
        module: moduleName,
        subModule: submoduleName,
        type: testCase.defectTypeName || mappedDefectType,
        priority: "medium",
        severity: testCase.severity || "medium",
        status: "NEW",
        projectId: String(selectedProject) || "",
        releaseId: selectedRelease || "",
        testCaseId: testCase.id,
        assignedTo: 0,
        reportedBy: "",
        rejectionComment: "",
        attachment: "",
        attachmentFile: null as File | null,
      });
    }

    const subModuleId = testCase.subModuleId;
    const moduleId = testCase.moduleId;

    if (!moduleId || !subModuleId) {

      console.error("Missing module/submodule ID", {
        moduleId,
        subModuleId,
        testCase,
      });

      setDefectAllocatedUsers([]);
      setDefectAllocatedUsersLoading(true);
      setDefectModalOpen(testCase.id);
      return;
    }


      try {
  const response =
    await getAllSubmoduleAllocatedDevBySubmoduleId(
      moduleId,
      subModuleId
    );

  console.log("Submodule developers:", response);

  const developers = Array.isArray(response) ? response : [];

const mappedUsers = developers
  .map((item: any) => {
    const employee = item.employee;

    if (!employee?.empId) {
      return null;
    }

    return {
      userId: employee.empId,
      userName:
        `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
      empId: employee.empId,
      email: employee.email,
      designation: employee.designation?.designationName || "",
    };
  })
  .filter(Boolean);

console.log("Mapped defect assignees:", mappedUsers);

setDefectAllocatedUsers(mappedUsers);
} catch (error) {
  console.error(
    "Failed to load submodule allocated developers:",
    error
  );

  setDefectAllocatedUsers([]);
} finally {
  setDefectAllocatedUsersLoading(false);
}

setDefectModalOpen(testCase.id);
  };

  if (selectedRelease) {
    const currentRelease =
      releases && releases.find((r) => r.id === selectedRelease);

    const currentProject =
      projects && projects.find((p) => p.id === selectedProject);

    const allocatedIds = allocatedTestCasesMap[selectedRelease || ""] || [];

    let allocatedTestCases = effectiveTestCases.filter((tc: any) =>
      allocatedIds.includes(tc.id),
    );

    if (selectedModule) {
      allocatedTestCases = allocatedTestCases.filter(
        (tc: any) => tc.module === selectedModule,
      );
    }

    if (selectedSubmodule) {
      allocatedTestCases = allocatedTestCases.filter(
        (tc: any) =>
          tc.subModule === selectedSubmodule &&
          (!selectedModule || tc.module === selectedModule),
      );
    }

    const submodulesToShow = submodules;

    return (
      <div className="max-w-6xl mx-auto py-8">
        {}

        <div className="flex-none p-6 pb-4">
          <div className="flex justify-between items-center mb-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Test Execution
              </h1>

              <p className="text-sm text-gray-500">
                {currentProject?.name} - {currentRelease?.name}
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={() => setSelectedRelease(null)}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />

              <span>Back</span>
            </Button>
          </div>

          {}

          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Module Selection
              </h2>

              <div className="relative flex items-center">
                <button
                  onClick={() => {
                    const container = document.getElementById("module-scroll");

                    if (container) container.scrollLeft -= 200;
                  }}
                  className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 mr-2"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                {/* <div
                  id="module-scroll"
                  className="flex space-x-2 overflow-x-auto pb-2 scroll-smooth flex-1"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {countsLoading ? (
                    <span className="text-gray-400 px-4 py-2">
                      Loading test case counts...
                    </span>
                  ) : modules.length > 0 ? (
                    // modules.map((module) => {
                    //   const moduleTestCaseCount =
                    //     moduleTestCaseCounts[module.name] || 0;

                    //   return (
                    //     <Button
                    //       key={module.id}
                    //       variant={
                    //         selectedModule === module.name
                    //           ? "primary"
                    //           : "secondary"
                    //       }
                    //       onClick={() => handleModuleSelect(module.name)}
                    //       className="whitespace-nowrap m-2"
                    //     >
                    //       {module.name} ({moduleTestCaseCount})
                    //     </Button>
                    //   );
                    // })
                    modules.map((module: any) => 
  const moduleName =
  module.moduleName || module.name || "";

const moduleId =
  module.moduleId ?? module.id;

const moduleTestCaseCount =
  moduleTestCaseCounts[moduleName] || 0;

  return (
    <Button
      key={moduleId}
      variant={
        selectedModule === moduleName
          ? "primary"
          : "secondary"
      }
      onClick={() => handleModuleSelect(moduleName)}
      className="whitespace-nowrap m-2"
    >
      {moduleName} ({moduleTestCaseCount})
    </Button>
  );
})
                  ) : (
                    <span className="text-gray-400 px-4 py-2">
                      No modules found for this project.
                    </span>
                  )}
                </div> */}
                <div
                  id="module-scroll"
                  className="flex space-x-2 overflow-x-auto pb-2 scroll-smooth flex-1"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {countsLoading ? (
                    <span className="text-gray-400 px-4 py-2">
                      Loading test case counts...
                    </span>
                  ) : modules.length > 0 ? (
                    // modules.map((module) => {
                    //   const moduleTestCaseCount =
                    //     moduleTestCaseCounts[module.name] || 0;

                    //   return (
                    //     <Button
                    //       key={module.id}
                    //       variant={
                    //         selectedModule === module.name
                    //           ? "primary"
                    //           : "secondary"
                    //       }
                    //       onClick={() => handleModuleSelect(module.name)}
                    //       className="whitespace-nowrap m-2"
                    //     >
                    //       {module.name} ({moduleTestCaseCount})
                    //     </Button>
                    //   );
                    // })
                    modules.map((module: any) => {
  const moduleName =
  module.moduleName || module.name || "";

const moduleId =
  module.moduleId ?? module.id;

const moduleTestCaseCount =
  moduleTestCaseCounts[moduleName] || 0;

  return (
    <Button
      key={moduleId}
      variant={
        selectedModule === moduleName
          ? "primary"
          : "secondary"
      }
      onClick={() => handleModuleSelect(moduleName)}
      className="whitespace-nowrap m-2"
    >
      {moduleName} ({moduleTestCaseCount})
    </Button>
  );
})
                  ) : (
                    <span className="text-gray-400 px-4 py-2">
                      No modules found for this project.
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    const container = document.getElementById("module-scroll");

                    if (container) container.scrollLeft += 200;
                  }}
                  className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 ml-2"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </CardContent>
          </Card>

          {}

          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Submodule Selection
              </h2>

              <div className="relative flex items-center min-h-[44px]">
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
                  className="flex space-x-2 overflow-x-auto p-2 scroll-smooth flex-1"
                  style={{
                    scrollbarWidth: "none",

                    msOverflowStyle: "none",

                    maxWidth: "100%",
                  }}
                >
                  {submodulesLoading || countsLoading ? (
                    <span className="text-gray-400 px-4 py-2">Loading...</span>
                  ) : submodulesError ? (
                    <span className="text-red-400 px-4 py-2">
                      {submodulesError}
                    </span>
                  ) : submodulesToShow.length > 0 ? (
                    // submodulesToShow.map((submodule: any) => {
                    //   const submoduleTestCaseCount =
                    //     submoduleTestCaseCounts[submodule.name] || 0;

                    //   return (
                    //     <Button
                    //       key={submodule.id}
                    //       variant={
                    //         selectedSubmodule === submodule.name
                    //           ? "primary"
                    //           : "secondary"
                    //       }
                    //       onClick={() => handleSubmoduleSelect(submodule.name)}
                    //       className="whitespace-nowrap m-2"
                    //     >
                    //       {submodule.name} ({submoduleTestCaseCount})
                    //     </Button>
                    //   );
                    // })

                    submodulesToShow.map((submodule: any) => {
  const submoduleName =
  submodule.subModuleName ||
  submodule.name ||
  "";

const submoduleId =
  submodule.subModuleId ?? submodule.id;

  const submoduleTestCaseCount =
    submoduleTestCaseCounts[submoduleName] || 0;

  return (
    <Button
      key={submoduleId}
      variant={
        selectedSubmodule === submoduleName
          ? "primary"
          : "secondary"
      }
      onClick={() =>
        handleSubmoduleSelect(submoduleName)
      }
      className="whitespace-nowrap m-2"
    >
      {submoduleName} ({submoduleTestCaseCount})
    </Button>
  );
})
                  ) : (
                    <span className="text-gray-400 px-4 py-2">
                      No submodules
                    </span>
                  )}
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
        </div>

        {}

        <div className="flex-1 px-6 pb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Test Cases</h3>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <table className="min-w-[1500px] w-full table-fixed">
                  <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">

                          {/* Test Case ID */}
                          <th
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-20 bg-gray-50 border-r border-gray-200"
                            style={{ width: "120px", minWidth: "120px" }}
                          >
                            Test Case ID
                          </th>

                          {/* Description */}
                          <th
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky z-20 bg-gray-50 border-r border-gray-200"
                            style={{
                              left: "120px",
                              width: "250px",
                              minWidth: "250px",
                            }}
                          >
                            Description
                          </th>

                          {/* Steps */}
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ minWidth: "120px" }}
                          >
                            Steps
                          </th>

                          {/* Type */}
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ minWidth: "120px" }}
                          >
                            Type
                          </th>

                          {/* Severity */}
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ minWidth: "120px" }}
                          >
                            Severity
                          </th>

                          {/* Executer */}
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ minWidth: "150px" }}
                          >
                            Executer(QA)
                          </th>

                          {/* Assigned To */}
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ minWidth: "150px" }}
                          >
                            Assigned To
                          </th>

                          {/* Execution Status */}
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ minWidth: "150px" }}
                          >
                            Execution Status
                          </th>

                          {/* Defect ID */}
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ minWidth: "120px" }}
                          >
                            Defect ID
                          </th>

                          {/* Actions */}
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ minWidth: "100px" }}
                          >
                            Actions
                          </th>

                        </tr>
                      </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {testCasesLoading ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

                            <span className="text-gray-500">
                              Loading test cases...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTestCases.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          {selectedModule && selectedSubmodule
                            ? "No test cases found for the selected module and submodule."
                            : "Please select a module and submodule to view test cases."}
                        </td>
                      </tr>
                    ) : (
                      filteredTestCases.map((testCase: any) => {
                        const databaseStatus =
  testCase.passOrFail === "PASS"
    ? "passed"
    : testCase.passOrFail === "FAIL"
    ? "failed"
    : "not-started";

const localStorageStatus =
  executionStatuses[testCase.id];

const status =
  databaseStatus !== "not-started"
    ? databaseStatus
    : localStorageStatus || "not-started";

                        const isFailed =
                          status === "failed" ||
                          status === "FAILED" ||
                          status === "FAIL";
                        const isPassed =
                          status === "passed" ||
                          status === "PASSED" ||
                          status === "PASS";

                        const fallbackDefect =
                          findMatchingDefectForTestCase(testCase);

                        const computedDefectId =
  testCaseDefectMap[testCase.id] ??
  fallbackDefect?.projectDefectNumber;

                        const computedAssignedUser = computedDefectId
                          ? getAssignedUserForDefect(computedDefectId) ||
                            (fallbackDefect
                              ? fallbackDefect.assigned_to_name ||
                                fallbackDefect.assignedToName
                              : undefined)
                          : fallbackDefect
                            ? fallbackDefect.assigned_to_name ||
                              fallbackDefect.assignedToName
                            : undefined;

                        if (isFailed) {
}

                        return (
                            <tr
                      
                              key={testCase.releaseTestCaseId || testCase.id}
                              className="hover:bg-gray-50"
                            >
                          
                            <td className="px-6 py-4 whitespace-nowrap sticky left-0 z-10 bg-white border-r border-gray-200 text-sm text-gray-500">
                              {testCase.testCaseNumber != null
    ? testCase.testCaseNumber
    : "N/A"}
                            </td>

                            <td
  
                              className="px-4 py-4 text-sm text-gray-500 sticky z-10 bg-white border-r border-gray-200"
                              style={{
                                left: "120px",
                                width: "250px",
                                minWidth: "250px",
                                maxWidth: "250px",
                              }}
                              title={testCase.description}
                            >
                              <div className="w-full whitespace-normal break-words">
                                {testCase.description || "-"}
                              </div>
                            </td>

                            <td
                              className="px-6 py-4 text-sm text-gray-500"
                              style={{
                                width: "120px",
                                minWidth: "120px",
                              }}
                            >
                              <button
                                onClick={() => handleViewSteps(testCase)}
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
                                testCase.severity,
                                getSeverityColor(testCase.severity),
                              )}
                            </td>
                            <td
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                title={testCase.employeeName || ""}
                              >
                                {testCase.employeeName || "No Execution"}
                              </td>

                            {}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {isFailed ? (
                                  <span className="font-medium text-blue-700">
                                    {testCase.assignToName || "No Assignment"}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex rounded border border-gray-200 bg-white shadow overflow-hidden w-fit">
                                <button
                                  type="button"
                                  className={`px-3 py-1 text-xs font-semibold focus:outline-none transition-colors duration-200 ${
                                    isPassed
                                      ? "bg-green-500 text-white"
                                      : "bg-white text-gray-700 hover:bg-green-100"
                                  }`}
                                  style={{
                                    borderTopLeftRadius: 6,

                                    borderBottomLeftRadius: 6,
                                  }}
                                  onClick={async () => {
                                    

                                    setExecutionStatuses((prev) => ({
                                      ...prev,
                                      [testCase.id]: "passed",
                                    }));
                                    if (selectedProject && selectedRelease) {
                                      persistExecutionStatus(
                                        selectedProject,
                                        selectedRelease,
                                        testCase.id,
                                        "passed" as ExecutionStatus,
                                      );
                                    }
                                    setDefectModalOpen(null);

                                    try {
                                      const releaseTestCaseId =
                                        testCase.backendId ||
                                        Number(testCase.id);
                                      await updateReleaseTestCaseStatus(
                                        Number(selectedRelease),
                                        Number(releaseTestCaseId),
                                        "PASS",
                                      );
                                      setToast({
                                        isOpen: true,
                                        message: "Test case passed!",
                                        type: "success",
                                      });
                                    } catch (e: any) {
                                      setToast({
                                        isOpen: true,
                                        message:
                                          e?.response?.data?.message ||
                                          "Failed to update status",
                                        type: "error",
                                      });
                                    }
                                  }}
                                  disabled={isFailed}
                                  aria-pressed={isPassed}
                                >
                                  Pass
                                </button>

                                <button
                                  type="button"
                                  className={`px-3 py-1 text-xs font-semibold focus:outline-none transition-colors duration-200 ${
                                    isFailed
                                      ? "bg-red-500 text-white"
                                      : "bg-white text-gray-700 hover:bg-red-100"
                                  }`}
                                  style={{
                                    borderTopRightRadius: 6,

                                    borderBottomRightRadius: 6,

                                    borderLeft: "1px solid #e5e7eb",
                                  }}
                                  onClick={() => {
                                    if (!canUserExecute(testCase)) {
                                      setToast({
                                        isOpen: true,
                                        message:
                                          "You are not authorized to execute this test case. Only the assigned QA can execute.",
                                        type: "error",
                                      });
                                      return;
                                    }
                                    if (!isFailed) {
                                      const currentStatus = status;
setPreviousStatusBeforeFail({
                                        testCaseId: testCase.id,

                                        previousStatus: currentStatus,
                                      });

                                      handleFailClick(testCase);
                                    } else {
                                      handleFailClick(testCase);
                                    }
                                  }}
                                  disabled={isFailed}
                                  aria-pressed={isFailed}
                                >
                                  Fail
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
  {(() => {
    const defectNumberToShow =
      testCase.projectDefectNumber ??
      computedDefectId ??
      fallbackDefect?.projectDefectNumber ??
      null;

    const defectData = existingDefects.find(
      (d: any) =>
        Number(d.projectDefectNumber) ===
        Number(defectNumberToShow),
    );

    if (isFailed && defectNumberToShow) {
      return (
        <button
          className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200 transition text-xs"
          onClick={() => {
            const actualDefectId =
              defectData?.defectId ?? defectData?.id;

            if (actualDefectId) {
              navigate(
                `/projects/${selectedProject}/defects?view=${actualDefectId}`,
              );
            }
          }}
        >
          {defectNumberToShow}
        </button>
      );
    }

    if (isFailed && !defectNumberToShow) {
      return (
        <span className="text-xs text-red-600">
          Failed - No Defect
        </span>
      );
    }

    return <span className="text-gray-400">-</span>;
  })()}
</td>
                            {}

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => handleViewTestCase(testCase)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {}

        <Modal
          isOpen={isViewStepsModalOpen}
          onClose={() => {
            setIsViewStepsModalOpen(false);

            setViewingTestCase(null);
          }}
          title={`Test Steps - ${viewingTestCase?.no ? formatTestCaseId(viewingTestCase.no) : "N/A"}`}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-line">
                {viewingTestCase?.steps}
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
          
          size="xl"
        >
          {viewingTestCase && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Description
                  </h3>

                  <p classNtitle={`Test Case Details - ${viewingTestCase?.no ? formatTestCaseId(viewingTestCase.no) : "N/A"}`}ame="mt-1 text-sm text-gray-900">
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
                  <h3 className="text-sm font-medium text-gray-500">
                    Severity
                  </h3>

                  {renderColoredSpan(
                    viewingTestCase.severity,
                    getSeverityColor(viewingTestCase.severity),
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Priority
                  </h3>

                  {renderColoredSpan(
                    viewingTestCase.priority,
                    getSeverityColor(viewingTestCase.priority),
                  )}
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
          isOpen={!!defectModalOpen}
          onClose={() => {
setDefectAllocatedUsers([]);
            setDefectAllocatedUsersLoading(false);

            if (previousStatusBeforeFail) {
setExecutionStatuses((prev) => ({
                ...prev,

                [previousStatusBeforeFail.testCaseId]:
                  previousStatusBeforeFail.previousStatus,
              }));

              if (selectedProject && selectedRelease) {
                persistExecutionStatus(
                  selectedProject,

                  selectedRelease,

                  previousStatusBeforeFail.testCaseId,

                  previousStatusBeforeFail.previousStatus as ExecutionStatus,
                );
              }

              setPreviousStatusBeforeFail(null);
            }

            setDefectModalOpen(null);
setPendingStatusUpdate(null);
            pendingTestCaseRef.current = null;

            setDefectFormData({
              title: "",

              description: "",

              module: "",

              subModule: "",

              type: "bug",

              priority: "medium",

              severity: "medium",

              status: "NEW",

              projectId: projectId || "",

              releaseId: releaseId || "",

              testCaseId: "",

              assignedTo: 0,

              reportedBy: "",

              rejectionComment: "",
              attachment: "",
              attachmentFile: null,
            });
          }}
          title="Add New Defect"
          size="lg"
        >
          <form onSubmit={handleDefectFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brief Description
              </label>

              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                value={defectFormData.title}
                disabled
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Steps
              </label>

              <textarea
                value={defectFormData.description}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                rows={3}
                disabled
                readOnly
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modules
                </label>

                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={defectFormData.module}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submodules
                </label>

                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={defectFormData.subModule}
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>

                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  value={defectFormData.severity}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>

                <input
                  value={defectFormData.type || "Not specified"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>

                <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                    value={defectFormData.priorityId || ""}
                    onChange={(e) =>
                      setDefectFormData({
                        ...defectFormData,
                        priorityId: Number(e.target.value),
                      })
                    }
                  >
                    <option value="">Select priority</option>

                     {priorities.map((priority) => (
                      <option
                        key={priority.priorityId}
                        value={priority.priorityId}
                      >
                        {priority.priorityName}
                      </option>
                    ))}
                  </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  value={defectFormData.assignedTo}
                  onChange={(e) =>
                    handleDefectInputChange("assignedTo", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select assigned user</option>

                  {defectAllocatedUsers.length > 0 ? (
                    defectAllocatedUsers.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.userName}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No developers to this submodule
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {}
              <div className="col-span-12">
                <ImagePicker
                  label="Attachment Image (Optional)"
                  value={defectFormData.attachmentFile}
                  existingAttachment={defectFormData.attachment}
                  isEditing={!!editingDefect}
                  onChange={(file) => {
                    if (file === null) {
                      setDefectFormData((prev) => ({
                        ...prev,
                        attachmentFile: null,
                        attachment: "",
                      }));
                    } else {
                      setDefectFormData((prev) => ({
                        ...prev,
                        attachmentFile: file,
                      }));
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
if (previousStatusBeforeFail) {


                    setExecutionStatuses((prev) => ({
                      ...prev,

                      [previousStatusBeforeFail.testCaseId]:
                        previousStatusBeforeFail.previousStatus,
                    }));

                    if (selectedProject && selectedRelease) {
                      persistExecutionStatus(
                        selectedProject,

                        selectedRelease,

                        previousStatusBeforeFail.testCaseId,

                        previousStatusBeforeFail.previousStatus as ExecutionStatus,
                      );
                    }

                    setPreviousStatusBeforeFail(null);
                  }

                  setDefectModalOpen(null);
setPendingStatusUpdate(null);
                  pendingTestCaseRef.current = null;

                  setIsEditingDefect(false);

                  setEditingDefect(null);

                  setDefectFormData({
                    title: "",

                    description: "",

                    module: "",

                    subModule: "",

                    type: "bug",

                    priority: "medium",

                    severity: "medium",

                    status: "NEW",

                    projectId: projectId || "",

                    releaseId: releaseId || "",

                    testCaseId: "",

                    assignedTo: 0,

                    reportedBy: "",

                    rejectionComment: "",
                    attachment: "",
                    attachmentFile: null as File | null,
                  });
                }}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={defectSubmitting}>
                {defectSubmitting
                  ? isEditingDefect
                    ? "Updating..."
                    : "Creating..."
                  : isEditingDefect
                    ? "Update Defect"
                    : "Save Defect"}
              </Button>
            </div>
          </form>
        </Modal>
        <Toast
          isOpen={toast.isOpen}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, isOpen: false })}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {}

      <div className="mb-4 flex justify-end">
        <Button
          variant="secondary"
          onClick={() =>
            navigate(`/projects/${selectedProject || projectId}/releases`)
          }
          className="flex items-center"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back
        </Button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Test Execution</h1>

      {}

      <ProjectSelector
        projects={projects}
        selectedProjectId={selectedProject}
        onSelect={handleProjectSelect}
        className="mb-6"
      />

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

      {}

      {releaseLoading && (
        <div className="text-center text-gray-500 mb-4">
          Loading releases...
        </div>
      )}

      {releaseError && (
        <div className="text-center text-red-500 mb-4">{releaseError}</div>
      )}

      {selectedProject && !releaseLoading && !releaseError && (
        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Releases for Project
            </h2>
          </div>

          {projectReleaseCard.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">
                  No releases found for the selected project.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectReleaseCard.map((release: any) => {
                const currentProject =
                  projects &&
                  projects.find((p: any) => p.id === selectedProject);

                const isActive =
                  release.status === "Active" ||
                  release.status === "ACTIVE" ||
                  release.status === true;

                  const releaseId = String(
  release.releaseId ?? release.id
);

const testCaseCount =
  releaseTestCaseCounts[releaseId] ?? 0;
return (
                  <Card
                    key={release.id}
                    hover
                    className={`group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                      isActive
                        ? "cursor-pointer border-blue-500 ring-2 ring-blue-300"
                        : "cursor-default border-gray-200"
                    }`}
                    onClick={() => {
                      if (isActive) {
                        handleReleaseSelect(release.id || release.releaseId);
                      }
                    }}
                  >
                    <CardContent className="p-6">
                      {}

                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {release.releaseName || release.name}
                        </h3>
                      </div>

                      {}

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {release.description}
                      </p>

                      {}

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-400" />

                          <div>
                                              <p className="text-xs text-gray-500">Test Cases</p>

                                      <p className="text-sm font-medium text-gray-900">
                    {releaseLoading ? (
                      <span className="flex items-center space-x-1">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </span>
                    ) : (
                      testCaseCount
                    )}
                  </p>

                            {Object.keys(releaseTestCaseCounts).length > 0 && (
                              <p className="text-xs text-gray-400">
                                Last updated: {new Date().toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />

                          <div>
                            <p className="text-xs text-gray-500">
                              Release Date
                            </p>

                            <p className="text-sm font-medium text-gray-900">
                              {release.releaseDate
                                ? new Date(
                                    release.releaseDate,
                                  ).toLocaleDateString()
                                : "TBD"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {}

                      {currentProject && (
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                Project: {currentProject.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {}

                      {can.release.statusUpdate && (
                        <div className="flex gap-2 mt-4">
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors duration-150 ${
                              isActive
                                ? "bg-blue-100 text-blue-700 border-blue-400"
                                : "bg-white text-gray-500 border-gray-300 hover:bg-blue-50"
                            }`}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (isActive) {
                                setToast({
                                  isOpen: true,
                                  message: "This release is already Active",
                                  type: "error",
                                });
                                return;
                              }

                              const alreadyActiveRelease =
                                projectReleaseCard.find(
                                  (r: any) =>
                                    (r.status === "Active" ||
                                      r.status === "ACTIVE" ||
                                      r.status === true) &&
                                    (r.id || r.releaseId) !==
                                      (release.id || release.releaseId),
                                );

                              if (alreadyActiveRelease) {
                                setToast({
                                  isOpen: true,
                                  message: `"${alreadyActiveRelease.name}" is already Active. Please Hold it first before activating another release.`,
                                  type: "error",
                                });
                                return;
                              }

                              try {
                                await updateReleaseStatus(
                                  parseInt(release.id || release.releaseId),
                                  "ACTIVE",
                                );
                                setReleaseLoading(true);

                                const res =
                                  await projectReleaseCardView(selectedProject);
                                const statusOk =
                                  String(res?.status).toLowerCase() ===
                                    "success" ||
                                  String(res?.statusCode) === "200";
                                if (statusOk || res?.data) {
                                  const releaseList = res.data || [];
                                  const filtered = releaseList.filter(
                                    (r: any) =>
                                      String(r.project_id) ===
                                        String(selectedProject) ||
                                      String(r.projectId) ===
                                        String(selectedProject),
                                  );
                                  setProjectReleaseCard(filtered);

                                  const releaseIds = filtered
                                    .map((r: any) => r.id || r.releaseId)
                                    .filter((id: any) => id != null)
                                    .map(Number);

                                  if (releaseIds.length > 0) {
                                    const countsRes =
                                      await getReleaseTestCaseCountsLoad(
                                        releaseIds,
                                      );
                                    const countsOk =
                                      String(
                                        countsRes?.status,
                                      ).toLowerCase() === "success" ||
                                      String(countsRes?.statusCode) === "200";
                                    if (countsOk || countsRes?.data) {
                                      const countsMap: {
                                        [key: string]: number;
                                      } = {};
                                      (countsRes.data || []).forEach(
                                        (item: any) => {
                                          const releaseId = item.releaseId;
                                          if (
                                            releaseId &&
                                            typeof item.testCaseCount ===
                                              "number"
                                          ) {
                                            countsMap[releaseId] =
                                              item.testCaseCount;
                                          }
                                        },
                                      );
                                      setReleaseTestCaseCounts(countsMap);
                                    } else {
                                      setReleaseTestCaseCounts({});
                                    }
                                  } else {
                                    setReleaseTestCaseCounts({});
                                  }
                                } else {
                                  setReleaseError(
                                    res.message || "No releases found",
                                  );
                                }

                                setToast({
                                  isOpen: true,
                                  message:
                                    "Release activated and other releases set to Hold for this project",
                                  type: "success",
                                });
                              } catch (err: any) {
const message =
                                  err?.response?.data?.message ||
                                  "Failed to activate release";
                                setToast({
                                  isOpen: true,
                                  message,
                                  type: "error",
                                });
                              } finally {
                                setReleaseLoading(false);
                              }
                            }}
                          >
                            Active
                          </button>

                          <button
                            type="button"
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors duration-150 ${
                              !isActive
                                ? "bg-red-100 text-red-700 border-red-400"
                                : "bg-white text-gray-500 border-gray-300 hover:bg-red-50"
                            }`}
                            onClick={async (e) => {
                              e.stopPropagation();

                              try {
                                await updateReleaseStatus(
                                  parseInt(release.id || release.releaseId),
                                  "HOLD",
                                );
                                setReleaseLoading(true);

                                const res =
                                  await projectReleaseCardView(selectedProject);
                                const statusOk =
                                  String(res?.status).toLowerCase() ===
                                    "success" ||
                                  String(res?.statusCode) === "200";
                                if (statusOk || res?.data) {
                                  const releaseList = res.data || [];
                                  const filtered = releaseList.filter(
                                    (r: any) =>
                                      String(r.project_id) ===
                                        String(selectedProject) ||
                                      String(r.projectId) ===
                                        String(selectedProject),
                                  );
                                  setProjectReleaseCard(filtered);

                                  const releaseIds = filtered
                                    .map((r: any) => r.id || r.releaseId)
                                    .filter((id: any) => id != null)
                                    .map(Number);

                                  if (releaseIds.length > 0) {
                                    const countsRes =
                                      await getReleaseTestCaseCountsLoad(
                                        releaseIds,
                                      );
                                    const countsOk =
                                      String(
                                        countsRes?.status,
                                      ).toLowerCase() === "success" ||
                                      String(countsRes?.statusCode) === "200";
                                    if (countsOk || countsRes?.data) {
                                      const countsMap: {
                                        [key: string]: number;
                                      } = {};
                                      (countsRes.data || []).forEach(
                                        (item: any) => {
                                          const releaseId = item.releaseId;
                                          if (
                                            releaseId &&
                                            typeof item.testCaseCount ===
                                              "number"
                                          ) {
                                            countsMap[releaseId] =
                                              item.testCaseCount;
                                          }
                                        },
                                      );
                                      setReleaseTestCaseCounts(countsMap);
                                    } else {
                                      setReleaseTestCaseCounts({});
                                    }
                                  } else {
                                    setReleaseTestCaseCounts({});
                                  }
                                } else {
                                  setReleaseError(
                                    res.message || "No releases found",
                                  );
                                }

                                setToast({
                                  isOpen: true,
                                  message:
                                    "Release status set to Hold for this project",
                                  type: "success",
                                });
                              } catch (err: any) {
const message =
                                  err?.response?.data?.message ||
                                  "Failed to hold release";
                                setToast({
                                  isOpen: true,
                                  message,
                                  type: "error",
                                });
                              } finally {
                                setReleaseLoading(false);
                              }
                            }}
                          >
                            Hold
                          </button>
                        </div>
                      )}

                      {}

                      {isActive && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>

                            <span className="text-xs font-medium text-blue-700">
                              Active - Click to enter test execution
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
