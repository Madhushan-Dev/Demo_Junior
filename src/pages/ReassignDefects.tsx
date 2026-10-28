import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Checkbox } from "../components/ui/Checkbox";
import { getAllSubmoduleAllocatedDevBySubmoduleId } from "../api/subModuleDevAlloc";
import { usePermission } from "../context/PermissionContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ConfirmationModal from "../components/ui/ConfirmationModal";

import {
  getDefectsByProjectId,
  filterDefects
} from "../api/defect/filterDefectByProject";
import { getBenchAvailability } from "../api/benchAvailability";


import {
  getCurrentProjectDevelopers,
} from "../api/benchAvailability";

import { getModulesByProjectId } from "../api/module/getModule";
import { getSubmodulesByModuleId } from "../api/submodule/submoduleget"

interface Defect {
  id: number;
  defectId: string;
  description: string;
  assigned_to_name: string;
  assigned_to_id: number | null;
  module_name: string;
  sub_module_name: string;
  subModuleId?: number;
  moduleId?: number;
  defect_status_name: string;
  [key: string]: any;
}

interface ReassignDefectsProps {
  defects: Defect[];
  projectId: string;

  onReassign: (
    defectIds: number[],
    assignedToId: number,
  ) => Promise<void>;

  onClose: () => void;

  className?: string;

  onSuccess?: () => void;
}

const INACTIVE_STATUSES = ["CLOSED", "FIXED"];

export const ReassignDefects: React.FC<
  ReassignDefectsProps
> = ({
  defects,
  projectId,
  onReassign,
  onClose,
  className = "",
  onSuccess,
}) => {
  // -------------------------------------------------------
  // STATE
  // -------------------------------------------------------

  const [selectedDefects, setSelectedDefects] =
    useState<Set<number>>(new Set());

  const [selectedAssignee, setSelectedAssignee] =
    useState<string>("");

  const [filterAssignee, setFilterAssignee] =
    useState<string>("");
    const [selectedModule, setSelectedModule] =
  useState<string>("");

  const [selectedSubmodule, setSelectedSubmodule] =
    useState<string>("");

  // Developers used for "Reassign To"
  const [developers, setDevelopers] = useState<
    {
      userId: number;
      userName: string;
      empId: number;
    }[]
  >([]);

  const [submitting, setSubmitting] =
    useState(false);

  const [submoduleDevsLoading, setSubmoduleDevsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [previousSubmodule, setPreviousSubmodule] =
    useState<string>("");

  const { can } = usePermission();

  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const [confirmationMessage, setConfirmationMessage] =
    useState("");

  const [pendingReassignData, setPendingReassignData] =
    useState<{
      defectIds: number[];
      assigneeId: number;
    } | null>(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [defectsPerPage, setDefectsPerPage] =
    useState(10);

  const [totalPagesFromServer, setTotalPagesFromServer] =
    useState(1);

  const [totalElements, setTotalElements] =
    useState(0);

  const [isServerPaginated, setIsServerPaginated] =
    useState(false);

  const [projectSubmodules, setProjectSubmodules] =
    useState<
      {
        value: string;
        label: string;
        id: number;
        moduleId: number;
        moduleName: string;
      }[]
    >([]);

  // Current page defects used for table
  const [allProjectDefects, setAllProjectDefects] =
    useState<Defect[]>([]);

  // ALL project defects used only for
  // "Filter by Assigned Dev"
  const [allProjectDefectsForFilter, setAllProjectDefectsForFilter] =
    useState<Defect[]>([]);

  // Project allocated developers used for "Filter by Assigned Dev"
  const [projectDevelopers, setProjectDevelopers] =
    useState<{ value: string; label: string }[]>([]);

  const [isLoadingDefects, setIsLoadingDefects] =
    useState(false);

  // -------------------------------------------------------
  // LOAD PROJECT MODULES + SUBMODULES
  // -------------------------------------------------------

  useEffect(() => {
    if (!projectId) return;

    const loadProjectSubmodules =
      async () => {
        try {
          const modules =
            await getModulesByProjectId(
              projectId,
            );

          const mArray =
            Array.isArray(modules)
              ? modules
              : modules?.data || [];

          const results =
            await Promise.all(
              mArray.map(
                async (m: any) => {
                  const mId =
                    m.id ||
                    m.moduleId;
                    

                  if (!mId) {
                    return [];
                    
                  }

                  try {
                    const res =
                      await getSubmodulesByModuleId(
                        Number(mId),
                      );

                    const subModulesList =
                      res?.data ||
                      res?.content ||
                      [];

                    return subModulesList.map(
                      (sm: any) => ({
                        value:
                          sm.name ||
                          sm.subModuleName,

                        label:
                          sm.name ||
                          sm.subModuleName,

                        id: Number(
                          sm.id ||
                            sm.subModuleId,

                        ),

                        moduleId:
                          Number(mId),
                          moduleName:
  m.name ||
  m.moduleName ||
  "",
                      }),
                    );
                  } catch (error) {
                    console.error(
                      "Failed to load submodules:",
                      error,
                    );

                    return [];
                  }
                },
              ),
            );

          const flattened =
            results
              .flat()
              .filter(
                (sm: any) =>
                  sm &&
                  sm.value &&
                  sm.id &&
                  sm.moduleId,
              );

          setProjectSubmodules(
            flattened,
          );
        } catch (error) {
          console.error(
            "Failed to load project modules:",
            error,
          );

          setProjectSubmodules([]);
        }
      };

    loadProjectSubmodules();
  }, [projectId]);

  // -------------------------------------------------------
  // SUBMODULE NAME -> ID
  // -------------------------------------------------------
const moduleOptions = useMemo(() => {
  const moduleMap = new Map<
    number,
    { value: string; label: string }
  >();

  projectSubmodules.forEach((sub) => {
    if (!moduleMap.has(sub.moduleId)) {
      moduleMap.set(sub.moduleId, {
        value: String(sub.moduleId),
        label: sub.moduleName,
      });
    }
  });

  return Array.from(moduleMap.values());
}, [projectSubmodules]);
const filteredSubmodules = useMemo(() => {
  if (!selectedModule) {
    return projectSubmodules;
  }

  const selectedModuleId = Number(selectedModule);

  return projectSubmodules.filter(
    (sub) => Number(sub.moduleId) === selectedModuleId
  );
}, [
  projectSubmodules,
  selectedModule,
]);
  const submoduleIdMap =
    useMemo(() => {
      const map =
        new Map<string, number>();

      projectSubmodules.forEach(
        (sm) => {
          if (
            sm.value &&
            sm.id
          ) {
            map.set(
              sm.value,
              Number(sm.id),
            );
          }
        },
      );

      return map;
    }, [projectSubmodules]);

  // -------------------------------------------------------
  // LOAD CURRENT PAGE DEFECTS
  // -------------------------------------------------------

  useEffect(() => {
    if (!projectId) return;

    const fetchDefects =
      async () => {
        setIsLoadingDefects(true);
        setError(null);

        try {
          const hasFilters =
  !!(
    filterAssignee ||
    selectedModule ||
    selectedSubmodule
  );

          let responseData: any;

          if (!hasFilters) {
            responseData =
              await getDefectsByProjectId(
                Number(projectId),
                currentPage - 1,
                defectsPerPage,
              );
          } else {
            const filterParams: any = {
              projectId:
                Number(projectId),
            };

            if (filterAssignee) {
              filterParams.assignedToIds =
                [
                  Number(
                    filterAssignee,
                  ),
                ];
            }
            if (selectedModule) {
  filterParams.moduleId =
    Number(selectedModule);
}

            if (selectedSubmodule) {
  const subId =
    submoduleIdMap.get(
      selectedSubmodule,
    );

  if (subId) {
    filterParams.subModuleId = subId;
  }
}

            responseData =
              await filterDefects(
                filterParams,
                currentPage - 1,
                defectsPerPage,
              );
          }

          const defectsData =
            responseData?.content ||
            responseData?.data?.content ||
            responseData?.data ||
            (Array.isArray(
              responseData,
            )
              ? responseData
              : []);

          const hasServerPage =
            !!(
              responseData?.totalPages !==
                undefined ||
              responseData?.data
                ?.totalPages !==
                undefined
            );

          const tPages =
            responseData?.totalPages ??
            responseData?.data
              ?.totalPages ??
            1;

          const tElements =
            responseData?.totalElements ??
            responseData?.data
              ?.totalElements ??
            defectsData.length;

          const mapped =
  defectsData.map(
    (d: any, index: number) => {
      const id =
        d.defectId ??
        d.id ??
        d.defect_id ??
        index + 1;

      return {
        id: Number(id),

        defectId:
          `DEF-${String(id).padStart(3, "0")}`,

        defect_status_name:
          d.statusName ||
          d.defectStatusName ||
          d.status ||
          "",

        description:
          d.briefDescription ||
          d.defectDescription ||
          d.description ||
          "",

        steps:
          d.steps ||
          d.stepsToRecreation ||
          "",

        type_name:
          d.defectTypeName ||
          d.type ||
          "",

        severity_name:
          d.severityName ||
          d.defectSeverityName ||
          d.severity ||
          "",

        projectName:
          d.projectName ||
          "",

        project_name:
          d.projectName ||
          "",

        name:
          d.priorityName ||
          "",

        assigned_to_name:
          d.assignToName ||
          d.assignedToName ||
          d.assigned_to_name ||
          "",

        assigned_to_id:
          d.assignToId ??
          d.assignedToId ??
          d.assigned_to_id ??
          null,

        assigned_by_name:
          d.createdByName ||
          d.createdBy ||
          "",

        assigned_by_id:
          d.assignedById ??
          null,

        attachment:
          d.image ||
          d.attachment ||
          null,

        reOpenCount:
          d.reOpenCount ||
          0,

        stepsToRecreation:
          d.stepsToRecreation ||
          d.steps ||
          "",

        release_test_case_description:
          d.releaseTestCaseDescription ||
          "",

        commentsCount:
          d.commentsCount ||
          0,

        subModuleId:
          d.subModuleId ??
          d.sub_module_id,

        sub_module_name:
          d.subModuleName ||
          d.sub_module_name ||
          "",

        module_name:
          d.moduleName ||
          d.module_name ||
          "",

        moduleId:
          d.moduleId ??
          d.module_id,
      };
    },
  );

          setAllProjectDefects(
            mapped,
          );

          setTotalPagesFromServer(
            tPages,
          );

          setTotalElements(
            tElements,
          );

          setIsServerPaginated(
            hasServerPage,
          );
        } catch (err) {
          console.error(
            "Failed to load defects:",
            err,
          );

          setError(
            "Failed to load defects",
          );
        } finally {
          setIsLoadingDefects(
            false,
          );
        }
      };

    fetchDefects();
  }, [
  projectId,
  currentPage,
  defectsPerPage,
  filterAssignee,
  selectedModule,
  selectedSubmodule,
  submoduleIdMap,
]);

  // -------------------------------------------------------
  // LOAD ALL PROJECT DEFECTS
  // FOR ASSIGNED DEVELOPER FILTER
  // -------------------------------------------------------

  useEffect(() => {
  const loadProjectDevelopers = async () => {
    if (!projectId) {
      setProjectDevelopers([]);
      return;
    }

    try {
      const developers =
        await getCurrentProjectDevelopers(Number(projectId));

      console.log(
        "CURRENT PROJECT DEVELOPERS:",
        developers
      );

      const options = developers.map((emp: any) => ({
        value: String(emp.empId),
        label: `${emp.firstName} ${emp.lastName}`,
      }));

      setProjectDevelopers(options);

    } catch (error) {
      console.error(
        "Failed to load project developers:",
        error
      );

      setProjectDevelopers([]);
    }
  };

  loadProjectDevelopers();
}, [projectId]);

  // -------------------------------------------------------
  // ACTIVE DEFECTS
  // -------------------------------------------------------

  const activeDefects =
    useMemo(() => {
      const sourceDefects =
        allProjectDefects.length >
        0
          ? allProjectDefects
          : defects || [];

      return sourceDefects.filter(
        (defect) => {
          const status =
            (
              defect.defect_status_name ||
              ""
            ).toUpperCase();

          return !INACTIVE_STATUSES.includes(
            status,
          );
        },
      );
    }, [
      allProjectDefects,
      defects,
    ]);

  // -------------------------------------------------------
  // LOAD PROJECT ALLOCATED DEVELOPERS
  // Used for "Filter by Assigned Dev" dropdown
  // -------------------------------------------------------

  useEffect(() => {
  const loadProjectDevelopers = async () => {
    if (!projectId) {
      setProjectDevelopers([]);
      return;
    }

    try {
      const response = await  getCurrentProjectDevelopers(
        Number(projectId)
      );

      const allocations = response || [];

      console.log(
        "PROJECT ALLOCATIONS:",
        allocations
      );

      const developerMap = new Map<
        number,
        { value: string; label: string }
      >();

      allocations.forEach((allocation: any) => {

        if (!allocation?.empId) return;

        developerMap.set(
          Number(allocation.empId),
          {
            value: String(allocation.empId),
            label: `${allocation.firstName || ""} ${
              allocation.lastName || ""
            }`.trim(),
          }
        );
      });

      const mappedDevelopers =
        Array.from(developerMap.values());

      console.log(
        "PROJECT ALLOCATED DEVELOPERS:",
        mappedDevelopers
      );

      setProjectDevelopers(mappedDevelopers);

    } catch (error) {

      console.error(
        "Failed to load project allocated developers:",
        error
      );

      setProjectDevelopers([]);
    }
  };

  loadProjectDevelopers();

}, [projectId]);

  // -------------------------------------------------------
  // ASSIGNED DEVELOPER FILTER OPTIONS
  //
  // IMPORTANT:
  // Uses ALL project defects,
  // NOT current page defects.
  // -------------------------------------------------------

  const assignedDevOptions = projectDevelopers;

  // -------------------------------------------------------
  // FILTER BY ASSIGNED DEVELOPER
  // -------------------------------------------------------

  const filteredByAssignee =
    useMemo(() => {
      if (
        isServerPaginated ||
        !filterAssignee
      ) {
        return activeDefects;
      }

      return activeDefects.filter(
        (d) =>
          String(
            d.assigned_to_id,
          ) ===
          filterAssignee,
      );
    }, [
      activeDefects,
      filterAssignee,
      isServerPaginated,
    ]);

  // -------------------------------------------------------
  // FILTER BY SUBMODULE
  // -------------------------------------------------------

  const filteredDefects = useMemo(() => {
  if (isServerPaginated) {
  return filteredByAssignee;
}

return filteredByAssignee.filter((defect) => {
  const moduleMatches =
    !selectedModule ||
    Number(defect.moduleId) === Number(selectedModule);

  const submoduleMatches =
    !selectedSubmodule ||
    Number(defect.subModuleId) === Number(selectedSubmodule);

  return moduleMatches && submoduleMatches;
});
}, [
  filteredByAssignee,
  selectedSubmodule,
  isServerPaginated,
]);

  // -------------------------------------------------------
  // PAGINATION
  // -------------------------------------------------------

  const totalPages =
    isServerPaginated
      ? totalPagesFromServer
      : Math.ceil(
          filteredDefects.length /
            defectsPerPage,
        ) || 1;

  const paginatedDefects =
    isServerPaginated
      ? filteredDefects
      : filteredDefects.slice(
          (currentPage - 1) *
            defectsPerPage,

          currentPage *
            defectsPerPage,
        );

  // -------------------------------------------------------
  // RESET PAGE WHEN FILTER CHANGES
  // -------------------------------------------------------

  useEffect(() => {
  setCurrentPage(1);
}, [
  filterAssignee,
  selectedModule,
  selectedSubmodule,
]);

  // -------------------------------------------------------
  // RESET SELECTION WHEN SUBMODULE CHANGES
  // -------------------------------------------------------

  useEffect(() => {
    if (
      previousSubmodule &&
      selectedSubmodule &&
      previousSubmodule !==
        selectedSubmodule
    ) {
      setSelectedDefects(
        new Set(),
      );

      setSelectedAssignee("");
      setError(null);
    }

    setPreviousSubmodule(
      selectedSubmodule,
    );
  }, [
    selectedSubmodule,
  ]);

  // -------------------------------------------------------
  // CURRENT ASSIGNEE IDS
  // -------------------------------------------------------

  const currentAssigneeIds =
    useMemo(() => {
      const ids =
        new Set<number>();

      Array.from(
        selectedDefects,
      ).forEach(
        (defectId) => {
          const defect =
            activeDefects.find(
              (d) =>
                d.id ===
                defectId,
            );

          if (
            defect &&
            defect.assigned_to_id
          ) {
            ids.add(
              Number(
                defect.assigned_to_id,
              ),
            );
          }
        },
      );

      return ids;
    }, [
      selectedDefects,
      activeDefects,
    ]);

  // -------------------------------------------------------
  // LOAD DEVELOPERS FOR SELECTED SUBMODULE
  //
  // This is ONLY for "Reassign To".
  // -------------------------------------------------------

  useEffect(() => {
    if (
      !projectId ||
      !selectedSubmodule
    ) {
      setDevelopers([]);
      setSelectedAssignee("");
      return;
    }

    const fetchSubmoduleDevelopers =
      async () => {
        setSubmoduleDevsLoading(
          true,
        );

        setError(null);

        try {
          const subModuleId = Number(selectedSubmodule);

const selectedSubmoduleData = projectSubmodules.find(
  (sm) => Number(sm.id) === subModuleId
);

          const moduleId =
            selectedSubmoduleData?.moduleId;

          console.log(
            "Selected Submodule:",
            selectedSubmodule,
          );

          console.log(
            "Module ID:",
            moduleId,
          );

          console.log(
            "Submodule ID:",
            subModuleId,
          );

          if (
            !moduleId ||
            !subModuleId
          ) {
            setDevelopers([]);
            return;
          }

          const subModuleDevRes =
            await getAllSubmoduleAllocatedDevBySubmoduleId(
              Number(moduleId),
              Number(subModuleId),
            );

          console.log(
            "Allocated submodule developers:",
            subModuleDevRes,
          );

          const allocatedDevelopers =
            Array.isArray(subModuleDevRes)
              ? subModuleDevRes
              : subModuleDevRes?.data ||
                [];

          const mappedUsers =
            allocatedDevelopers
              .map(
                (item: any) => {
                  const employee =
                    item?.employee;

                  if (
                    !employee
                  ) {
                    return null;
                  }

                  const userId =
                    employee.empId;

                  const userName =
                    `${employee.firstName || ""} ${
                      employee.lastName || ""
                    }`.trim();

                  return {
                    userId:
                      Number(
                        userId,
                      ),

                    userName:
                      userName ||
                      "Unknown User",

                    empId:
                      Number(
                        userId,
                      ),
                  };
                },
              )
              .filter(
                (
                  user,
                ): user is {
                  userId: number;
                  userName: string;
                  empId: number;
                } =>
                  user !==
                    null &&
                  !!user.userId &&
                  !!user.userName,
              );

          console.log(
            "Mapped developers:",
            mappedUsers,
          );

          setDevelopers(
            mappedUsers,
          );

          setSelectedAssignee("");
        } catch (error) {
          console.error(
            "Failed to load developers for submodule:",
            error,
          );

          setDevelopers([]);

          setError(
            "Failed to load developers for this submodule",
          );
        } finally {
          setSubmoduleDevsLoading(
            false,
          );
        }
      };

    fetchSubmoduleDevelopers();
  }, [
    selectedSubmodule,
    projectId,
    submoduleIdMap,
    projectSubmodules,
  ]);

  // -------------------------------------------------------
  // AVAILABLE DEVELOPERS FOR REASSIGN TO
  // -------------------------------------------------------

  const availableDevelopers =
    useMemo(() => {
      if (
        selectedDefects.size ===
        0
      ) {
        return developers;
      }

      if (
        selectedDefects.size ===
        1
      ) {
        return developers.filter(
          (dev) =>
            !currentAssigneeIds.has(
              dev.userId,
            ),
        );
      }

      if (
        currentAssigneeIds.size ===
        1
      ) {
        return developers.filter(
          (dev) =>
            !currentAssigneeIds.has(
              dev.userId,
            ),
        );
      }

      return developers;
    }, [
      developers,
      currentAssigneeIds,
      selectedDefects.size,
    ]);

  // -------------------------------------------------------
  // SELECT ALL
  // -------------------------------------------------------

  const handleSelectAll = (
    checked:
      | boolean
      | "indeterminate",
  ) => {
    if (
      checked === true
    ) {
      const allIds =
        paginatedDefects.map(
          (d) => d.id,
        );

      setSelectedDefects(
        new Set(allIds),
      );
    } else {
      setSelectedDefects(
        new Set(),
      );

      setSelectedAssignee("");
    }
  };

  // -------------------------------------------------------
  // SELECT DEFECT
  // -------------------------------------------------------

  const handleSelectDefect = (
    defectId: number,
    checked:
      | boolean
      | "indeterminate",
  ) => {
    const newSet =
      new Set(
        selectedDefects,
      );

    if (
      checked === true
    ) {
      newSet.add(
        defectId,
      );
    } else {
      newSet.delete(
        defectId,
      );
    }

    setSelectedDefects(
      newSet,
    );

    if (
      newSet.size ===
      0
    ) {
      setSelectedAssignee("");
    }
  };

  const isAllSelected =
    paginatedDefects.length >
      0 &&
    paginatedDefects.every(
      (d) =>
        selectedDefects.has(
          d.id,
        ),
    );

  // -------------------------------------------------------
  // RESET
  // -------------------------------------------------------

  const resetAll = () => {
    setSelectedDefects(
      new Set(),
    );

    setSelectedAssignee("");

    setFilterAssignee("");
    setSelectedModule("");

    setSelectedSubmodule("");

    setDevelopers([]);

    setError(null);

    setCurrentPage(1);

    setPreviousSubmodule("");

    setShowConfirmation(
      false,
    );

    setPendingReassignData(
      null,
    );
  };

  // -------------------------------------------------------
  // PERFORM REASSIGN
  // -------------------------------------------------------

  const performReassign =
    async (
      defectIds: number[],
      assigneeId: number,
    ) => {
      setSubmitting(true);
      setError(null);

      try {
        await onReassign(
          defectIds,
          assigneeId,
        );

        resetAll();

        if (onSuccess) {
          onSuccess();
        }
      } catch (error: any) {
        console.error(
          "Reassign failed:",
          error,
        );

        setError(
          error?.message ||
            "Failed to reassign defects. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    };

  // -------------------------------------------------------
  // HANDLE REASSIGN
  // -------------------------------------------------------

  const handleReassign =
    async () => {
      if (
        selectedDefects.size ===
        0
      ) {
        setError(
          "Please select at least one defect to reassign.",
        );

        return;
      }

      if (
        !selectedAssignee
      ) {
        setError(
          "Please select a developer to reassign to.",
        );

        return;
      }

      const assigneeId =
        parseInt(
          selectedAssignee,
        );

      const defectIds =
        Array.from(
          selectedDefects,
        );

      const alreadyAssigned =
        defectIds.some(
          (defectId) => {
            const defect =
              activeDefects.find(
                (d) =>
                  d.id ===
                  defectId,
              );

            return (
              defect &&
              defect.assigned_to_id ===
                assigneeId
            );
          },
        );

      if (
        alreadyAssigned
      ) {
        setConfirmationMessage(
          "One or more selected defects are already assigned to this developer.\nDo you want to continue?",
        );

        setPendingReassignData(
          {
            defectIds,
            assigneeId,
          },
        );

        setShowConfirmation(
          true,
        );

        return;
      }

      await performReassign(
        defectIds,
        assigneeId,
      );
    };

  // -------------------------------------------------------
  // CONFIRM REASSIGN
  // -------------------------------------------------------

  const handleConfirmReassign =
    () => {
      setShowConfirmation(
        false,
      );

      if (
        pendingReassignData
      ) {
        performReassign(
          pendingReassignData.defectIds,
          pendingReassignData.assigneeId,
        );

        setPendingReassignData(
          null,
        );
      }
    };

  // -------------------------------------------------------
  // CANCEL REASSIGN
  // -------------------------------------------------------

  const handleCancelReassign =
    () => {
      setShowConfirmation(
        false,
      );

      setPendingReassignData(
        null,
      );
    };

  // -------------------------------------------------------
  // DEVELOPER OPTIONS
  // -------------------------------------------------------

  const developerOptions =
    availableDevelopers.map(
      (dev) => ({
        value:
          dev.userId.toString(),

        label:
          dev.userName,
      }),
    );

  const allDevelopersAssigned =
    selectedDefects.size >
      0 &&
    developers.length >
      0 &&
    availableDevelopers.length ===
      0;

  const reassignTotalCount =
    isServerPaginated
      ? totalElements
      : filteredDefects.length;

  // -------------------------------------------------------
  // PERMISSION
  // -------------------------------------------------------

  if (!can.defect.edit) {
    return (
      <Card className="mb-6 border border-yellow-200 bg-yellow-50">
        <CardContent className="p-4 text-center text-yellow-700">
          You don't have permission to reassign defects.
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------

  return (
    <>
      <Card
        className={`border border-blue-200 bg-blue-50/30 ${className}`}
      >
        <CardContent className="p-6">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Reassign Defects
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Select active defects and reassign them to a different developer

                <span className="ml-2 text-xs text-blue-600 font-medium">
                  ({activeDefects.length} active defects)
                </span>
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                resetAll();
                onClose();
              }}
              className="border-gray-300 hover:bg-gray-100"
            >
              Close
            </Button>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

            {/* FILTER BY ASSIGNED DEV */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Filter by Assigned Dev
              </label>

              <select
                value={filterAssignee}
                onChange={(e) =>
                  setFilterAssignee(
                    e.target.value,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white h-10"
              >
                <option value="">
                  All assigned developers
                </option>

                {assignedDevOptions.map(
                  (dev) => (
                    <option
                      key={
                        dev.value
                      }
                      value={
                        dev.value
                      }
                    >
                      {
                        dev.label
                      }
                    </option>
                  ),
                )}
              </select>

              <span className="text-xs text-gray-400 mt-1 block">
                {
                  assignedDevOptions.length
                }{" "}
                developer(s) assigned to defects
              </span>
            </div>

            {/* FILTER BY SUBMODULE */}
            {/* FILTER BY MODULE */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    Filter by Module
  </label>

  <select
  value={selectedModule}
  onChange={(e) => {
    const moduleValue = e.target.value;

    // module change ஆகும்போது old selections clear
    setSelectedDefects(new Set());
    setSelectedAssignee("");
    setSelectedSubmodule("");

    setSelectedModule(moduleValue);
  }}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white h-10"
>
  <option value="">
    All modules
  </option>

  {moduleOptions.map((module) => (
    <option
      key={module.value}
      value={module.value}
    >
      {module.label}
    </option>
  ))}
</select>

  <span className="text-xs text-gray-400 mt-1 block">
    {moduleOptions.length} module(s) available
  </span>
</div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Filter by Submodule
              </label>

              <select
                value={
                  selectedSubmodule
                }
                onChange={(e) => {
                  if (
                    selectedSubmodule &&
                    selectedSubmodule !==
                      e.target.value
                  ) {
                    setSelectedDefects(
                      new Set(),
                    );

                    setSelectedAssignee(
                      "",
                    );
                  }

                  setSelectedSubmodule(
                    e.target.value,
                  );
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white h-10"
              >
                <option value="">
                  All submodules
                </option>

                {filteredSubmodules.map((sub) => (
                    <option
                      key={`${sub.moduleId}-${sub.id}`}
                      value={String(sub.id)}
                    >
                      {
                        sub.label
                      }
                    </option>
                  ),
                )}
              </select>

              <span className="text-xs text-gray-400 mt-1 block">
                {
                  projectSubmodules.length
                }{" "}
                submodule(s) available
              </span>
            </div>

            {/* REASSIGN TO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reassign To{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <select
                value={
                  selectedAssignee
                }
                onChange={(e) =>
                  setSelectedAssignee(
                    e.target.value,
                  )
                }
                disabled={
                  submoduleDevsLoading ||
                  !selectedSubmodule ||
                  availableDevelopers.length ===
                    0
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white h-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedSubmodule
                    ? "Select submodule first"
                    : submoduleDevsLoading
                      ? "Loading developers..."
                      : availableDevelopers.length ===
                          0
                        ? "No developers available"
                        : "Select developer"}
                </option>

                {developerOptions.map(
                  (opt) => (
                    <option
                      key={
                        opt.value
                      }
                      value={
                        opt.value
                      }
                    >
                      {
                        opt.label
                      }
                    </option>
                  ),
                )}
              </select>

              {selectedSubmodule && (
                <span className="text-xs text-gray-400 mt-1 block">
                  {
                    availableDevelopers.length
                  }{" "}
                  developer(s) available

                  {selectedDefects.size >
                    0 &&
                    currentAssigneeIds.size ===
                      1 &&
                    availableDevelopers.length >
                      0 && (
                      <span className="ml-1 text-blue-600">
                        (current assignee excluded)
                      </span>
                    )}

                  {allDevelopersAssigned && (
                    <span className="ml-1 text-orange-600">
                      ⚠️ All available developers are already assigned
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* REASSIGN BUTTON */}
          <div className="flex justify-end mb-6">
            <Button
              onClick={
                handleReassign
              }
              disabled={
                selectedDefects.size ===
                  0 ||
                !selectedAssignee ||
                submitting ||
                availableDevelopers.length ===
                  0
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              {submitting ? (
                <>
                  <span className="inline-block animate-spin mr-2">
                    ⟳
                  </span>
                  Reassigning...
                </>
              ) : (
                `Reassign (${selectedDefects.size})`
              )}
            </Button>
          </div>

          {/* DEFECT TABLE */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">

                  <th className="px-4 py-3 text-left w-10">
                    <Checkbox
                      checked={
                        isAllSelected
                      }
                      onCheckedChange={
                        handleSelectAll
                      }
                      disabled={
                        paginatedDefects.length ===
                        0
                      }
                    />
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Defect ID
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                    Description
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submodule
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[130px]">
                    Current Assignee
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                    Status
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">

                {isLoadingDefects ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">

                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />

                        <span className="text-sm text-gray-500">
                          Loading active defects...
                        </span>

                      </div>
                    </td>
                  </tr>
                ) : paginatedDefects.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {activeDefects.length ===
                      0
                        ? "No active defects found to reassign."
                        : "No defects match the selected filters."}
                    </td>
                  </tr>
                ) : (
                  paginatedDefects.map(
                    (defect) => (
                      <tr
                        key={
                          defect.id
                        }
                        className="hover:bg-gray-50 transition-colors"
                      >

                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedDefects.has(
                              defect.id,
                            )}
                            onCheckedChange={(
                              checked,
                            ) =>
                              handleSelectDefect(
                                defect.id,
                                checked,
                              )
                            }
                          />
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                          {
                            defect.defectId
                          }
                        </td>

                        <td
                          className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate"
                          title={
                            defect.description
                          }
                        >
                          {
                            defect.description
                          }
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-700">
                          {
                            defect.module_name ||
                            "-"
                          }
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-700">
                          {
                            defect.sub_module_name ||
                            "-"
                          }
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-700">
                          {
                            defect.assigned_to_name ||
                            "Unassigned"
                          }
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              (
                                defect.defect_status_name ||
                                ""
                              ).toUpperCase() ===
                              "NEW"
                                ? "bg-green-100 text-green-800"
                                : (
                                      defect.defect_status_name ||
                                      ""
                                    ).toUpperCase() ===
                                    "OPEN"
                                  ? "bg-blue-100 text-blue-800"
                                  : (
                                        defect.defect_status_name ||
                                        ""
                                      ).toUpperCase() ===
                                      "IN_PROGRESS"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : (
                                          defect.defect_status_name ||
                                          ""
                                        ).toUpperCase() ===
                                        "REJECTED"
                                      ? "bg-red-100 text-red-800"
                                      : (
                                            defect.defect_status_name ||
                                            ""
                                          ).toUpperCase() ===
                                          "ON_HOLD"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {
                              defect.defect_status_name ||
                              "-"
                            }
                          </span>
                        </td>

                      </tr>
                    ),
                  )
                )}

              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="mt-4 flex items-center justify-between flex-wrap gap-2">

            <div className="text-sm text-gray-500">

              <span>
                {
                  selectedDefects.size
                }{" "}
                of{" "}
                {
                  reassignTotalCount
                }{" "}
                defects selected

                {!isServerPaginated &&
                  filteredDefects.length !==
                    activeDefects.length &&
                  ` (filtered from ${activeDefects.length} active)`}
              </span>

              {selectedDefects.size >
                0 &&
                selectedAssignee && (
                  <span className="ml-3 text-blue-600 font-medium">
                    ✓ Ready to reassign{" "}
                    {
                      selectedDefects.size
                    }{" "}
                    defect(s)
                  </span>
                )}

              {selectedDefects.size >
                0 &&
                availableDevelopers.length ===
                  0 && (
                  <span className="ml-3 text-orange-600 font-medium">
                    ⚠️ No available developers to reassign
                  </span>
                )}

            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">

                <button
                  onClick={() =>
                    setCurrentPage(
                      (p) =>
                        Math.max(
                          1,
                          p - 1,
                        ),
                    )
                  }
                  disabled={
                    currentPage ===
                    1
                  }
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>

                <span className="text-sm text-gray-700">
                  Page{" "}
                  {
                    currentPage
                  }{" "}
                  of{" "}
                  {
                    totalPages
                  }
                </span>

                <button
                  onClick={() =>
                    setCurrentPage(
                      (p) =>
                        Math.min(
                          totalPages,
                          p + 1,
                        ),
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>

                <select
                  value={
                    defectsPerPage
                  }
                  onChange={(e) => {
                    setDefectsPerPage(
                      Number(
                        e.target.value,
                      ),
                    );

                    setCurrentPage(
                      1,
                    );
                  }}
                  className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>
                    5
                  </option>

                  <option value={10}>
                    10
                  </option>

                  <option value={25}>
                    25
                  </option>

                  <option value={50}>
                    50
                  </option>
                </select>

              </div>
            )}

          </div>

        </CardContent>
      </Card>

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={
          showConfirmation
        }
        message={
          confirmationMessage
        }
        onConfirm={
          handleConfirmReassign
        }
        onCancel={
          handleCancelReassign
        }
        confirmText="Continue"
        cancelText="Cancel"
        title="Confirm Reassign"
        type="warning"
      />
    </>
  );
};