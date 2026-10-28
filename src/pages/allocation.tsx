import React, { useState, useEffect } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { Card, CardContent } from "../components/ui/Card";

import { Button } from "../components/ui/Button";

import { Badge } from "../components/ui/Badge";

import {
  ChevronLeft,
  Eye,
  Edit2,
  Trash2,
  Plus,
  ChevronRight,
} from "lucide-react";

import { useApp } from "../context/AppContext";

import { Modal } from "../components/ui/Modal";

import { ProjectSelector } from "../components/ui/ProjectSelector";

import { projectReleaseCardView } from "../api/releaseView/ProjectReleaseCardView";

//import { getReleaseTestCaseCounts } from "../api/releaseView/getReleaseTestCaseCount";

import {
  getSubmodulesByModuleId,
  Submodule,
} from "../api/submodule/submoduleget";

import {
  getTestCasesByProjectAndSubmodule,
  getTestCasesByProjectAndModule,
  getAvailableTestCasesForRelease,
} from "../api/testCase/testCaseApi";
import { getAllocatedTestCases as getQaAllocatedTestCases } from "../api/qa_allocation/qa_allocation_get_filter";

// import {
//   getTestCasesByBulkModules,
//   getTestCasesByBulkSubmodules,
// } from "../api/testCase/testCaseApi";

import {
  getBulkSubmodulesByModules,
  BulkSubmodule,
} from "../api/submodule/getBulkSubmodulesByModules";


import { getSubmodulesByModule } from "../api/submodule/getSubmodulesByModule";

import { getSeverities } from "../api/severity";

import { getDefectTypes } from "../api/defectType";

import { TestCase as TestCaseType } from "../types/index";

import {
  allocateTestCaseToRelease,
  allocateTestCaseToMultipleReleases,
  bulkAllocateTestCasesToReleases,
  ReleaseTestCaseMappingRequest,
  allocateTestCasesToManyReleases,
  getReleaseTestCasesByFiltersGroup,
  getQaAllocationSummary,
  getQaEngineerTestCases,
} from "../api/releasetestcase";

import {
  getAllocatedUsersByModuleId,
  getModulesByProjectId,
} from "../api/module/getModule";

import {
  getQAMembersByProjectId,
  QAMember,
} from "../api/qa_allocation/qa_allocation";

import {
  allocated_testcases,
  allocated_testcase_details,
  bulkAssignOwner,
} from "../api/qa_allocation/qa_allocation_get_filter";

import AlertModal from "../components/ui/AlertModal";
import { StandaloneQAAllocationTab } from "../components/qaAllocation/StandaloneQAAllocationTab";
import { usePermission } from "../context/PermissionContext";
import { getAllProjects } from "../api/projectget";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const TABS = [
  { key: "release", label: "Release Allocation" },

  { key: "qa", label: "QA Allocation" },
] as const;

type AllocationTab = (typeof TABS)[number]["key"];

export const Allocation: React.FC = () => {
  const { projectId } = useParams();

  const navigate = useNavigate();

  const {
    releases,

    employees,

    testCases,
  } = useApp();

  const [projects, setProjects] = useState<any[]>([]);

  const {
    projects: userProjects,
    isAdmin,
    switchProject,
    selectedProjectId: permissionProjectId,
  } = usePermission();

  useEffect(() => {
    if (!projectId) return;

    const id = Number(projectId);

    if (permissionProjectId !== id) {
      switchProject(id);
    }
  }, [projectId, permissionProjectId]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        if (isAdmin) {
          const response = await getAllProjects();

          setProjects(
            Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : [],
          );
        } else {
          setProjects(
            userProjects.map((p) => ({
              id: String(p.projectId),
              name: p.projectName,
              projectName: p.projectName,
            })),
          );
        }
      } catch (error) {
setProjects([]);
      }
    };

    loadProjects();
  }, [isAdmin, userProjects]);

  const [modulesByProject, setModulesByProject] = useState<
    Record<
      string,
      { id: string; name: string; submodules: { id: string; name: string }[] }[]
    >
  >({});

  const [activeTab, setActiveTab] = useState<AllocationTab>("release");

  const [selectedReleaseIds, setSelectedReleaseIds] = useState<string[]>([]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [selectedModule, setSelectedModule] = useState("");

  const [selectedQA, setSelectedQA] = useState<string | null>(null);

  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);

  const [isViewStepsModalOpen, setIsViewStepsModalOpen] = useState(false);

  const [isViewTestCaseModalOpen, setIsViewTestCaseModalOpen] = useState(false);

  const [viewingTestCase, setViewingTestCase] = useState<any>(null);

  const [bulkModuleSelect, setBulkModuleSelect] = useState(false);

  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const [selectedSubmodule, setSelectedSubmodule] = useState<string>("");

  const [bulkSubmoduleSelect, setBulkSubmoduleSelect] =
    useState<boolean>(false);

  const [selectedSubmodules, setSelectedSubmodules] = useState<string[]>([]);

  const [submodules, setSubmodules] = useState<Submodule[]>([]);

  const [submoduleError, setSubmoduleError] = useState<string>("");

  const [bulkSubmodules, setBulkSubmodules] = useState<BulkSubmodule[]>([]);

  const [bulkSubmodulesLoading, setBulkSubmodulesLoading] = useState(false);

  const [apiRelease, setApiRelease] = useState<any>(null);

  const [loadingRelease, setLoadingRelease] = useState(false);

  const [releaseError, setReleaseError] = useState<string | null>(null);

  const [projectRelease, setProjectRelease] = useState<any[]>([]);

  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [qaAllocatedTestCases, setQaAllocatedTestCases] = useState<{
    [releaseId: string]: string[];
  }>({});

  const [qaAllocations, setQaAllocations] = useState<{
    [releaseId: string]: { [qaId: string]: string[] };
  }>({});

  const [selectedTestCasesForQA, setSelectedTestCasesForQA] = useState<{
    [releaseId: string]: string[];
  }>({});

  const [loadingQAAllocations, setLoadingQAAllocations] = useState(false);

  const [selectedReleaseForQA, setSelectedReleaseForQA] = useState<
    string | null
  >(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    String(projectId ?? ""),
  );

  const [loadingReleases, setLoadingReleases] = useState(false);

  const [allocatedTestCases, setAllocatedTestCases] = useState<TestCaseType[]>(
    [],
  );

  const [qaAllocatedTestCasesData, setQaAllocatedTestCasesData] = useState<
    allocated_testcase_details[]
  >([]);

  const [loadingQATestCases, setLoadingQATestCases] = useState(false);

  const [qaTestCasesError, setQaTestCasesError] = useState<string | null>(null);

  const [qaAllocationLoading, setQaAllocationLoading] = useState(false);

  const [qaAllocationError, setQaAllocationError] = useState<string | null>(
    null,
  );

  const [qaAllocationSuccess, setQaAllocationSuccess] = useState<string | null>(
    null,
  );

  const [severities, setSeverities] = useState<
    { id: number; name: string; color: string }[]
  >([]);

  const [defectTypes, setDefectTypes] = useState<
    { id: number; defectTypeName: string }[]
  >([]);

  const [allocationLoading, setAllocationLoading] = useState(false);

  const [allocationSuccess, setAllocationSuccess] = useState<string | null>(
    null,
  );

  const [allocationError, setAllocationError] = useState<string | null>(null);

  const [allocationProgress, setAllocationProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const [allocationMode, setAllocationMode] = useState<
    "one-to-one" | "one-to-many" | "bulk" | "many-to-many"
  >("one-to-one");
  const [modeRefreshKey, setModeRefreshKey] = useState<number>(0);

  const [alert, setAlert] = useState({ isOpen: false, message: "" });

  const [loadingModuleTestCases, setLoadingModuleTestCases] = useState(false);

  const [loadingSubmoduleTestCases, setLoadingSubmoduleTestCases] =
    useState(false);

  const showAlert = (message: string) => setAlert({ isOpen: true, message });

  const closeAlert = () => setAlert((a) => ({ ...a, isOpen: false }));

  const [bulkSubmoduleWarning, setBulkSubmoduleWarning] = useState<string>("");

  const [qaReleaseTestCases, setQaReleaseTestCases] = useState<any[]>([]);

  const [qaReleaseTestCasesLoading, setQaReleaseTestCasesLoading] =
    useState(false);

  const [qaReleaseTestCasesError, setQaReleaseTestCasesError] = useState<
    string | null
  >(null);

  const [qaMembers, setQaMembers] = useState<QAMember[]>([]);

  const [qaMembersLoading, setQaMembersLoading] = useState(false);

  const [qaMembersError, setQaMembersError] = useState<string | null>(null);

  const [releaseTestCaseCounts, setReleaseTestCaseCounts] = useState<any[]>([]);

  const [releaseTestCaseCountsLoading, setReleaseTestCaseCountsLoading] =
    useState(false);

  const [releaseTestCaseCountsError, setReleaseTestCaseCountsError] = useState<
    string | null
  >(null);

  React.useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);

      setSelectedProject(projectId);
    }
  }, [projectId]);

  const getReleaseCardView = async () => {
    if (!selectedProject) return;
    setLoadingReleases(true);
    try {
      const response = await projectReleaseCardView(selectedProject);
      setProjectRelease(response.data || []);
    } catch (error) {
setProjectRelease([]);
    } finally {
      setLoadingReleases(false);
    }
  };

  const fetchReleaseTestCaseCounts = async () => {
    if (!selectedProject) return;

    setReleaseTestCaseCountsLoading(true);

    setReleaseTestCaseCountsError(null);

    try {
const response = await getReleaseTestCaseCounts(selectedProject);

      setReleaseTestCaseCounts(response.data || []);


      if (response.data && response.data.length > 0) {
        response.data.forEach((release: any) => {
});
      }
    } catch (error) {
setReleaseTestCaseCountsError("Failed to fetch release test case counts");

      setReleaseTestCaseCounts([]);
    } finally {
      setReleaseTestCaseCountsLoading(false);
    }
  };

  const loadExistingQAAllocations = async () => {
    if (!selectedProject || !effectiveProjectRelease.length) return;

    setLoadingQAAllocations(true);

    try {
    } catch (error) {
} finally {
      setLoadingQAAllocations(false);
    }
  };

  const fetchAllocatedTestCases = async (params: allocated_testcases) => {
    setLoadingQATestCases(true);

    setQaTestCasesError(null);

    try {
      const response = await getQaAllocatedTestCases(params);

      setQaAllocatedTestCasesData(response.data);

      return response.data;
    } catch (error) {
setQaTestCasesError("Failed to fetch allocated test cases");

      setQaAllocatedTestCasesData([]);

      return [];
    } finally {
      setLoadingQATestCases(false);
    }
  };

  const fetchTestCasesByModuleSubmoduleRelease = async (
    projectId: number,
    releaseId: number,
    moduleId: number,
    subModuleId: number,
  ) => {
    setLoadingQATestCases(true);
    setQaTestCasesError(null);
    try {
const response = await getReleaseTestCasesByFiltersGroup({
  releaseId,
  moduleId,
  subModuleId,
});
if (response.status === "success" && response.data) {
        const mappedTestCases = response.data.map((tc: any) => ({
          id: tc.testCaseId ?? tc.id,
          testCaseId: tc.testCaseId,
          description: tc.description || "No description",
          steps: tc.steps || "No steps",
          type: tc.type || "Unknown",
          severity: tc.severity || "Unknown",
          moduleId: moduleId,
          subModuleId: subModuleId,

          releaseTestCaseId: tc.releaseTestCaseId,
          status: tc.status,
          passOrFail: tc.passOrFail,
          benchAllocationId: tc.benchAllocationId,
        }));

        setQaAllocatedTestCasesData(mappedTestCases);
        return mappedTestCases;
      } else {
        setQaTestCasesError(
          "Failed to fetch test cases for the selected module, submodule, and release",
        );
        setQaAllocatedTestCasesData([]);
        return [];
      }
    } catch (error: any) {
        const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch test cases for the selected module, submodule, and release";
      setQaTestCasesError(errorMessage);
      setQaAllocatedTestCasesData([]);
      return [];
    } finally {
      setLoadingQATestCases(false);
    }
  };

  const fetchTestCasesByModule = async (
    projectId: string,
    moduleId: string,
  ) => {
    setLoadingModuleTestCases(true);
    try {
      const response = await getTestCasesByProjectAndModule(
        projectId,
        moduleId,
      );

      if (response && Array.isArray(response)) {
        const mapped = response.map((tc: any) => ({
  ...tc,

  id: tc.testCaseId ?? tc.id,

  testCaseId: tc.testCaseId,

  testCaseNumber: tc.testCaseNumber,

  severity: tc.severityName || "",
  type: tc.defectTypeName || "",
})) as TestCaseType[];

        setAllocatedTestCases(mapped);
        setSelectedTestCases([]);
return mapped;
      }
      return [];
    } catch (error) {
setAllocatedTestCases([]);
      return [];
    } finally {
      setLoadingModuleTestCases(false);
    }
  };

//   const fetchTestCasesBySubmodule = async (
//     projectId: string,
//     submoduleId: string,
//   ) => {
//     setLoadingSubmoduleTestCases(true);
//     try {
//       const response = await getTestCasesByProjectAndSubmodule(
//         projectId,
//         submoduleId,
//       );

//       if (response && Array.isArray(response)) {
//         const mapped = response.map((tc: any) => ({
//           ...tc,
//           id: tc.id,
//           testCaseId: tc.testcaseNo || tc.testCaseId || tc.no || String(tc.id),
//           severity: tc.severityName || "",
//           type: tc.defectTypeName || "",
//         })) as TestCaseType[];

//         setAllocatedTestCases(mapped);
//         setSelectedTestCases([]);
// return mapped;
//       }
//       return [];
//     } catch (error) {
// setAllocatedTestCases([]);
//       return [];
//     } finally {
//       setLoadingSubmoduleTestCases(false);
//     }
//   };

const fetchTestCasesBySubmodule = async (
  projectId: number,
  releaseId: number,
  moduleId: number,
  submoduleId: number,
) => {
  if (!projectId || !releaseId || !moduleId || !submoduleId) {
    setAllocatedTestCases([]);
    return;
  }

  setLoadingSubmoduleTestCases(true);

  try {
    const response =
      await getAvailableTestCasesForRelease(
        releaseId,
        projectId,
        moduleId,
        submoduleId,
      );

    if (response && Array.isArray(response)) {
      const mapped = response.map((tc: any) => ({
  ...tc,

  // IMPORTANT:
  // Backend DB primary key must be used for allocation
  id: tc.testCaseId ?? tc.id,

  testCaseId: tc.testCaseId,

  // Keep test case number separately for display
  testCaseNumber: tc.testCaseNumber,

  severity: tc.severityName || "",
  type: tc.defectTypeName || "",
})) as TestCaseType[];

      setAllocatedTestCases(mapped);
      setSelectedTestCases([]);

      return mapped;
    }

    return [];
  } catch (error) {
    console.error(
      "Submodule test case API error:",
      error,
    );

    setAllocatedTestCases([]);
    return [];
  } finally {
    setLoadingSubmoduleTestCases(false);
  }
};

  const fetchTestCasesByBulkModules = async (
    projectId: string,
    moduleIds: string[],
  ) => {
    setLoadingModuleTestCases(true);
    try {
      const numericModuleIds = moduleIds
        .map((id) => Number(id))
        .filter((id) => !isNaN(id));

      const response = await getTestCasesByBulkModules(
        projectId,
        numericModuleIds,
      );

      if (response && Array.isArray(response)) {
        const mapped = response.map((tc: any) => ({
  ...tc,

  id: tc.testCaseId ?? tc.id,

  testCaseId: tc.testCaseId,

  testCaseNumber: tc.testCaseNumber,

  severity: tc.severityName || "",
  type: tc.defectTypeName || "",
})) as TestCaseType[];

        setAllocatedTestCases(mapped);

        const allIds = mapped.map((tc: any) => String(tc.id));
        setSelectedTestCases(allIds);

        return mapped;
      }
      return [];
    } catch (error) {
setAllocatedTestCases([]);
      return [];
    } finally {
      setLoadingModuleTestCases(false);
    }
  };

  const fetchTestCasesByBulkSubmodules = async (
    projectId: string,
    submoduleIds: string[],
  ) => {
    setLoadingSubmoduleTestCases(true);
    try {
      const numericIds = submoduleIds
        .map((id) => Number(id))
        .filter((id) => !isNaN(id));

      const response = await getTestCasesByBulkSubmodules(
        projectId,
        numericIds,
      );

      if (response && Array.isArray(response)) {
        const mapped = response.map((tc: any) => ({
  ...tc,

  id: tc.testCaseId ?? tc.id,

  testCaseId: tc.testCaseId,

  testCaseNumber: tc.testCaseNumber,

  severity: tc.severityName || "",
  type: tc.defectTypeName || "",
})) as TestCaseType[];

        setAllocatedTestCases(mapped);
        const allIds = mapped.map((tc: any) => String(tc.id));
        setSelectedTestCases(allIds);

        return mapped;
      }
      return [];
    } catch (error) {
setAllocatedTestCases([]);
      return [];
    } finally {
      setLoadingSubmoduleTestCases(false);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      getReleaseCardView();

      fetchReleaseTestCaseCounts();
    }
  }, [selectedProject]);

  useEffect(() => {
    getSeverities().then((res) => setSeverities(res.data.content));

    getDefectTypes().then((res) => setDefectTypes(res.data.content));
  }, []);

  useEffect(() => {
    if (
      selectedProjectId &&
      selectedSubmodule &&
      (severities.length > 0 || defectTypes.length > 0)
    ) {
      handleSelectSubModule(selectedSubmodule);
    }
  }, [severities, defectTypes]);

  useEffect(() => {
    setAllocationSuccess(null);

    setAllocationError(null);
  }, [activeTab]);

  const projectReleases = releases.filter((r) => r.projectId === projectId);

  const projectTestCases = testCases.filter((tc) => tc.projectId === projectId);

  const projectModules = selectedProjectId
    ? modulesByProject[selectedProjectId] || []
    : [];

  const effectiveProjectRelease = projectRelease;

  const effectiveTestCases =
    allocatedTestCases.length > 0 ? allocatedTestCases : projectTestCases;

  const effectiveModules = projectModules ? projectModules || [] : [];



  useEffect(() => {
    if (effectiveProjectRelease.length > 0) {
      loadExistingQAAllocations();
    }
  }, [effectiveProjectRelease, selectedProject]);

  const fetchModules = async () => {
if (!selectedProjectId) return;

    try {
      const response = await getModulesByProjectId(Number(selectedProjectId));

//       if (response.data) {
//         const modules = await Promise.all(
//           (response.data || []).map(async (mod: any) => {
// try {
//               const subModuleResponse = await getSubmodulesByModuleId(
//                 Number(mod.id),
//               );
//               return {
//                 id: mod.id,
//                 name: mod.name,
//                 submodules: (subModuleResponse.data || []).map((sm: any) => ({
//                   id: String(sm.id),
//                   name: sm.name,
//                 })),
//               };
//             } catch (subError) {
// return {
//                 id: mod.id,
//                 name: mod.name,
//                 submodules: [],
//               };
//             }
//           }),
//         );
// setModulesByProject((prev: any) => ({
//           ...prev,
//           [selectedProjectId]: modules,
//         }));
//       }
if (response.data) {
  const modules = await Promise.all(
    (response.data || []).map(async (mod: any) => {
      try {
        const moduleId = Number(
          mod.moduleId ?? mod.id
        );

        const subModuleResponse =
          await getSubmodulesByModuleId(moduleId);

        return {
          id: moduleId,
          name:
            mod.moduleName ||
            mod.name ||
            "",
          submodules: (
            subModuleResponse.data || []
          ).map((sm: any) => ({
            id: String(
              sm.subModuleId ?? sm.id
            ),
            name:
              sm.subModuleName ||
              sm.name ||
              "",
          })),
        };
      } catch (subError) {
        const moduleId = Number(
          mod.moduleId ?? mod.id
        );

        return {
          id: moduleId,
          name:
            mod.moduleName ||
            mod.name ||
            "",
          submodules: [],
        };
      }
    }),
  );

  setModulesByProject((prev: any) => ({
    ...prev,
    [selectedProjectId]: modules,
  }));
}
    } catch (error) {
}
  };

  const fetchQAMembers = async () => {
    if (!selectedProjectId) return;

    setQaMembersLoading(true);

    setQaMembersError(null);

    try {
      const response = await getQAMembersByProjectId(Number(selectedProjectId));

      if (response.status === "success") {
        setQaMembers(response.data || []);
      } else {
        setQaMembers([]);

        setQaMembersError(response.message || "Failed to fetch QA members");
      }
    } catch (error: unknown) {
if (error instanceof Error) {
        setQaMembersError(error.message);
      } else {
        setQaMembersError("Failed to fetch QA members");
      }

      setQaMembers([]);
    } finally {
      setQaMembersLoading(false);
    }
  };
useEffect(() => {
    if (selectedProjectId) {
fetchModules();

      fetchQAMembers();
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedModule) {
      setSubmodules([]);
      setSubmoduleError("");
      return;
    }

    const moduleObj = effectiveModules.find(
      (m: any) => m.name === selectedModule,
    );

    // if (moduleObj && moduleObj.id) {
    //   getSubmodulesByModuleId(Number(moduleObj.id))
    //     .then((res) => {
    //       if (
    //         !res.status ||
    //         !["success", "Success"].includes(res.status) ||
    //         !Array.isArray(res.data) ||
    //         res.data.length === 0
    //       ) {
    //         setSubmodules([]);
    //         setSubmoduleError(
    //           res.message || "No submodules found for this module.",
    //         );
    //         return;
    //       }

    //       const normalized = (res.data || []).map((sm: any) => ({
    //         ...sm,

    //         subModuleId: Number(sm.id || sm.subModuleId),

    //         name: sm.name || sm.subModuleName || sm.submoduleName || "Unnamed",
    //       }));

    //       setSubmodules(normalized);

    //       setSubmoduleError("");
    //     })

    //     .catch((err) => {
    //       setSubmodules([]);

    //       setSubmoduleError("Failed to fetch submodules. Please try again.");
    //     });
    // } 
    if (moduleObj && moduleObj.id) {
  getSubmodulesByModuleId(Number(moduleObj.id))
    .then((res) => {
      console.log("SUBMODULE API RESPONSE:", res);

      const subModules = Array.isArray(res?.data)
        ? res.data
        : [];

      const normalized = subModules.map((sm: any) => ({
        ...sm,
        subModuleId: Number(
          sm.subModuleId ?? sm.id
        ),
        name:
          sm.subModuleName ||
          sm.name ||
          "",
      }));

      console.log(
        "NORMALIZED SUBMODULES:",
        normalized
      );

      setSubmodules(normalized);
      setSubmoduleError("");
    })
    .catch((err) => {
      console.error(
        "SUBMODULE API ERROR:",
        err
      );

      setSubmodules([]);
      setSubmoduleError(
        "Failed to fetch submodules. Please try again."
      );
    });
} else {
      setSubmodules([]);

      setSubmoduleError("Module not found.");
    }
  }, [selectedModule]);
  useEffect(() => {
    if (selectedSubmodules.length === 0 && bulkSubmoduleSelect) {
      setBulkSubmoduleSelect(false);
    }
  }, [selectedSubmodules, bulkSubmoduleSelect]);

  useEffect(() => {
    if (activeTab === "release" && (bulkModuleSelect || bulkSubmoduleSelect)) {
      let ids: Set<string> = new Set();

      if (bulkModuleSelect && selectedModules.length > 0) {
        const testCasesToProcess =
          allocatedTestCases.length > 0
            ? allocatedTestCases
            : effectiveTestCases;
        const moduleSet = new Set(selectedModules.map(String));
        testCasesToProcess.forEach((tc: any) => {
if (moduleSet.has(String(tc.moduleId))) {
            ids.add(String(tc.id));
          }
        });
      }

      if (bulkSubmoduleSelect && selectedSubmodules.length > 0) {
        const testCasesToProcess =
          allocatedTestCases.length > 0
            ? allocatedTestCases
            : effectiveTestCases;
        const submoduleSet = new Set(selectedSubmodules.map(String));
        testCasesToProcess.forEach((tc: any) => {
if (submoduleSet.has(String(tc.subModuleId))) {
            ids.add(String(tc.id));
          }
        });
      }
setSelectedTestCases(Array.from(ids));
    } else {
      setBulkSubmoduleWarning("");
    }
  }, [
    bulkModuleSelect,
    bulkSubmoduleSelect,
    selectedModules,
    selectedSubmodules,

    allocatedTestCases,
    activeTab,
    selectedReleaseIds,
  ]);

  useEffect(() => {
const fetchBulkSubmodules = async () => {
      if (bulkModuleSelect && selectedModules.length > 0 && selectedProjectId) {
        setBulkSubmodulesLoading(true);

        try {
const moduleIds = selectedModules.map((id) => Number(id));

          try {
            const bulkSubmodulesData = await getBulkSubmodulesByModules(
              selectedProjectId,
              moduleIds,
            );
setBulkSubmodules(bulkSubmodulesData);

            const normalizedBulkSubmodules = (bulkSubmodulesData || []).map(
              (sub: any) => ({
                ...sub,
                subModuleId: sub.subModuleId || sub.id || sub.submoduleId,
              }),
            );
            setBulkSubmodules(normalizedBulkSubmodules);
          } catch (bulkError) {
const allSubmodules: BulkSubmodule[] = [];

            const moduleData = modulesByProject[selectedProjectId] || [];

            for (const moduleId of moduleIds) {
              try {
                const moduleInfo = moduleData.find(
                  (m) => m.id === String(moduleId),
                );

                const submodulesResponse =
                  await getSubmodulesByModuleId(moduleId);

                if (
                  submodulesResponse.data &&
                  Array.isArray(submodulesResponse.data)
                ) {
                  const moduleSubmodules = submodulesResponse.data.map(
                    (sub: any) => ({
                      subModuleId: sub.id || sub.subModuleId,

                      subModuleName: sub.name || sub.subModuleName,

                      moduleId: moduleId,

                      moduleName: moduleInfo?.name || `Module ${moduleId}`,
                    }),
                  );

                  allSubmodules.push(...moduleSubmodules);
                }
              } catch (moduleError) {
}
            }
setBulkSubmodules(allSubmodules);
          }
        } catch (error) {
setBulkSubmodules([]);
        } finally {
          setBulkSubmodulesLoading(false);
        }
      } else {
        setBulkSubmodules([]);
      }
    };

    fetchBulkSubmodules();
  }, [bulkModuleSelect, selectedModules, selectedProjectId]);

  useEffect(() => {
    if (bulkModuleSelect && selectedModules.length > 0 && selectedProjectId) {


      fetchTestCasesByBulkModules(selectedProjectId, selectedModules);
    } else if (bulkModuleSelect && selectedModules.length === 0) {
setAllocatedTestCases([]);
    }
  }, [bulkModuleSelect, selectedModules, selectedProjectId]);

  useEffect(() => {
    if (
      bulkSubmoduleSelect &&
      selectedSubmodules.length > 0 &&
      selectedProjectId
    ) {


      fetchTestCasesByBulkSubmodules(selectedProjectId, selectedSubmodules);
    } else if (bulkSubmoduleSelect && selectedSubmodules.length === 0) {
setAllocatedTestCases([]);
    }
  }, [bulkSubmoduleSelect, selectedSubmodules, selectedProjectId]);

  let filteredTestCases = effectiveTestCases;

  if (activeTab === "qa") {
    if (selectedReleaseForQA) {
      const allocatedTestCaseIds =
        qaAllocatedTestCases[selectedReleaseForQA] || [];

      const alreadyAllocatedTestCaseIds = Object.values(
        qaAllocations[selectedReleaseForQA] || {},
      ).flat();

      const unallocatedTestCaseIds = allocatedTestCaseIds.filter(
        (id) => !alreadyAllocatedTestCaseIds.includes(id),
      );

      const allocatedTestCases = effectiveTestCases.filter((tc: any) =>
        allocatedTestCaseIds.includes(tc.id),
      );

      filteredTestCases = allocatedTestCases.filter((tc: any) =>
        unallocatedTestCaseIds.includes(tc.id),
      );
    } else {
      filteredTestCases = [];
    }
  } else if (
    activeTab === "release" &&
    selectedReleaseIds.length > 0 &&
    (bulkModuleSelect || bulkSubmoduleSelect)
  ) {
    let ids: Set<string> = new Set();

    if (bulkModuleSelect && selectedModules.length > 0) {
      if (allocatedTestCases.length > 0) {
        filteredTestCases = allocatedTestCases;
      } else {
        effectiveTestCases.forEach((tc: any) => {
          if (selectedModules.includes(String(tc.moduleId))) ids.add(tc.id);
        });

        filteredTestCases = effectiveTestCases.filter((tc: any) =>
          ids.has(tc.id),
        );
      }
    }

    if (bulkSubmoduleSelect && selectedSubmodules.length > 0) {
      if (allocatedTestCases.length > 0) {
        filteredTestCases = allocatedTestCases;
      } else {
        effectiveTestCases.forEach((tc: any) => {
          if (selectedSubmodules.includes(String(tc.subModuleId)))
            ids.add(tc.id);
        });

        filteredTestCases = effectiveTestCases.filter((tc: any) =>
          ids.has(tc.id),
        );
      }
    }
  } else if (selectedSubmodule) {
    filteredTestCases = allocatedTestCases;
  } else if (selectedModule) {
    if (allocatedTestCases.length > 0) {
      filteredTestCases = allocatedTestCases;
    } else {
      filteredTestCases = effectiveTestCases.filter(
        (tc: any) => tc.module === selectedModule,
      );
    }
  }

  const getAllocatedTestCasesForQA = (qaId: string) => {
    if (!selectedReleaseForQA) return [];

    return qaAllocations[selectedReleaseForQA]?.[qaId] || [];
  };

  const isTestCaseAllocated = (testCaseId: string) => {
    if (!selectedReleaseForQA) return false;

    return Object.values(qaAllocations[selectedReleaseForQA] || {}).some(
      (allocations) => allocations.includes(testCaseId),
    );
  };

  const allocateTestCasesToQA = async (qaId: string, testCaseIds: string[]) => {
    if (!selectedReleaseForQA) return;

    setQaAllocationLoading(true);

    setQaAllocationError(null);

    setQaAllocationSuccess(null);

    try {
      const testCaseIdsAsNumbers = testCaseIds
        .map((id) => {
          if (typeof id === "number") return id;

          return parseInt(String(id), 10);
        })
        .filter((id) => !isNaN(id));

const response = await bulkAssignOwner(
        Number(qaId),
        testCaseIdsAsNumbers,
      );

      if (response.status === "success" || response.statusCode === 2000) {
        setQaAllocations((prev) => ({
          ...prev,

          [selectedReleaseForQA]: {
            ...(prev[selectedReleaseForQA] || {}),

            [qaId]: [
              ...(prev[selectedReleaseForQA]?.[qaId] || []),
              ...testCaseIds,
            ],
          },
        }));

        setSelectedTestCasesForQA((prev) => ({
          ...prev,

          [selectedReleaseForQA]: [],
        }));

        setQaAllocationSuccess(
          response.message || "Test cases successfully allocated to QA member!",
        );
      } else {
        setQaAllocationError(
          response.message || "Failed to allocate test cases",
        );
      }
    } catch (error: any) {
setQaAllocationError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to allocate test cases",
      );
    } finally {
      setQaAllocationLoading(false);
    }
  };

  const removeAllocationFromQA = (qaId: string, testCaseId: string) => {
    if (!selectedReleaseForQA) return;

    setQaAllocations((prev) => ({
      ...prev,

      [selectedReleaseForQA]: {
        ...(prev[selectedReleaseForQA] || {}),

        [qaId]: (prev[selectedReleaseForQA]?.[qaId] || []).filter(
          (id) => id !== testCaseId,
        ),
      },
    }));
  };

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);

    setSelectedProject(id);

    setSelectedReleaseIds([]);

    setSelectedIds([]);

    setSelectedModule("");

    setSelectedSubmodule("");

    setSelectedTestCases([]);

    setSelectedModules([]);

    setSelectedSubmodules([]);

    setBulkModuleSelect(false);

    setBulkSubmoduleSelect(false);

    setBulkSubmodules([]);

    setBulkSubmodulesLoading(false);

    setAllocatedTestCases([]);

    setAllocationMode("one-to-one");

    setAllocationSuccess(null);

    setAllocationError(null);

    setAllocationProgress(null);

    setSelectedQA(null);

    setSelectedReleaseForQA(null);

    setQaMembers([]);

    setQaMembersError(null);

    setQaAllocatedTestCases({});

    setQaAllocations({});

    setSelectedTestCasesForQA({});

    setQaAllocatedTestCasesData([]);

    setQaTestCasesError(null);

    setQaAllocationLoading(false);

    setQaAllocationError(null);

    setQaAllocationSuccess(null);

    setQaReleaseTestCases([]);
    setQaReleaseTestCasesError(null);

    setLoadingModuleTestCases(false);
    setLoadingSubmoduleTestCases(false);

    setBulkModuleSelect(false);
    setBulkSubmoduleSelect(false);
    setSelectedModules([]);
    setSelectedSubmodules([]);
  };

  const ProjectSelectionPanel = () => (
    <ProjectSelector
      projects={projects}

      selectedProjectId={selectedProjectId || null}

      onSelect={(id: string) => {
        (setSelectedProjectId(id), handleProjectSelect(id));
      }}

      className="mb-4"
    />
  );

  const handleAllocate = async () => {
    console.log("===== ALLOCATION DEBUG =====");
console.log("selectedTestCases:", selectedTestCases);
console.log("selectedReleaseIds:", selectedReleaseIds);
console.log(
  "effectiveTestCases:",
  effectiveTestCases.map((tc: any) => ({
    id: tc.id,
    testCaseId: tc.testCaseId,
    testcaseNo: tc.testcaseNo,
  })),
);
    if (selectedReleaseIds.length === 0 || selectedTestCases.length === 0) {
      setAllocationError("Please select at least one release and test case.");
      return;
    }

    setAllocationLoading(true);
    setAllocationError(null);
    setAllocationSuccess(null);
    setAllocationProgress(null);

    try {
      if (allocationMode === "one-to-one") {
        const total = selectedReleaseIds.length * selectedTestCases.length;
        let completed = 0;
        let totalAllocated = 0;
        let totalFailed = 0;
        let failedDetails: {
          testCaseId: string;
          testCaseNo: string;
          releaseId: number;
          error: string;
        }[] = [];

        const releaseNames = selectedIds.map((id) => {
          const release = effectiveProjectRelease.find(
            (r) => (r.releaseId || r.id) === Number(id),
          );
          return release?.releaseName || release?.name || `Release ${id}`;
        });

        const releaseNameMap = new Map<number, string>();
        selectedIds.forEach((id, index) => {
          releaseNameMap.set(Number(id), releaseNames[index]);
        });

        const testCaseMap = new Map<string, string>();
        effectiveTestCases.forEach((tc: any) => {
          testCaseMap.set(
            String(tc.id),
            tc.testcaseNo || tc.testCaseId || String(tc.id),
          );
        });

        console.log("selectedIds:", selectedIds);
console.log(
  "selectedIds details:",
  selectedIds.map((id) => ({
    value: id,
    type: typeof id,
    numberValue: Number(id),
  })),
);
console.log("selectedReleaseIds:", selectedReleaseIds);

        for (const releaseId of selectedIds) {
          for (const testCaseId of selectedTestCases) {
            const testCaseNo =
              testCaseMap.get(String(testCaseId)) || testCaseId;

            try {
              console.log("releaseId from loop/caller:", releaseId);
console.log("releaseId type:", typeof releaseId);
console.log("selectedReleaseIds:", selectedReleaseIds);
              const response = await allocateTestCaseToRelease(
                Number(releaseId),
                Number(testCaseId),
              );
              const allocated =
                response?.data?.data || response?.data || response || [];
              if (Array.isArray(allocated) && allocated.length > 0) {
                totalAllocated++;
              }
            } catch (error: any) {
            
  totalFailed++;

  let errorMessage =
    error?.response?.data?.statusMessage ||
    error?.response?.data?.message ||
    error?.response?.data?.data?.statusMessage ||
    error?.response?.data?.data?.message ||
    error?.message ||
    "Unknown error";

  errorMessage = errorMessage.replace(
    /Test case \d+/,
    `Test case ${testCaseNo}`,
  );

  failedDetails.push({
    testCaseId: String(testCaseId),
    testCaseNo: String(testCaseNo),
    releaseId: Number(releaseId),
    error: errorMessage,
  });
}
            completed++;
            setAllocationProgress({ current: completed, total });
          }
        }

        let message = "";
        if (totalAllocated > 0 && totalFailed === 0) {
          message = `✅ ${totalAllocated} allocation(s) completed successfully!`;
        } else if (totalAllocated > 0 && totalFailed > 0) {
          message = `⚠️ ${totalAllocated} allocation(s) completed. ${totalFailed} failed.\n\n`;
          failedDetails.forEach((detail) => {
            const releaseName =
              releaseNameMap.get(detail.releaseId) ||
              `Release ${detail.releaseId}`;
            message += `❌ ${detail.error} → ${releaseName}\n`;
          });
        } else if (totalAllocated === 0 && totalFailed > 0) {
          message = `❌ All allocations failed.\n\n`;
          failedDetails.forEach((detail) => {
            const releaseName =
              releaseNameMap.get(detail.releaseId) ||
              `Release ${detail.releaseId}`;
            message += `❌ ${detail.error} → ${releaseName}\n`;
          });
        } else {
          message = `❌ No test cases were allocated. All selected test cases may already be allocated.`;
        }

        if (totalAllocated === 0) {
          showAlert(message);
          setAllocationLoading(false);
          setAllocationProgress(null);
          return;
        } else {
          showAlert(message);
        }
      } else if (allocationMode === "one-to-many") {
        const total = selectedTestCases.length;
        let completed = 0;
        let totalAllocated = 0;
        let totalFailed = 0;
        let failedDetails: {
          testCaseId: string;
          testCaseNo: string;
          releaseId: number;
          error: string;
        }[] = [];

        const releaseNames = selectedIds.map((id) => {
          const release = effectiveProjectRelease.find(
            (r) => (r.releaseId || r.id) === Number(id),
          );
          return release?.releaseName || release?.name || `Release ${id}`;
        });

        const releaseNameMap = new Map<number, string>();
        selectedIds.forEach((id, index) => {
          releaseNameMap.set(Number(id), releaseNames[index]);
        });

        const testCaseMap = new Map<string, string>();
        effectiveTestCases.forEach((tc: any) => {
          testCaseMap.set(
            String(tc.id),
            tc.testcaseNo || tc.testCaseId || String(tc.id),
          );
        });

        for (const testCaseId of selectedTestCases) {
          const testCaseNo = testCaseMap.get(String(testCaseId)) || testCaseId;

          try {
            const response = await allocateTestCaseToMultipleReleases(
              testCaseId,
              selectedIds,
            );

            totalAllocated += response.results.length;
            totalFailed += response.failed.length;

            response.failed.forEach((f) => {
              let errorMsg = f.error;

              const testCaseMatch = errorMsg.match(/Test case (\d+)/);
              if (testCaseMatch) {
                errorMsg = errorMsg.replace(
                  /Test case \d+/,
                  `Test case ${testCaseNo}`,
                );
              }

              failedDetails.push({
                testCaseId: String(testCaseId),
                testCaseNo: String(testCaseNo),
                releaseId: Number(f.releaseId),
                error: errorMsg,
              });
            });
          } catch (error) {
totalFailed += selectedIds.length;
          }
          completed++;
          setAllocationProgress({ current: completed, total });
        }

        let message = "";
        if (totalAllocated > 0 && totalFailed === 0) {
          message = `✅ ${totalAllocated} test case(s) allocated successfully to ${selectedIds.length} release(s)!`;
        } else if (totalAllocated > 0 && totalFailed > 0) {
          message = `⚠️ ${totalAllocated} allocation(s) completed. ${totalFailed} failed.\n\n`;
          failedDetails.forEach((detail) => {
            const releaseName =
              releaseNameMap.get(detail.releaseId) ||
              `Release ${detail.releaseId}`;
            message += `❌ ${detail.error} → ${releaseName}\n`;
          });
        } else if (totalAllocated === 0 && totalFailed > 0) {
          message = `❌ All allocations failed.\n\n`;
          failedDetails.forEach((detail) => {
            const releaseName =
              releaseNameMap.get(detail.releaseId) ||
              `Release ${detail.releaseId}`;
            message += `❌ ${detail.error} → ${releaseName}\n`;
          });
        } else {
          message = `❌ No test cases were allocated. All selected test cases may already be allocated.`;
        }

        if (totalAllocated === 0) {
          showAlert(message);
          setAllocationLoading(false);
          setAllocationProgress(null);
          return;
        } else {
          showAlert(message);
        }
      } else if (allocationMode === "bulk") {
        setAllocationProgress({ current: 0, total: 1 });

        const releaseName = selectedIds.map((id) => {
          const release = effectiveProjectRelease.find(
            (r) => (r.releaseId || r.id) === Number(id),
          );
          return release?.releaseName || release?.name || `Release ${id}`;
        })[0];

        const response = await bulkAllocateTestCasesToReleases(
          selectedTestCases,
          selectedIds[0],
        );

        const allocatedTestCases =
          response?.data?.data || response?.data || response || [];
        const totalRequested = selectedTestCases.length;
        const successfullyAllocated = Array.isArray(allocatedTestCases)
          ? allocatedTestCases.length
          : 0;
        const skipped = totalRequested - successfullyAllocated;

        let message = "";
        if (successfullyAllocated === 0 && skipped > 0) {
          message = `📊 Allocation Summary:\n\n`;
          message += `ℹ️ Release "${releaseName}": 0 new test cases allocated, ${skipped} already existed.\n`;
        } else if (successfullyAllocated > 0 && skipped > 0) {
          message = `📊 Allocation Summary:\n\n`;
          message += `✅ Release "${releaseName}": ${successfullyAllocated} new test case(s) successfully allocated, ${skipped} already existed.\n`;
        } else if (successfullyAllocated > 0 && skipped === 0) {
          message = `📊 Allocation Summary:\n\n`;
          message += `✅ Release "${releaseName}": ${successfullyAllocated} new test case(s) successfully allocated.\n`;
        } else {
          message = `❌ No test cases were allocated. Please check your selection.`;
        }

        showAlert(message);
        setAllocationProgress({ current: 1, total: 1 });

        if (successfullyAllocated === 0) {
          setAllocationLoading(false);
          setAllocationProgress(null);
          return;
        }
      } else if (allocationMode === "many-to-many") {
        setAllocationProgress({ current: 0, total: 1 });

        const getReleaseNames = () => {
          return selectedIds.map((id) => {
            const release = effectiveProjectRelease.find(
              (r) => (r.releaseId || r.id) === Number(id),
            );
            return release?.releaseName || release?.name || `Release ${id}`;
          });
        };

        const response = await allocateTestCasesToManyReleases(
          selectedIds,
          getReleaseNames(),
          selectedTestCases,
        );

        const results = Array.isArray(response) ? response : [response];

        let totalAllocated = 0;
        let failedReleases: { name: string; error: string }[] = [];

        const releaseDetails: {
          name: string;
          allocated: number;
          skipped: number;
          allocatedTestCases: string[];
        }[] = [];

        results.forEach((result: any) => {
          const releaseName =
            result.releaseName || `Release ${result.releaseId}`;

          if (result.status === "fulfilled" && result.data) {
            const allocated = result.data?.data || result.data || [];
            const allocatedCount = Array.isArray(allocated)
              ? allocated.length
              : 0;
            totalAllocated += allocatedCount;

            const allocatedTestCasesForRelease: string[] = [];
            if (Array.isArray(allocated)) {
              allocated.forEach((tc: any) => {
                allocatedTestCasesForRelease.push(
                  String(tc.testCaseId || tc.id),
                );
              });
            }

            const skippedForRelease = selectedTestCases.length - allocatedCount;
            releaseDetails.push({
              name: releaseName,
              allocated: allocatedCount,
              skipped: skippedForRelease,
              allocatedTestCases: allocatedTestCasesForRelease,
            });
          } else if (result.status === "rejected") {
            const errorMessage =
              result.error?.response?.data?.message ||
              result.error?.message ||
              "Unknown error occurred";
            failedReleases.push({
              name: releaseName,
              error: errorMessage,
            });
            releaseDetails.push({
              name: releaseName,
              allocated: 0,
              skipped: selectedTestCases.length,
              allocatedTestCases: [],
            });
          }
        });

        let message = "";

        if (failedReleases.length === 0 && totalAllocated > 0) {
          message = `📊 Allocation Summary:\n\n`;

          releaseDetails.forEach((detail) => {
            if (detail.allocated > 0 && detail.skipped > 0) {
              message += `✅ Release "${detail.name}": ${detail.allocated} new test case(s) successfully allocated, ${detail.skipped} already existed.\n`;
            } else if (detail.allocated > 0 && detail.skipped === 0) {
              message += `✅ Release "${detail.name}": ${detail.allocated} new test case(s) successfully allocated.\n`;
            } else if (detail.allocated === 0 && detail.skipped > 0) {
              message += `ℹ️ Release "${detail.name}": 0 new test cases allocated, ${detail.skipped} already existed.\n`;
            } else {
              message += `ℹ️ Release "${detail.name}": No changes made.\n`;
            }
          });
        } else if (failedReleases.length === 0 && totalAllocated === 0) {
          message = `📊 Allocation Summary:\n\n`;
          message += `ℹ️ No new test cases allocated.\n\n`;
          releaseDetails.forEach((detail) => {
            message += `ℹ️ Release "${detail.name}": 0 new test cases allocated, ${detail.skipped} already existed.\n`;
          });
        } else if (failedReleases.length > 0 && totalAllocated > 0) {
          message = `⚠️ Partial Success:\n\n`;
          releaseDetails.forEach((detail) => {
            const isFailed = failedReleases.find(
              (fr) => fr.name === detail.name,
            );
            if (isFailed) {
              message += `❌ Release "${detail.name}": Failed - ${isFailed.error}\n`;
            } else if (detail.allocated > 0 && detail.skipped > 0) {
              message += `✅ Release "${detail.name}": ${detail.allocated} new test case(s) successfully allocated, ${detail.skipped} already existed.\n`;
            } else if (detail.allocated > 0) {
              message += `✅ Release "${detail.name}": ${detail.allocated} new test case(s) successfully allocated.\n`;
            } else if (detail.skipped > 0) {
              message += `ℹ️ Release "${detail.name}": 0 new test cases allocated, ${detail.skipped} already existed.\n`;
            } else {
              message += `ℹ️ Release "${detail.name}": No changes made.\n`;
            }
          });
        } else if (failedReleases.length > 0 && totalAllocated === 0) {
          message = `❌ Allocation failed for all releases:\n\n`;
          failedReleases.forEach((fr) => {
            message += `❌ Release "${fr.name}": ${fr.error}\n`;
          });
        } else {
          message = `ℹ️ No changes made. All test cases were already allocated.`;
        }

        showAlert(message);
        setAllocationProgress({ current: 1, total: 1 });

        if (totalAllocated === 0) {
          setAllocationLoading(false);
          setAllocationProgress(null);
          return;
        }
      }

      setTimeout(() => {
        setSelectedTestCases([]);
        setSelectedReleaseIds([]);
        setSelectedIds([]);
        setActiveTab("qa");
        setAllocationSuccess(null);
        setAllocationProgress(null);
      }, 1500);
    } catch (error: any) {
  const msg =
    error?.response?.data?.statusMessage ||
    error?.response?.data?.message ||
    error?.response?.data?.data?.statusMessage ||
    error?.response?.data?.data?.message ||
    error?.message ||
    "Failed to allocate test case.";

  showAlert(msg);
} finally {
  setAllocationLoading(false);
}
  };

  // const handleSelectSubModule = (selectedSubmoduleId: string) => {
  //   setSelectedSubmodule(selectedSubmoduleId);

  //   setSelectedTestCases([]);

  //   if (selectedProjectId) {
  //     fetchTestCasesBySubmodule(selectedProjectId, selectedSubmoduleId);
  //   }
  // };

 const handleSelectSubModule = (
  selectedSubmoduleId: string,
) => {
  setSelectedSubmodule(selectedSubmoduleId);
  setSelectedTestCases([]);

  const moduleObj = effectiveModules.find(
    (m: any) => m.name === selectedModule,
  );

  if (
  selectedProjectId &&
  selectedReleaseIds.length > 0 &&
  moduleObj?.id &&
  selectedSubmoduleId
) {
  fetchTestCasesBySubmodule(
    Number(selectedProjectId),
    Number(selectedReleaseIds[0]),
    Number(moduleObj.id),
    Number(selectedSubmoduleId),
  );
}
};
  const ReleaseCardsPanel = () => (
    <div className="mb-4">
      <div className="flex space-x-2 overflow-x-auto">
        {effectiveProjectRelease.map((release: any) => {
  const releaseId = Number(release.releaseId ?? release.id);
  const ids = releaseId;
const isSelected = selectedReleaseIds.includes(ids);

          return (
            <div
              key={ids}

              className={`min-w-[160px] px-4 py-2 rounded-md border text-left transition-all duration-200 focus:outline-none text-sm font-medium shadow-sm flex flex-col items-start relative bg-white

                ${
                  isSelected
                    ? "border-blue-500 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md hover:ring-1 hover:ring-blue-300"
                    : "border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md hover:ring-1 hover:ring-blue-300"
                }`}

              style={{
                boxShadow: isSelected ? "0 0 0 2px #3b82f6" : undefined,
              }}
            >
              <div className="truncate font-semibold mb-1">
                {release.releaseName || release.name}
              </div>

              <div className="text-xs text-gray-500 mb-2">
                Version: {release.releaseVersion}
              </div>

              <Button
                size="sm"

                variant={isSelected ? "primary" : "secondary"}

                className="w-full"

                onClick={() => {
                  if (
                    allocationMode === "one-to-one" ||
                    allocationMode === "bulk"
                  ) {
                    setSelectedReleaseIds(isSelected ? [] : [releaseId]);

                    setSelectedIds(isSelected ? [] : [ids]);
                  } else {
                    setSelectedReleaseIds((prev) =>
                      isSelected
                        ? prev.filter((id) => id !== releaseId)
                        : [...prev, releaseId],
                    );

                    setSelectedIds((prev) =>
                      isSelected
                        ? prev.filter((id) => id !== ids)
                        : [...prev, ids],
                    );
                  }
                }}

                disabled={
                  (allocationMode === "one-to-one" ||
                    allocationMode === "bulk") &&
                  !isSelected &&
                  selectedReleaseIds.length >= 1
                }
              >
                {isSelected ? "Selected" : "Select"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const ModuleSelectionPanel = () => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Module Selection
          </h2>

          {(allocationMode === "bulk" || allocationMode === "many-to-many") &&
            activeTab === "release" &&
            selectedReleaseIds.length > 0 && (
              <Button
                size="sm"

                variant={bulkModuleSelect ? "primary" : "secondary"}

                onClick={() => {
                  setBulkModuleSelect((v) => !v);

                  setSelectedModules([]);

                  setSelectedTestCases([]);

                  setBulkSubmodules([]);

                  setSelectedSubmodules([]);

                  setBulkSubmoduleSelect(false);

                  setAllocatedTestCases([]);
                }}
              >
                {bulkModuleSelect
                  ? "Cancel Bulk Module Select"
                  : "Bulk Select Modules"}
              </Button>
            )}
        </div>

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

          <div
            id="module-scroll"

            className="flex space-x-2 overflow-x-auto pb-2 scroll-smooth flex-1"

            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {effectiveModules.map((module: any) => {
              const moduleTestCases = effectiveTestCases.filter(
                (tc: any) => tc.module === module.name,
              );

              const isSelected = bulkModuleSelect
                ? selectedModules.includes(String(module.id))
                : selectedModule === module.name;

              return (
                <Button
                  key={module.id}

                  variant={isSelected ? "primary" : "secondary"}

                  onClick={() => {
                    if (bulkModuleSelect) {
                      setSelectedModules((prev) => {
                        const newSelection = prev.includes(String(module.id))
                          ? prev.filter((m) => m !== String(module.id))
                          : [...prev, String(module.id)];

                        if (newSelection.length === 0) {
                          setAllocatedTestCases([]);
                        }

                        return newSelection;
                      });
                    } else {
                      setSelectedModule(module.name);

                      setSelectedSubmodule("");

                      setSelectedTestCases([]);

                      setAllocatedTestCases([]);

                      setQaAllocatedTestCasesData([]);
                      setQaTestCasesError(null);

//                       if (selectedProjectId && module.id) {
// fetchTestCasesByModule(
//                           selectedProjectId,
//                           String(module.id),
//                         );
//                       } else {
// }
                    }
                  }}

                  className={`whitespace-nowrap m-2 ${isSelected ? " ring-2 ring-blue-400 border-blue-500" : ""}`}
                >
                  {module.name}
                </Button>
              );
            })}
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
  );

  const SubmoduleSelectionPanel = () => {
if (bulkModuleSelect && selectedModules.length > 0) {
      return (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Submodules for Selected Modules ({bulkSubmodules.length} found)
              </h2>
              {(allocationMode === "bulk" ||
                allocationMode === "many-to-many") &&
                activeTab === "release" && (
                  <Button
                    size="sm"
                    variant={bulkSubmoduleSelect ? "primary" : "secondary"}
                    onClick={() => {
                      setBulkSubmoduleSelect((v) => !v);
                      setSelectedSubmodules([]);
                      setSelectedTestCases([]);

                      setAllocatedTestCases([]);
                    }}
                  >
                    {bulkSubmoduleSelect
                      ? "Cancel Bulk Submodules"
                      : "Bulk Select SubModules"}
                  </Button>
                )}
            </div>

            {bulkSubmodulesLoading && (
              <div className="text-center py-4">
                <div className="text-gray-500">Loading submodules...</div>
              </div>
            )}

            {!bulkSubmodulesLoading && bulkSubmodules.length === 0 && (
              <div className="text-center py-4">
                <div className="text-gray-500 italic">
                  No submodules found for selected modules
                  <br />
                  <small className="text-xs">
                    Selected modules: {selectedModules.join(", ")} | Project:{" "}
                    {selectedProjectId}
                  </small>
                </div>
              </div>
            )}

            {!bulkSubmodulesLoading && bulkSubmodules.length > 0 && (
              <>
                {!bulkSubmoduleSelect && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-800">
                      💡 Click on any submodule to start bulk selection, or use
                      the "Bulk Select SubModules" button above
                    </div>
                  </div>
                )}

                {bulkSubmoduleSelect && selectedSubmodules.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800">
                      ✅ {selectedSubmodules.length} submodule(s) selected
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {selectedModules.map((moduleId) => {
                    const moduleSubmodules = bulkSubmodules.filter(
                      (sub) => sub.moduleId === Number(moduleId),
                    );
                    const moduleName =
                      moduleSubmodules[0]?.moduleName || `Module ${moduleId}`;

                    if (moduleSubmodules.length === 0) return null;

                    return (
                      <div
                        key={moduleId}
                        className="border rounded-lg p-3 bg-gray-50"
                      >
                        <h4 className="font-medium text-gray-800 mb-2">
                          {moduleName}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {moduleSubmodules.map((submodule) => {
                            const isSelected = bulkSubmoduleSelect
                              ? selectedSubmodules.includes(
                                  String(submodule.subModuleId),
                                )
                              : false;

                            return (
                              <Button
                                key={submodule.subModuleId}
                                size="sm"
                                variant={isSelected ? "primary" : "secondary"}
                                onClick={() => {
                                  if (bulkSubmoduleSelect) {
                                    setSelectedSubmodules((prev) => {
                                      const submoduleId = String(
                                        submodule.subModuleId,
                                      );
                                      let newSelection;
                                      if (prev.includes(submoduleId)) {
                                        newSelection = prev.filter(
                                          (s) => s !== submoduleId,
                                        );
                                      } else {
                                        newSelection = [...prev, submoduleId];
                                      }

                                      if (newSelection.length === 0) {
                                        setAllocatedTestCases([]);
                                        setSelectedTestCases([]);
                                      }

                                      return newSelection;
                                    });
                                  } else {
                                    setBulkSubmoduleSelect(true);
                                    setSelectedSubmodules([
                                      String(submodule.subModuleId),
                                    ]);
                                  }
                                }}
                                className={`${isSelected ? "ring-2 ring-blue-400 border-blue-500" : ""}`}
                              >
                                {submodule.subModuleName}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Submodule Selection
            </h2>
            {(allocationMode === "bulk" || allocationMode === "many-to-many") &&
              activeTab === "release" && (
                <Button
                  size="sm"
                  variant={bulkSubmoduleSelect ? "primary" : "secondary"}
                  onClick={() => {
                    setBulkSubmoduleSelect((v) => !v);
                    setSelectedSubmodules([]);
                    setSelectedTestCases([]);
                    setAllocatedTestCases([]);
                  }}
                >
                  {bulkSubmoduleSelect ? "Cancel Bulk" : "Bulk Select"}
                </Button>
              )}
          </div>
          {submoduleError && (
            <div className="mb-2 text-red-600 text-sm">{submoduleError}</div>
          )}
          <div className="relative flex items-center">
            <button
              onClick={() => {
                const container = document.getElementById("submodule-scroll");
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
              {/* {submodules.map((submodule: any) => {
                const isSelected = bulkSubmoduleSelect
                  ? selectedSubmodules.includes(String(submodule.subModuleId))
                  : selectedSubmodule === String(submodule.subModuleId);
                return (
                  <Button
                    key={submodule.subModuleId}
                    variant={isSelected ? "primary" : "secondary"}
                    onClick={() => {
                      if (bulkSubmoduleSelect) {
                        setSelectedSubmodules((prev) => {
                          const submoduleId = String(submodule.subModuleId);
                          let newSelection;
                          if (prev.includes(submoduleId)) {
                            newSelection = prev.filter(
                              (s) => s !== submoduleId,
                            );
                          } else {
                            newSelection = [...prev, submoduleId];
                          }

                          if (newSelection.length === 0) {
                            setAllocatedTestCases([]);
                            setSelectedTestCases([]);
                          }

                          return newSelection;
                        });
                      } else {
                        setQaAllocatedTestCasesData([]);
                        setQaTestCasesError(null);
                        handleSelectSubModule(String(submodule.subModuleId));
                        setSelectedSubmodule(String(submodule.subModuleId));
                      }
                    }}
                    className={`whitespace-nowrap m-2 ${isSelected ? " ring-2 ring-blue-400 border-blue-500" : ""}`}
                  >
                    {submodule.name}
                  </Button>
                );
              })} */}
              {submodules.map((submodule: any) => {
  const submoduleId = String(
    submodule.id ?? submodule.subModuleId
  );

  const isSelected = bulkSubmoduleSelect
    ? selectedSubmodules.includes(submoduleId)
    : selectedSubmodule === submoduleId;

  return (
    <Button
      key={submoduleId}
      variant={isSelected ? "primary" : "secondary"}
      onClick={() => {
        if (bulkSubmoduleSelect) {
          setSelectedSubmodules((prev) => {
            let newSelection;

            if (prev.includes(submoduleId)) {
              newSelection = prev.filter(
                (s) => s !== submoduleId
              );
            } else {
              newSelection = [
                ...prev,
                submoduleId,
              ];
            }

            if (newSelection.length === 0) {
              setAllocatedTestCases([]);
              setSelectedTestCases([]);
            }

            return newSelection;
          });
        } else {
          setQaAllocatedTestCasesData([]);
          setQaTestCasesError(null);

          handleSelectSubModule(submoduleId);
          setSelectedSubmodule(submoduleId);
        }
      }}
      className={`whitespace-nowrap m-2 ${
        isSelected
          ? "ring-2 ring-blue-400 border-blue-500"
          : ""
      }`}
    >
      {submodule.name}
    </Button>
  );
})}
            </div>
            <button
              onClick={() => {
                const container = document.getElementById("submodule-scroll");
                if (container) container.scrollLeft += 200;
              }}
              className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 ml-2"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const formatTestCaseId = (id: string | number): string => {
    const numericId = String(id).padStart(4, "0");

    return `${numericId}`;
  };

  // const getSeverityColor = (
  //   severity: string,
  // ): { className: string; style: React.CSSProperties } => {
  //   const severityConfig = severities.find(
  //     (s) => s.name.toLowerCase() === severity.toLowerCase(),
  //   );

  //   if (severityConfig && severityConfig.color) {
  //     return {
  //       className: "px-2 py-1 rounded-full text-xs font-medium",

  //       style: {
  //         backgroundColor: severityConfig.color,

  //         color: "#ffffff",
  //       },
  //     };
  //   }

  //   let className = "px-2 py-1 rounded-full text-xs font-medium ";

  //   switch (severity.toLowerCase()) {
  //     case "critical":

  //     case "very high":
  //       className += "bg-red-100 text-red-800";

  //       break;

  //     case "high":
  //       className += "bg-orange-100 text-orange-800";

  //       break;

  //     case "medium":
  //       className += "bg-yellow-100 text-yellow-800";

  //       break;

  //     case "low":
  //       className += "bg-green-100 text-green-800";

  //       break;

  //     default:
  //       className += "bg-gray-100 text-gray-800";
  //   }

  //   return {
  //     className,

  //     style: {},
  //   };
  // };

  const getSeverityColor = (
  severity: string,
): { className: string; style: React.CSSProperties } => {
  const severityName = String(severity || "").trim();

  const severityConfig = severities.find(
    (s: any) =>
      String(s?.name || "").trim().toLowerCase() ===
      severityName.toLowerCase(),
  );

  if (severityConfig?.color) {
    return {
      className:
        "px-2 py-1 rounded-full text-xs font-medium",
      style: {
        backgroundColor: severityConfig.color,
        color: "#ffffff",
      },
    };
  }

  return {
    className:
      "px-2 py-1 rounded-full text-xs font-medium",
    style: {},
  };
};

  const handleSelectAll = (checked: boolean, displayTestCases: any[]) => {
    if (activeTab === "qa") {
      if (!selectedReleaseForQA) return;
      if (checked) {
        setSelectedTestCasesForQA((prev) => ({
          ...prev,
          [selectedReleaseForQA]: displayTestCases.map((tc: any) =>
            String(tc.id),
          ),
        }));
      } else {
        setSelectedTestCasesForQA((prev) => ({
          ...prev,
          [selectedReleaseForQA]: [],
        }));
      }
    } else {
      if (allocationMode === "bulk" || allocationMode === "many-to-many") {
        if (checked) {
          const allIds = displayTestCases.map((tc: any) => String(tc.id));
setSelectedTestCases(allIds);
        } else {
          setSelectedTestCases([]);
        }
      } else {
        if (checked && displayTestCases.length > 0) {
          setSelectedTestCases([String(displayTestCases[0].id)]);
        } else {
          setSelectedTestCases([]);
        }
      }
    }
  };

  const handleSelectTestCase = (testCaseId: string, checked: boolean) => {
    console.log("SELECTED TEST CASE ID:", testCaseId);
  console.log("SELECTED TEST CASE ID TYPE:", typeof testCaseId);

    if (activeTab === "qa") {
      if (!selectedReleaseForQA) return;
      if (checked) {
        setSelectedTestCasesForQA((prev) => ({
          ...prev,
          [selectedReleaseForQA]: [
            ...(prev[selectedReleaseForQA] || []),
            testCaseId,
          ],
        }));
      } else {
        setSelectedTestCasesForQA((prev) => ({
          ...prev,
          [selectedReleaseForQA]: (prev[selectedReleaseForQA] || []).filter(
            (id) => id !== testCaseId,
          ),
        }));
      }
    } else {
      if (allocationMode === "one-to-one" || allocationMode === "one-to-many") {
        if (checked) {
          setSelectedTestCases([testCaseId]);
        } else {
          setSelectedTestCases([]);
        }
      } else {
        if (checked) {
          setSelectedTestCases((prev) => [...prev, testCaseId]);
        } else {
          setSelectedTestCases((prev) =>
            prev.filter((id) => id !== testCaseId),
          );
        }
      }
    }
  };

  // const TestCaseTable = ({ testCases }: { testCases?: any[] }) => {
  //   const displayTestCases = (() => {
  //     if (activeTab === "qa" && qaAllocatedTestCasesData.length > 0) {
  //       return qaAllocatedTestCasesData.map(
  //         (tc: allocated_testcase_details) => ({
  //           id: tc.id,

  //           testCaseId: tc.testCaseId,

  //           description: tc.description,

  //           steps: tc.testSteps,

  //           type: tc.type,

  //           severity: tc.severity,
  //         }),
  //       );
  //     }

  //     return testCases || allocatedTestCases;
  //   })();

  const TestCaseTable = ({ testCases }: { testCases?: any[] }) => {
  const displayTestCases = (() => {
    const source =
      activeTab === "qa" && qaAllocatedTestCasesData.length > 0
        ? qaAllocatedTestCasesData
        : testCases || allocatedTestCases;

    return source.map((tc: any) => ({
      ...tc,
      id: tc.id ?? tc.testCaseId,
      steps: tc.testSteps ?? tc.steps ?? "",
    }));
  })();

    return (
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={
                      activeTab === "qa"
                        ? selectedReleaseForQA
                          ? (selectedTestCasesForQA[selectedReleaseForQA]
                              ?.length ?? 0) === displayTestCases.length &&
                            displayTestCases.length > 0
                          : false
                        : allocationMode === "one-to-one" ||
                            allocationMode === "one-to-many"
                          ? selectedTestCases.length === 1 &&
                            displayTestCases.length > 0
                          : selectedTestCases.length ===
                              displayTestCases.length &&
                            displayTestCases.length > 0
                    }
                    onChange={(e) =>
                      handleSelectAll(e.target.checked, displayTestCases)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Case ID
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Steps
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {displayTestCases.map((tc: any) => {
                console.log("TEST CASE:", tc);
  console.log("TEST CASE STEPS:", tc.steps);
                const testCaseId = tc.id ?? tc.testCaseId;

                return (
                  <tr key={testCaseId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"

                        checked={
                          activeTab === "qa"
                            ? selectedReleaseForQA
                              ? (selectedTestCasesForQA[
                                  selectedReleaseForQA
                                ]?.includes(String(testCaseId)) ?? false)
                              : false
                            : selectedTestCases.includes(String(testCaseId))
                        }

                        disabled={
                          activeTab !== "qa" &&
                          (allocationMode === "one-to-one" ||
                            allocationMode === "one-to-many") &&
                          !selectedTestCases.includes(String(testCaseId)) &&
                          selectedTestCases.length >= 1
                        }

                        onChange={(e) =>
                          handleSelectTestCase(String(testCaseId), e.target.checked)
                        }

                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tc.testCaseNumber ?? tc.id}
                    </td>

                    <td
                      className="px-6 py-4 text-sm text-gray-500 max-w-xs description-cell"
                      title={tc.description || "No description"}
                    >
                      {tc.description || (
                        <span className="text-gray-400 italic">
                          No description
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      <button
                        onClick={() => {
                          console.log("VIEW TEST CASE:", tc);
                          console.log("VIEW TEST STEPS:", tc.steps);
                          setViewingTestCase(tc);

                          setIsViewStepsModalOpen(true);
                        }}

                        className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"

                        title="View Steps"
                      >
                        <Eye className="w-4 h-4" />

                        <span>View</span>
                      </button>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tc.type}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const severityStyles = getSeverityColor(tc.severity);

                        return (
                          <span
                            className={severityStyles.className}

                            style={severityStyles.style}
                          >
                            {tc.severity}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    );
  };

  const releasesForQAAllocation = (() => {
    if (releaseTestCaseCounts.length > 0) {
      return releaseTestCaseCounts

        .filter((apiRelease) => apiRelease.testCaseCount > 0)

        .map((apiRelease) => {
          const existingRelease = effectiveProjectRelease.find(
            (r) => (r.releaseId || r.id) === apiRelease.releaseId,
          );

          return (
            existingRelease || {
              releaseId: apiRelease.releaseId,

              id: apiRelease.releaseId,

              releaseName: apiRelease.releaseName,

              name: apiRelease.releaseName,

              version: "N/A",
            }
          );
        });
    }

    return effectiveProjectRelease.filter((release: any) => {
      const releaseId = release.releaseId || release.id;

      return (
        qaAllocatedTestCases[releaseId] &&
        qaAllocatedTestCases[releaseId].length > 0
      );
    });
  })();

  const QASelectionPanel = () => {
    let allocatedRelease: any = null;

    if (selectedReleaseForQA) {
      allocatedRelease =
        effectiveProjectRelease &&
        effectiveProjectRelease.find(
          (release: any) =>
            (release.releaseId || release.id) === selectedReleaseForQA,
        );
    }

    const effectiveQAEngineers = qaMembers.map((qa) => ({
      id: String(qa.userId),

      firstName: qa.userFullName.split(" ")[0] || "",

      lastName: qa.userFullName.split(" ").slice(1).join(" ") || "",

      designation: "QA Engineer",
    }));

    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

    const [qaAllocationSummary, setQaAllocationSummary] = useState<any>(null);
    const [qaAllocationSummaryLoading, setQaAllocationSummaryLoading] =
      useState(false);
    const [qaAllocationSummaryError, setQaAllocationSummaryError] = useState<
      string | null
    >(null);

    const [qaEngineerTestCases, setQaEngineerTestCases] = useState<any[]>([]);
    const [qaEngineerTestCasesLoading, setQaEngineerTestCasesLoading] =
      useState(false);
    const [qaEngineerTestCasesError, setQaEngineerTestCasesError] = useState<
      string | null
    >(null);

    const handleSelectReleaseForQA = async (release: any) => {
      const releaseId = release.releaseId || release.id;

      setSelectedReleaseForQA(releaseId);

      setQaReleaseTestCasesLoading(true);

      setQaReleaseTestCasesError(null);

      try {
        const moduleId = selectedModule
          ? Number(
              effectiveModules.find((m: any) => m.name === selectedModule)?.id,
            )
          : 0;

        const subModuleId = selectedSubmodule ? Number(selectedSubmodule) : 0;

        const projectId = Number(selectedProjectId);

        if (moduleId && subModuleId && projectId) {
await fetchTestCasesByModuleSubmoduleRelease(
            projectId,

            Number(releaseId),
            moduleId,

            subModuleId,
          );
        } else {
setQaAllocatedTestCasesData([]);
        }
      } catch (err: any) {
setQaReleaseTestCasesError(
          "Failed to fetch test cases for this release.",
        );

        setQaReleaseTestCases([]);
      } finally {
        setQaReleaseTestCasesLoading(false);
      }
    };

    const fetchQaAllocationSummary = async () => {
      if (!selectedProjectId || qaMembers.length === 0) {
        setQaAllocationSummaryError(
          "No project selected or no QA members found",
        );
        return;
      }

      setQaAllocationSummaryLoading(true);
      setQaAllocationSummaryError(null);

      try {
        const qaEngineerIds = qaMembers.map((qa) => qa.userId).join(",");

        const response = await getQaAllocationSummary(qaEngineerIds);

        if (response.status === "Success" && response.data?.allocationSummary) {
          setQaAllocationSummary(response.data.allocationSummary);
        } else {
          setQaAllocationSummaryError("Failed to fetch QA allocation summary");
        }
      } catch (err: any) {
setQaAllocationSummaryError(
          err.message || "Failed to fetch QA allocation summary",
        );
      } finally {
        setQaAllocationSummaryLoading(false);
      }
    };

    const fetchQaEngineerTestCases = async () => {
      if (
        !selectedProjectId ||
        !selectedModule ||
        !selectedSubmodule ||
        !selectedReleaseForQA
      ) {
        setQaEngineerTestCasesError(
          "Missing required parameters for fetching test cases",
        );
        return;
      }

      setQaEngineerTestCasesLoading(true);
      setQaEngineerTestCasesError(null);

      try {
        const projectId = Number(selectedProjectId);
        const releaseId = Number(selectedReleaseForQA);
        const moduleId = Number(
          effectiveModules.find((m: any) => m.name === selectedModule)?.id,
        );
        const subModuleId = Number(selectedSubmodule);

        if (!moduleId || !subModuleId) {
          setQaEngineerTestCasesError("Invalid module or submodule selection");
          return;
        }

        const response = await getQaEngineerTestCases(
          projectId,
          releaseId,
          moduleId,
          subModuleId,
        );

        if (response.status === "success" && response.data) {
          setQaEngineerTestCases(response.data);
        } else {
          setQaEngineerTestCasesError("Failed to fetch test case details");
        }
      } catch (err: any) {
setQaEngineerTestCasesError(
          err.message || "Failed to fetch test case details",
        );
      } finally {
        setQaEngineerTestCasesLoading(false);
      }
    };

    useEffect(() => {
      if (isSummaryModalOpen && selectedProjectId && qaMembers.length > 0) {
        fetchQaAllocationSummary();

        if (selectedModule && selectedSubmodule && selectedReleaseForQA) {
          fetchQaEngineerTestCases();
        }
      }
    }, [
      isSummaryModalOpen,
      selectedProjectId,
      qaMembers.length,
      selectedModule,
      selectedSubmodule,
      selectedReleaseForQA,
    ]);

    return (
      <div className="space-y-6">
        {}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                📊
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                Overall QA Allocation Progress
              </h3>
            </div>

            {releaseTestCaseCountsError && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  ⚠️ {releaseTestCaseCountsError}. Showing data from existing
                  allocations.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {releaseTestCaseCountsLoading
                    ? "..."
                    : releaseTestCaseCounts.length}
                </div>

                <div className="text-sm text-blue-700">
                  Releases with Test Cases
                </div>

                {}

                {!releaseTestCaseCountsLoading &&
                  releaseTestCaseCounts.length > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      {releaseTestCaseCounts
                        .map((r) => r.releaseName)
                        .join(", ")}
                    </div>
                  )}
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {releaseTestCaseCountsLoading
                    ? "..."
                    : releaseTestCaseCounts.reduce(
                        (total, r) => total + r.testCaseCount,
                        0,
                      )}
                </div>

                <div className="text-sm text-green-700">Total Test Cases</div>

                {}

                {!releaseTestCaseCountsLoading &&
                  releaseTestCaseCounts.length > 0 && (
                    <div className="text-xs text-green-600 mt-1">
                      {releaseTestCaseCounts
                        .map((r) => `${r.releaseName}: ${r.testCaseCount}`)
                        .join(", ")}
                    </div>
                  )}
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {releaseTestCaseCountsLoading
                    ? "..."
                    : releaseTestCaseCounts.reduce((total, r) => {
                        const releaseId = r.releaseId;

                        const allocatedToQA = Object.values(
                          qaAllocations[releaseId] || {},
                        ).flat().length;

                        return (
                          total + Math.max(0, r.testCaseCount - allocatedToQA)
                        );
                      }, 0)}
                </div>

                <div className="text-sm text-orange-700">
                  Test Cases Remaining
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                Select Release for QA Allocation
              </h3>
            </div>

            {releasesForQAAllocation.length > 0 ? (
              <div className="flex space-x-2 overflow-x-auto">
                {releasesForQAAllocation.map((release: any) => {
                  const releaseId = release.releaseId;

                  const ids = release.id;

                  const isSelected = selectedReleaseForQA === releaseId;

                  const allocatedTestCases =
                    qaAllocatedTestCases[releaseId] || [];

                  const allocatedToQA = Object.values(
                    qaAllocations[releaseId] || {},
                  ).flat().length;

                  const releaseTestCaseData = releaseTestCaseCounts.find(
                    (r) => r.releaseId === releaseId,
                  );

                  const totalTestCases =
                    releaseTestCaseData?.testCaseCount ||
                    allocatedTestCases.length;

                  const remainingTestCases = totalTestCases - allocatedToQA;

                  return (
                    <div
                      key={releaseId}

                      className={`min-w-[180px] px-4 py-2 rounded-md border text-left transition-all duration-200 focus:outline-none text-sm font-medium shadow-sm flex flex-col items-start relative bg-white

                      ${
                        isSelected
                          ? "border-blue-500 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md hover:ring-1 hover:ring-blue-300"
                          : "border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md hover:ring-1 hover:ring-blue-300"
                      }`}

                      style={{
                        boxShadow: isSelected ? "0 0 0 2px #3b82f6" : undefined,
                      }}
                    >
                      <div className="truncate font-semibold mb-1">
                        {releaseTestCaseData?.releaseName ||
                          release.releaseName ||
                          release.name}
                      </div>

                      <div className="text-xs text-gray-500 mb-1">
                        Version: {release.version || "N/A"}
                      </div>

                      <div className="text-xs text-gray-600 mb-2">
                        {releaseTestCaseData?.testCaseCount || totalTestCases}{" "}
                        test cases allocated
                      </div>

                      <div className="text-xs text-green-600 mb-2">
                        {allocatedToQA} assigned to QA • {remainingTestCases}{" "}
                        remaining
                      </div>

                      <Button
                        size="sm"

                        variant={isSelected ? "primary" : "secondary"}

                        className="w-full"

                        onClick={() => handleSelectReleaseForQA(release)}

                        disabled={
                          (allocationMode === "one-to-one" ||
                            allocationMode === "bulk") &&
                          !isSelected &&
                          selectedReleaseIds.length >= 1
                        }
                      >
                        {isSelected ? "Selected" : "Select"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500 mb-2">
                  No releases have test cases allocated for QA.
                </div>

                <div className="text-xs text-gray-400">
                  Please go back to the Release Allocation tab and allocate test
                  cases to releases first.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {}

        {selectedReleaseForQA && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900">
                    Allocate New Test Cases
                  </h3>
                </div>

                {}

                <Button
                  variant="secondary"

                  size="sm"

                  onClick={async () => {
                    await fetchQaAllocationSummary();
                    setIsSummaryModalOpen(true);
                  }}

                  className="flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />

                  <span>View Summary</span>
                </Button>
              </div>

              {}
              {(!selectedModule || !selectedSubmodule) && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-900 mb-2">
                    📋 Next Steps Required
                  </div>
                  <div className="text-sm text-blue-700 mb-2">
                    To view and allocate test cases, you need to:
                  </div>
                  <div className="text-sm text-blue-600 space-y-1">
                    {!selectedModule && (
                      <div>
                        • Select a <strong>Module</strong> from the Module
                        Selection panel below
                      </div>
                    )}
                    {!selectedSubmodule && selectedModule && (
                      <div>
                        • Select a <strong>Submodule</strong> from the Submodule
                        Selection panel below
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-blue-500 mt-2">
                    Test cases will be automatically loaded once both module and
                    submodule are selected.
                  </div>
                </div>
              )}

              {}

              {allocatedRelease && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-900 mb-1">
                    Selected Release:
                  </div>

                  <div className="text-lg font-semibold text-blue-700 mb-1">
                    {allocatedRelease.releaseName || allocatedRelease.name} (v
                    {allocatedRelease.version})
                  </div>

                  <div className="text-sm text-blue-600 mb-2">
                    {(() => {
                      const releaseTestCaseData = releaseTestCaseCounts.find(
                        (r) => r.releaseId === selectedReleaseForQA,
                      );

                      const totalTestCases =
                        releaseTestCaseData?.testCaseCount ||
                        qaAllocatedTestCases[selectedReleaseForQA]?.length ||
                        0;

                      return totalTestCases;
                    })()}{" "}
                    test cases allocated to this release
                  </div>

                  <div className="text-sm text-green-600">
                    {
                      Object.values(
                        qaAllocations[selectedReleaseForQA] || {},
                      ).flat().length
                    }{" "}
                    already assigned to QA •{" "}
                    {(() => {
                      const releaseTestCaseData = releaseTestCaseCounts.find(
                        (r) => r.releaseId === selectedReleaseForQA,
                      );

                      const totalTestCases =
                        releaseTestCaseData?.testCaseCount ||
                        qaAllocatedTestCases[selectedReleaseForQA]?.length ||
                        0;

                      return (
                        totalTestCases -
                        Object.values(
                          qaAllocations[selectedReleaseForQA] || {},
                        ).flat().length
                      );
                    })()}{" "}
                    remaining for allocation
                  </div>
                </div>
              )}

              {}

              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  Select QA Engineer:
                </h4>

                {qaMembersLoading ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500">
                      Loading QA members...
                    </div>
                  </div>
                ) : qaMembersError ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-red-500 mb-2">
                      {qaMembersError}
                    </div>

                    <Button
                      variant="secondary"

                      size="sm"

                      onClick={fetchQAMembers}
                    >
                      Retry
                    </Button>
                  </div>
                ) : effectiveQAEngineers.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {effectiveQAEngineers.map((emp: any) => (
                      <Button
                        key={emp.id}

                        variant={
                          selectedQA === emp.id ? "primary" : "secondary"
                        }

                        onClick={() => {
                          setSelectedQA(emp.id);

                          setQaAllocationError(null);

                          setQaAllocationSuccess(null);
                        }}

                        className="min-w-[120px]"
                      >
                        {emp.firstName} {emp.lastName}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500">
                      No QA members found for this project.
                    </div>

                    <div className="text-xs text-gray-400 mt-1">
                      Please contact your administrator to assign QA members to
                      this project.
                    </div>
                  </div>
                )}
              </div>

              {}
              {selectedReleaseForQA && selectedModule && selectedSubmodule && (
                <div className="mb-6">
                  {}

                  {}
                  {}

                  {}
                  {qaAllocatedTestCasesData.length === 0 &&
                    !loadingQATestCases &&
                    !qaTestCasesError && (
                      <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-sm text-yellow-800">
                          🔄 Test cases will be loaded automatically for the
                          selected module and submodule
                        </div>
                      </div>
                    )}

                  {loadingQATestCases ? (
                    <div className="text-center py-4">
                      <div className="text-sm text-gray-500">
                        Loading test cases for selected filters...
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Release: {selectedReleaseForQA}, Module:{" "}
                        {selectedModule}, Submodule: {selectedSubmodule}
                      </div>
                    </div>
                  ) : qaTestCasesError ? (
                    <div className="text-center py-4">
                      <div className="text-sm text-red-500 mb-2">
                        {qaTestCasesError}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const moduleId = Number(
                            effectiveModules.find(
                              (m: any) => m.name === selectedModule,
                            )?.id,
                          );
                          const subModuleId = Number(selectedSubmodule);
                          const projectId = Number(selectedProjectId);

                          if (moduleId && subModuleId && projectId) {
                            fetchTestCasesByModuleSubmoduleRelease(
                              projectId,
                              Number(selectedReleaseForQA),
                              moduleId,
                              subModuleId,
                            );
                          }
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : qaAllocatedTestCasesData.length > 0 ? (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-sm text-green-900 mb-2">
                        ✅ Found {qaAllocatedTestCasesData.length} test case(s)
                        for the selected filters
                      </div>
                      <div className="text-xs text-green-700">
                        Release: {selectedReleaseForQA} | Module:{" "}
                        {selectedModule} | Submodule: {selectedSubmodule}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-sm text-gray-500">
                        No test cases found for the selected filters
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Release: {selectedReleaseForQA} | Module:{" "}
                        {selectedModule} | Submodule: {selectedSubmodule}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Please ensure test cases are allocated to this release
                        for the selected module and submodule.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {}

              {selectedQA &&
                selectedReleaseForQA &&
                qaAllocatedTestCasesData.length > 0 &&
                (selectedTestCasesForQA[selectedReleaseForQA]?.length ?? 0) >
                  0 &&
                effectiveQAEngineers.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm font-medium text-green-900 mb-3">
                      Ready to allocate{" "}
                      {selectedTestCasesForQA[selectedReleaseForQA]?.length ??
                        0}{" "}
                      test case(s) to{" "}
                      <span className="font-semibold">
                        {
                          effectiveQAEngineers.find(
                            (emp: any) => emp.id === selectedQA,
                          )?.firstName
                        }{" "}
                        {
                          effectiveQAEngineers.find(
                            (emp: any) => emp.id === selectedQA,
                          )?.lastName
                        }
                      </span>
                    </div>

                    {}

                    {qaAllocationSuccess && (
                      <div className="mb-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                        <div className="text-sm text-green-800">
                          ✅ {qaAllocationSuccess}
                        </div>
                      </div>
                    )}

                    {}

                    {qaAllocationError && (
                      <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                        <div className="text-sm text-red-800">
                          ❌ {qaAllocationError}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="primary"

                        size="sm"

                        disabled={qaAllocationLoading}

                        onClick={async () => {
                          if (selectedReleaseForQA && selectedQA) {
                            await allocateTestCasesToQA(
                              selectedQA,
                              selectedTestCasesForQA[selectedReleaseForQA] ||
                                [],
                            );
                          }
                        }}
                      >
                        {qaAllocationLoading
                          ? "Allocating..."
                          : "Confirm Allocation"}
                      </Button>

                      <Button
                        variant="secondary"

                        size="sm"

                        disabled={qaAllocationLoading}

                        onClick={() => {
                          setSelectedTestCasesForQA((prev) => ({
                            ...prev,

                            [selectedReleaseForQA!]: [],
                          }));

                          setQaAllocationError(null);

                          setQaAllocationSuccess(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {}

        {selectedReleaseForQA &&
          (() => {
            const releaseTestCaseData = releaseTestCaseCounts.find(
              (r) => r.releaseId === selectedReleaseForQA,
            );

            const totalTestCases =
              releaseTestCaseData?.testCaseCount ||
              qaAllocatedTestCases[selectedReleaseForQA]?.length ||
              0;

            const allocatedToQA = Object.values(
              qaAllocations[selectedReleaseForQA] || {},
            ).flat().length;

            return allocatedToQA === totalTestCases && totalTestCases > 0;
          })() && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    ✓
                  </div>

                  <h3 className="text-lg font-semibold text-green-900">
                    Release Allocation Complete!
                  </h3>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-900 mb-2">
                    All test cases for "
                    {allocatedRelease?.releaseName || allocatedRelease?.name}"
                    have been allocated successfully!
                  </div>

                  <div className="text-sm text-green-700 mb-4">
                    {
                      Object.values(
                        qaAllocations[selectedReleaseForQA] || {},
                      ).flat().length
                    }{" "}
                    of{" "}
                    {(() => {
                      const releaseTestCaseData = releaseTestCaseCounts.find(
                        (r) => r.releaseId === selectedReleaseForQA,
                      );

                      return (
                        releaseTestCaseData?.testCaseCount ||
                        qaAllocatedTestCases[selectedReleaseForQA]?.length ||
                        0
                      );
                    })()}{" "}
                    test cases allocated
                  </div>

                  <div className="flex gap-3">
                    {releasesForQAAllocation.find(
                      (r: any) =>
                        (r.releaseId || r.id) !== selectedReleaseForQA,
                    ) ? (
                      <Button
                        variant="primary"

                        onClick={() => {
                          const nextRelease = releasesForQAAllocation.find(
                            (r: any) =>
                              (r.releaseId || r.id) !== selectedReleaseForQA,
                          );

                          if (nextRelease) {
                            setSelectedReleaseForQA(
                              nextRelease.releaseId || nextRelease.id,
                            );

                            setSelectedQA(null);
                          }
                        }}
                      >
                        Next Release
                      </Button>
                    ) : (
                      <Button
                        variant="primary"

                        onClick={() => {
                          const currentProjectId = selectedProject || projectId;

                          if (!currentProjectId) return;

                          localStorage.setItem(
                            "mockModules",
                            JSON.stringify(effectiveModules),
                          );

                          navigate(
                            `/projects/${currentProjectId}/releases/test-execution`,
                          );
                        }}
                      >
                        Proceed to Test Execution
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {}

        <Modal
          isOpen={isSummaryModalOpen}

          onClose={() => setIsSummaryModalOpen(false)}

          title="QA Engineers & Their Assignments"

          size="xl"
        >
          {}
          <div className="absolute top-4 right-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchQaAllocationSummary}
              disabled={qaAllocationSummaryLoading}
              className="flex items-center space-x-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh</span>
            </Button>
          </div>

          <div className="space-y-6">
            {}
            {qaAllocationSummaryLoading ? (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">
                  Loading QA allocation summary...
                </div>
              </div>
            ) : qaAllocationSummaryError ? (
              <div className="text-center py-8">
                <div className="text-sm text-red-500 mb-2">
                  Error loading summary: {qaAllocationSummaryError}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchQaAllocationSummary}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : qaAllocationSummary ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {qaAllocationSummary.totalAllocated}
                  </div>

                  <div className="text-sm text-blue-700">Total Allocated</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {qaAllocationSummary.qaEngineerCount}
                  </div>

                  <div className="text-sm text-green-700">QA Engineers</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">
                    {qaAllocationSummary.remaining}
                  </div>

                  <div className="text-sm text-purple-700">Remaining</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">
                  No summary data available
                </div>
              </div>
            )}

            {}
            {}

            {}
            {}

            {}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800">
                  QA Engineers & Their Assignments
                </h4>
                {selectedModule &&
                  selectedSubmodule &&
                  selectedReleaseForQA && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={fetchQaEngineerTestCases}
                      disabled={qaEngineerTestCasesLoading}
                      className="flex items-center space-x-2 text-xs"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span>Refresh Test Cases</span>
                    </Button>
                  )}
              </div>

              {qaAllocationSummaryLoading ? (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500">
                    Loading QA allocation summary...
                  </div>
                </div>
              ) : qaAllocationSummaryError ? (
                <div className="text-center py-8">
                  <div className="text-sm text-red-500 mb-2">
                    Error loading summary: {qaAllocationSummaryError}
                  </div>

                  <Button
                    variant="secondary"

                    size="sm"

                    onClick={fetchQaAllocationSummary}

                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              ) : qaAllocationSummary &&
                qaAllocationSummary.qaEngineers &&
                qaAllocationSummary.qaEngineers.length > 0 ? (
                <div className="space-y-4">
                  {qaAllocationSummary.qaEngineers.map((qa: any) => {
                    const allocatedTestCases = qa.testCases;

                    return (
                      <div
                        key={qa.id}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                              {qa.name
                                .split(" ")
                                .map((n: string) => n.charAt(0))
                                .join("")}
                            </div>

                            <div>
                              <div className="font-medium text-gray-900">
                                {qa.name}
                              </div>

                              <div className="text-xs text-gray-500">
                                QA Engineer
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {allocatedTestCases}
                            </div>

                            <div className="text-xs text-gray-500">
                              test cases
                            </div>
                          </div>
                        </div>

                        {allocatedTestCases > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Assigned Test Cases:
                            </div>

                            {}
                            {qaEngineerTestCasesLoading ? (
                              <div className="text-center py-2">
                                <div className="text-xs text-gray-500">
                                  Loading test case details...
                                </div>
                              </div>
                            ) : qaEngineerTestCasesError ? (
                              <div className="text-center py-2">
                                <div className="text-xs text-red-500 mb-1">
                                  Error: {qaEngineerTestCasesError}
                                </div>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={fetchQaEngineerTestCases}
                                  className="text-xs"
                                >
                                  Retry
                                </Button>
                              </div>
                            ) : qaEngineerTestCases &&
                              qaEngineerTestCases.length > 0 ? (
                              <div className="space-y-2">
                                {(() => {
                                  const filteredTestCases =
                                    qaEngineerTestCases.filter(
                                      (testCase: any) => {
                                        const qaName = qa.name.toLowerCase();
                                        const assignedTo =
                                          testCase.assignedTo?.toLowerCase();

                                        const qaFirstName =
                                          qaName.split(" ")[0];
                                        const qaLastName = qaName.split(" ")[1];

                                        return (
                                          assignedTo &&
                                          (assignedTo.includes(qaFirstName) ||
                                            (qaLastName &&
                                              assignedTo.includes(
                                                qaLastName,
                                              )) ||
                                            assignedTo.includes(
                                              qaName.replace(/\s+/g, ""),
                                            ))
                                        );
                                      },
                                    );

                                  if (
                                    filteredTestCases.length === 0 &&
                                    qa.testCaseIds &&
                                    qa.testCaseIds.length > 0
                                  ) {
                                    return qa.testCaseIds.map(
                                      (testCaseId: string) => (
                                        <div
                                          key={testCaseId}
                                          className="bg-white p-2 rounded border text-xs"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="font-medium text-blue-600">
                                              {testCaseId}
                                            </div>
                                            <div className="text-gray-500">
                                              Test Case ID
                                            </div>
                                          </div>
                                          <div className="text-gray-600 mt-1">
                                            (Details not available)
                                          </div>
                                        </div>
                                      ),
                                    );
                                  }

                                  return filteredTestCases.map(
                                    (testCase: any) => (
                                      <div
                                        key={testCase.id}
                                        className="bg-white p-2 rounded border text-xs"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="font-medium text-blue-600">
                                            {testCase.testCaseId}
                                          </div>
                                          <div className="text-gray-500">
                                            {testCase.type} •{" "}
                                            {testCase.severity}
                                          </div>
                                        </div>
                                        <div className="text-gray-600 mt-1">
                                          {testCase.description}
                                        </div>
                                      </div>
                                    ),
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {qa.testCaseIds && qa.testCaseIds.length > 0 ? (
                                  qa.testCaseIds.map((testCaseId: string) => (
                                    <div
                                      key={testCaseId}
                                      className="bg-white p-2 rounded border text-xs"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="font-medium text-blue-600">
                                          {testCaseId}
                                        </div>
                                        <div className="text-gray-500">
                                          Test Case ID
                                        </div>
                                      </div>
                                      <div className="text-gray-600 mt-1">
                                        (Details not available)
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-2">
                                    <div className="text-xs text-gray-500">
                                      {allocatedTestCases} test case
                                      {allocatedTestCases !== 1 ? "s" : ""}{" "}
                                      allocated
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      (Test case details not available)
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : qaAllocationSummary &&
                qaAllocationSummary.qaEngineers &&
                qaAllocationSummary.qaEngineers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500 mb-2">
                    No QA engineers found in the allocation summary.
                  </div>

                  <div className="text-xs text-gray-400">
                    The summary shows 0 QA engineers allocated.
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500 mb-2">
                    No QA members found for this project.
                  </div>

                  <div className="text-xs text-gray-400">
                    Please contact your administrator to assign QA members to
                    this project.
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"

                onClick={() => setIsSummaryModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  useEffect(() => {
    localStorage.setItem(
      "qaAllocatedTestCases",
      JSON.stringify(qaAllocatedTestCases),
    );
  }, [qaAllocatedTestCases]);

  useEffect(() => {
    localStorage.setItem("qaAllocations", JSON.stringify(qaAllocations));
  }, [qaAllocations]);

  useEffect(() => {
    if (
      activeTab === "qa" &&
      selectedReleaseForQA &&
      selectedProjectId &&
      selectedModule &&
      selectedSubmodule
    ) {
      const moduleId = Number(
        effectiveModules.find((m: any) => m.name === selectedModule)?.id,
      );

      const subModuleId = Number(selectedSubmodule);

      const projectId = Number(selectedProjectId);

      if (moduleId && subModuleId && projectId) {
fetchTestCasesByModuleSubmoduleRelease(
          projectId,
          Number(selectedReleaseForQA),
          moduleId,
          subModuleId,
        );
      }
    }
  }, [
    activeTab,
    selectedReleaseForQA,
    selectedProjectId,
    selectedModule,
    selectedSubmodule,
    effectiveModules,
  ]);

  useEffect(() => {
    if (allocationMode === "one-to-one" || allocationMode === "bulk") {
      if (selectedTestCases.length > 1) {
        setSelectedTestCases([selectedTestCases[0]]);
      }

      if (selectedReleaseIds.length > 1) {
        setSelectedReleaseIds([selectedReleaseIds[0]]);
      }
    }
  }, [allocationMode]);

  useEffect(() => {
    setSelectedTestCases([]);

    setModeRefreshKey((k) => k + 1);
  }, [allocationMode]);

  useEffect(() => {
    const isBulkLikeMode =
      allocationMode === "bulk" || allocationMode === "many-to-many";
    const isReleaseTab = activeTab === "release";

    if (!isBulkLikeMode || !isReleaseTab) {
      if (
        bulkModuleSelect ||
        bulkSubmoduleSelect ||
        selectedModules.length > 0 ||
        selectedSubmodules.length > 0
      ) {
        setBulkModuleSelect(false);
        setBulkSubmoduleSelect(false);
        setSelectedModules([]);
        setSelectedSubmodules([]);
        setBulkSubmodules([]);
      }
    }
  }, [allocationMode, activeTab]);

  useEffect(() => {
    if (
      activeTab === "qa" &&
      selectedReleaseForQA &&
      selectedProjectId &&
      selectedModule &&
      selectedSubmodule
    ) {
      const moduleId = Number(
        effectiveModules.find((m: any) => m.name === selectedModule)?.id,
      );
      const subModuleId = Number(selectedSubmodule);
      const projectId = Number(selectedProjectId);

      if (moduleId && subModuleId && projectId) {
fetchTestCasesByModuleSubmoduleRelease(
          projectId,
          Number(selectedReleaseForQA),
          moduleId,
          subModuleId,
        );
      }
    }
  }, [
    selectedReleaseForQA,
    selectedProjectId,
    selectedModule,
    selectedSubmodule,
    effectiveModules,
  ]);

  useEffect(() => {
    if (activeTab === "qa") {
setQaAllocatedTestCasesData([]);
      setQaTestCasesError(null);

      if (selectedReleaseForQA) {
        setSelectedTestCasesForQA((prev) => ({
          ...prev,
          [selectedReleaseForQA]: [],
        }));
      }
    }
  }, [selectedModule, selectedSubmodule, activeTab, selectedReleaseForQA]);

//   useEffect(() => {
//     if (selectedProjectId && selectedModule && !selectedSubmodule) {
// const moduleObj = effectiveModules.find(
//         (m: any) => m.name === selectedModule,
//       );
// if (moduleObj && moduleObj.id) {
// fetchTestCasesByModule(selectedProjectId, String(moduleObj.id));
//       } else {
// }
//     }
//   }, [
//     selectedProjectId,
//     selectedModule,
//     effectiveModules,
//     severities,
//     defectTypes,
//   ]);


useEffect(() => {
  if (
    selectedProject &&
    selectedReleaseIds &&
    selectedModule &&
    selectedSubmodule
  ) {
    const moduleObj = effectiveModules.find(
      (m: any) => m.name === selectedModule,
    );

    const moduleId = Number(moduleObj?.id);
    const projectId = Number(selectedProject);
    const releaseId = Number(selectedReleaseIds);
    const subModuleId = Number(selectedSubmodule);

    if (
      Number.isFinite(projectId) &&
      Number.isFinite(releaseId) &&
      Number.isFinite(moduleId) &&
      Number.isFinite(subModuleId)
    ) {
      fetchTestCasesBySubmodule(
        projectId,
        releaseId,
        moduleId,
        subModuleId,
      );
    } else {
      setAllocatedTestCases([]);
    }
  } else {
    setAllocatedTestCases([]);
  }
}, [
  selectedProject,
  selectedReleaseIds,
  selectedModule,
  selectedSubmodule,
  effectiveModules,
]);

  return (
    <div className="max-w-5xl mx-auto py-8">
      {}

      <div className="mb-4 flex justify-end">
        <Button
          variant="secondary"

          onClick={() => navigate(`/projects/${projectId}/releases`)}

          className="flex items-center"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back
        </Button>
      </div>

      {ProjectSelectionPanel()}

      {}

      {selectedProject && activeTab === "release" && (
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Available Releases
              </h2>

              {loadingReleases ? (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500">
                    Loading releases...
                  </div>
                </div>
              ) : effectiveProjectRelease.length > 0 ? (
                <>
                  <ReleaseCardsPanel />

                  {}

                  {selectedReleaseIds.length > 0 && (
                    <div className="mt-6 flex flex-col space-y-3">
                      {}

                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">
                          Allocation Mode:
                        </span>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"

                            variant={
                              allocationMode === "one-to-one"
                                ? "primary"
                                : "secondary"
                            }

                            onClick={() => setAllocationMode("one-to-one")}

                            disabled={allocationLoading}
                          >
                            One-to-One
                          </Button>

                          <Button
                            size="sm"

                            variant={
                              allocationMode === "one-to-many"
                                ? "primary"
                                : "secondary"
                            }

                            onClick={() => setAllocationMode("one-to-many")}

                            disabled={allocationLoading}
                          >
                            One-to-Many
                          </Button>

                          <Button
                            size="sm"

                            variant={
                              allocationMode === "bulk"
                                ? "primary"
                                : "secondary"
                            }

                            onClick={() => setAllocationMode("bulk")}

                            disabled={allocationLoading}
                          >
                            Bulk
                          </Button>

                          <Button
                            size="sm"

                            variant={
                              allocationMode === "many-to-many"
                                ? "primary"
                                : "secondary"
                            }

                            onClick={() => setAllocationMode("many-to-many")}

                            disabled={allocationLoading}
                          >
                            Many-to-Many
                          </Button>
                        </div>
                      </div>

                      {}

                      <div className="flex justify-end">
                        <Button
                          variant="primary"

                          disabled={
                            selectedTestCases.length === 0 || allocationLoading
                          }

                          onClick={handleAllocate}
                        >
                          {allocationLoading
                            ? "Allocating..."
                            : allocationMode === "bulk"
                              ? `Allocate Test Cases to Single Release (Bulk)`
                              : `Allocate Selected Releases (${allocationMode === "one-to-many" ? "One-to-Many" : allocationMode === "one-to-one" ? "One-to-One" : allocationMode === "many-to-many" ? "Many-to-Many" : "Bulk"})`}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500">
                    No releases found for this project.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {}

      {allocationSuccess && (
        <div className="mb-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center text-green-800">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>

                <span className="font-medium">{allocationSuccess}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {allocationError && (
        <div className="mb-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center text-red-800">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>

                <span className="font-medium">{allocationError}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {}

      {allocationProgress && (
        <div className="mb-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center text-blue-800 mb-2">
                <svg
                  className="w-5 h-5 mr-2 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>

                <span className="font-medium">
                  Allocating test cases to releases...
                </span>
              </div>

              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"

                  style={{
                    width: `${(allocationProgress.current / allocationProgress.total) * 100}%`,
                  }}
                ></div>
              </div>

              <div className="text-sm text-blue-600 mt-1">
                {allocationProgress.current} of {allocationProgress.total}{" "}
                {allocationMode === "bulk"
                  ? "bulk allocations"
                  : allocationMode === "one-to-many"
                    ? "test cases"
                    : "allocations"}{" "}
                completed
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {}

      {activeTab === "release" && selectedReleaseIds.length === 1 && (
        <div className="mb-4">
          {loadingRelease && (
            <div className="p-4 text-center text-blue-600">
              Loading release details...
            </div>
          )}

          {releaseError && (
            <div className="p-4 text-center text-red-600">{releaseError}</div>
          )}

          {apiRelease && (
            <Card className="mb-4">
              <CardContent>
                <div className="font-bold text-lg mb-1">{apiRelease.name}</div>

                <div className="mb-1">Version: {apiRelease.version}</div>

                <div className="mb-1">
                  Description: {apiRelease.description}
                </div>

                <div className="mb-1">
                  Release Date:{" "}
                  {apiRelease.releaseDate
                    ? new Date(apiRelease.releaseDate).toLocaleDateString()
                    : "TBD"}
                </div>

                <div className="mb-1">Type: {apiRelease.releaseType}</div>

                {}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {}

      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}

            className={`px-4 py-2 font-medium border-b-2 transition-colors duration-200 ${
              activeTab === tab.key
                ? "border-blue-500 text-blue-700"
                : "border-transparent text-gray-500 hover:text-blue-700"
            }`}

            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {}

      {activeTab === "release" ? (
        <>
          {ModuleSelectionPanel()}

          {}
          {}

          {(selectedModule ||
            (bulkModuleSelect && selectedModules.length > 0)) && (
            <SubmoduleSelectionPanel />
          )}

          {}
          {bulkModuleSelect && selectedModules.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-900">
                {loadingModuleTestCases ? (
                  <span>
                    🔄 Loading test cases for {selectedModules.length} selected
                    module(s)...
                  </span>
                ) : (
                  <span>
                    ✅ Bulk modules selected:{" "}
                    <strong>{selectedModules.length} module(s)</strong>
                  </span>
                )}
              </div>
              {loadingModuleTestCases && (
                <div className="text-xs text-blue-600 mt-1">
                  Fetching test cases from backend API for modules:{" "}
                  {selectedModules.join(", ")}
                </div>
              )}
              {!loadingModuleTestCases && allocatedTestCases.length > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  Found {allocatedTestCases.length} test case(s) across selected
                  modules
                </div>
              )}
            </div>
          )}

          {}
          {bulkSubmoduleSelect && selectedSubmodules.length > 0 && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-900">
                {loadingSubmoduleTestCases ? (
                  <span>
                    🔄 Loading test cases for {selectedSubmodules.length}{" "}
                    selected submodule(s)...
                  </span>
                ) : (
                  <span>
                    ✅ Bulk submodules selected:{" "}
                    <strong>{selectedSubmodules.length} submodule(s)</strong>
                  </span>
                )}
              </div>
              {loadingSubmoduleTestCases && (
                <div className="text-xs text-green-600 mt-1">
                  Fetching test cases from backend API for submodules:{" "}
                  {selectedSubmodules.join(", ")}
                </div>
              )}
              {!loadingSubmoduleTestCases && allocatedTestCases.length > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  Found {allocatedTestCases.length} test case(s) across selected
                  submodules
                </div>
              )}
            </div>
          )}

          {}

          {loadingModuleTestCases || loadingSubmoduleTestCases ? (
            <Card className="mb-4">
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">
                  {loadingModuleTestCases
                    ? "Loading test cases for selected module..."
                    : "Loading test cases for selected submodule..."}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {loadingModuleTestCases && selectedModule
                    ? `Module: ${selectedModule}`
                    : ""}
                  {loadingSubmoduleTestCases && selectedSubmodule
                    ? `Submodule: ${selectedSubmodule}`
                    : ""}
                </div>
              </CardContent>
            </Card>
          ) : filteredTestCases.length > 0 ? (
            <TestCaseTable testCases={filteredTestCases} />
          ) : (
            (selectedSubmodule ||
              (bulkSubmoduleSelect && selectedSubmodules.length > 0) ||
              (selectedModule &&
                !selectedSubmodule &&
                !bulkSubmoduleSelect)) && (
              <Card className="mb-4">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500">
                    {bulkSubmoduleSelect &&
                    selectedSubmodules.length > 0 &&
                    selectedReleaseIds.length === 0
                      ? "Please select at least one release before using bulk submodule selection."
                      : selectedModule &&
                          !selectedSubmodule &&
                          !bulkSubmoduleSelect
                        ? "Please select a submodule or use bulk select to choose test cases."
                        : "No test cases found for the selected submodule(s)."}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </>
      ) : (
        <StandaloneQAAllocationTab
          key={selectedProjectId || projectId || "no-project"}
          projectId={selectedProjectId || projectId}
        />
      )}

      {}

      <Modal
        isOpen={isViewStepsModalOpen}

        onClose={() => {
          setIsViewStepsModalOpen(false);

          setViewingTestCase(null);
        }}

        title={`Test Steps - ${formatTestCaseId(viewingTestCase?.id)}`}
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

        title={`Test Case Details - ${viewingTestCase?.id}`}

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

                {(() => {
                  const severityStyles = getSeverityColor(
                    viewingTestCase.severity,
                  );

                  return (
                    <span
                      className={`mt-1 inline-flex ${severityStyles.className}`}

                      style={severityStyles.style}
                    >
                      {viewingTestCase.severity}
                    </span>
                  );
                })()}
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

      <AlertModal
        isOpen={alert.isOpen}

        message={alert.message}

        onClose={closeAlert}
      />

      {bulkSubmoduleWarning && (
        <div className="mb-2 text-red-600 text-sm text-center">
          {bulkSubmoduleWarning}
        </div>
      )}
    </div>
  );
};
