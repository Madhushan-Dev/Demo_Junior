  // import {sampleData} from "../api/defect/addNewDefect";
  import { Pie as ChartJSPie } from "react-chartjs-2";
  import React, { useEffect, useState } from "react";
  import { FILE_SERVER_BASE_URL } from "../lib/api";
  import { deleteDefectById } from "../api/defect/delete_defect";
  import { getAllSubmoduleAllocatedDevBySubmoduleId } from "../api/subModuleDevAlloc";
  import { ReassignDefects } from '../pages/ReassignDefects';
  import {
    Plus,
    Edit2,
    Trash2,
    CheckCircle,
    Eye,
    FileText,
    ChevronLeft,
    ChevronRight,
    History,
    MessageSquare,
  } from "lucide-react";
  import { Card, CardContent } from "../components/ui/Card";
  import { Button } from "../components/ui/Button";
  import { Input } from "../components/ui/Input";
  import { ImagePicker } from "../components/ui/ImagePicker";
  import { Modal } from "../components/ui/Modal";
  import { SearchableMultiSelect } from "../components/ui/SearchableMultiSelect";
  import { useApp } from "../context/AppContext";
  import { useParams, useNavigate, useLocation } from "react-router-dom";
  import { importDefects } from "../api/importTestCase";
  import { getAllPriorities, Priority } from "../api/priority";
  import { getAllDefectStatuses, DefectStatus } from "../api/defectStatus";
  import {
    getStartingStatus,
    getWorkFlowsByStatusTypeId,
  } from "../api/workflow";
  import {createTestCase} from "../api/testCase/createTestcase";
  import { getDefectTypes } from "../api/defectType";
  import { getSeverities } from "../api/severity";
  import { ProjectSelector } from "../components/ui/ProjectSelector";
  import { getModulesByProjectId } from "../api/module/getModule";
  import { getSubmodulesByModuleId } from "../api/submodule/submoduleget";
  import { getActiveReleasesByProject } from "../api/releaseView/getActiveReleasesByProject";
  import {
    filterDefects,
    getDefectsByProjectId,
    DefectFilterParams,
  } from "../api/defect/filterDefectByProject";
  import { getAllUsersSimple } from "../api/users/getallusers";

  import { updateDefectById } from "../api/defect/updateDefect";
  import {
    ProjectRelease,
  } from "../api/releaseView/ProjectReleaseCardView";
  import { addDefects } from "../api/defect/addNewDefect";
  import {
    getDefectHistoryByDefectId,
    DefectHistoryEntry as RealDefectHistoryEntry,
  } from "../api/defect/defectHistory";
  import AlertModal from "../components/ui/AlertModal";
  import { getDefectSeveritySummary } from "../api/dashboard/dash_get";

  import { getDevelopersWithRolesByProjectId } from "../api/bench/projectAllocation";
  import { getActiveRelease } from "../api/releaseView/getActiveRelease";
  import { useAuth } from "../context/AuthContext";
  import { createComment } from "../api/comment/createComment";
  import { updateComment } from "../api/comment/createComment";
  import { getCommentsByDefectId } from "../api/comment/comment";
  import apiClient from "../lib/api";
  import { useAccessibleProjects } from "../api/useAccessibleProjects";
  import { usePermission } from "../context/PermissionContext";

  import { useSearchParams } from 'react-router-dom';
  import { OrbitProgress } from "react-loading-indicators";
  import ENDPOINTS from "../utils/endpoints";
import StatusWorkflow from "./StatusWorkflow";


  // ---------------------------------------------------------------------------
  // Local type definition. The API module "filterDefectByProject" does not
  // currently export a `FilteredDefect` type, which was causing a build error
  // (TS2724). Defining it locally here unblocks compilation. If you later add
  // a real `export interface FilteredDefect {...}` to
  // `../api/defect/filterDefectByProject.ts`, delete this local copy and
  // import it from there instead so there is a single source of truth.
  // ---------------------------------------------------------------------------
  export interface FilteredDefect {
    id: number;
    defectId: string;
    description: string;
    steps: string;
    stepsToRecreation?: string;
    moduleId?: number;
    subModuleId?: number;
    severityId?: number;
    priorityId?: number;
    statusId?: number;
    defectTypeId?: number;
    releaseId?: number;
    isAddTestCase?: boolean;
    testCaseId?: number;
    module_name?: string;
    sub_module_name?: string;
    severity_name?: string;
    priority_name?: string;
    defect_status_name?: string;
    defect_type_name?: string;
    defectTypeName?: string;
    release_name?: string;
    project_name?: string;
    assigned_to_name?: string;
    assigned_by_name?: string;
    assigned_to_id?: number;
    assigned_by_id?: number;
    attachment?: string | null;
    reOpenCount?: number;
    release_test_case_description?: string;
    commentsCount?: number;
    commentCount?: number;
    name?: string;
    projectDefectNumber?: number;
  }

  // Define ConfirmModal inline (above the component)
  const ConfirmModal = ({
    isOpen,
    message,
    onCancel,
    onConfirm,
  }: {
    isOpen: boolean;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[60] flex justify-center items-start bg-black bg-opacity-40">
        <div
          className="mt-8 bg-[#444] text-white rounded-lg shadow-2xl min-w-[400px] max-w-[95vw]"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
        >
          <div className="px-6 pb-4 pt-5 text-base text-white">{message}</div>
          <div className="px-6 pb-5 flex justify-end gap-3">
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-2 rounded mr-2"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded"
              onClick={onConfirm}
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };





  

  export const Defects: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const {
      defects,
      releases,
      setSelectedProjectId: setGlobalProjectId,
      defectRefreshTrigger,
    } = useApp();

    // Backend projects state
    const [selectedProjectId, setSelectedProjectIdLocal] = React.useState<
      string | null
    >(projectId || null);

    const { can } = usePermission();
    const canEditDefect = can.defect.edit;
    const canChangeStatus = can.defect.statusUpdate;
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Backend defects state
    const [backendDefects, setBackendDefects] = React.useState<FilteredDefect[]>(
      [],
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDefect, setEditingDefect] = useState<FilteredDefect | null>(
      null,
    );

    // Add state for AlertModal
    const [alert, setAlert] = useState<{ open: boolean; message: string }>({
      open: false,
      message: "",
    });
    const showAlert = (message: string) => setAlert({ open: true, message });
    const closeAlert = () => setAlert({ open: false, message: "" });
    useSearchParams();
    // Add state for defect severity summary from API
    const [defectSeveritySummary, setDefectSeveritySummary] = useState<any>(null);
    const [loadingSeveritySummary, setLoadingSeveritySummary] = useState(false);
    const [severitySummaryError, setSeveritySummaryError] = useState<
      string | null
    >(null);

    const [showReassign, setShowReassign] = useState(true);
    const bulkReassignDefects = async (defectIds: number[], assignedToId: number) => {
      try {
        if (!defectIds || defectIds.length === 0) {
          showAlert('Please select at least one defect to reassign.');
          throw new Error('Please select at least one defect to reassign.');
        }

        if (!assignedToId) {
          showAlert('Please select a developer to reassign to.');
          throw new Error('Please select a developer to reassign to.');
        }

        const payload = {
          defectIds: defectIds,
          assignedToId: assignedToId
        };

        const response = await apiClient.patch(ENDPOINTS.DEFECT_BULK_REASSIGN, payload);

        if (response.data?.status === 'Success' || response.data?.statusCode === 200 || response.data?.statusCode === 2000) {
          const successMessage = response.data?.statusMessage || `Successfully reassigned ${defectIds.length} defect(s)`;
          showAlert(`✅ ${successMessage}`);
          await fetchData();
          return response.data;
        } else {
          throw new Error(response.data?.statusMessage || 'Failed to reassign defects');
        }
      } catch (error: any) {
        let errorMessage = 'Failed to reassign defects. Please try again.';

        if (error.response) {
          const { status, data } = error.response;
          if (data?.message) {
            errorMessage = data.message;
          } else if (data?.statusMessage) {
            errorMessage = data.statusMessage;
          } else if (data?.error) {
            errorMessage = data.error;
          } else if (status === 404) {
            errorMessage = 'The reassign endpoint was not found. Please contact support.';
          } else if (status === 400) {
            errorMessage = 'Invalid request. Please check your selection.';
          } else if (status === 403) {
            errorMessage = 'You do not have permission to reassign defects.';
          } else if (status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          }
        } else if (error.request) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        showAlert(`❌ ${errorMessage}`);
        throw new Error(errorMessage);
      }
    };

    // Add state for developers for the filter dropdown
    const [projectDevelopers, setProjectDevelopers] = useState<
      { id: number; name: string; role?: string }[]
    >([]);

    const [pieModal, setPieModal] = useState<{
      open: boolean;
      severity: string | null;
    }>({ open: false, severity: null });

    const [releasesData, setReleasesData] = useState<ProjectRelease[]>([]);
    const [formData, setFormData] = useState({
      defectId: "",
      id: "",
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
      testCaseId: "",
      testCaseRequired: false,
    });
    const originalFormDataRef = React.useRef<typeof formData | null>(null);

    const isOnlyNumberText = (value: string) => {
      const trimmed = value.trim();
      return trimmed !== "" && /^[-+]?\d+(\.\d+)?$/.test(trimmed);
    };

    const isDescriptionOnlyNumber = isOnlyNumberText(formData.description);

    // Add state for comments by defect
    const [commentsByDefectId, setCommentsByDefectId] = useState<
      Record<
        string,
        {
          id?: string | number;
          defectId?: string | number;
          text: string;
          timestamp: string;
          userId?: string | number;
          createdByName?: String;
        }[]
      >
    >({});
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
    const [activeCommentsDefectId, setActiveCommentsDefectId] = useState<
      string | null
    >(null);
    const [newCommentText, setNewCommentText] = useState("");

    const [isCommentsLoading, setIsCommentsLoading] = useState(false);

    const [isViewStepsModalOpen, setIsViewStepsModalOpen] = useState(false);
    const [viewingSteps, setViewingSteps] = useState<string | null>(null);
    const [isViewDefectDetailsModalOpen, setIsViewDefectDetailsModalOpen] =
      useState(false);
    const [viewingDefectDetails, setViewingDefectDetails] = useState<any>(null);
    const [isRejectionCommentModalOpen, setIsRejectionCommentModalOpen] =
      useState(false);
    //By workflow creator
    const [workflowStartStatusId, setWorkflowStartStatusId] =
        useState<string>("");
      const fetchWorkflowStartStatus = async () => {
      try {
        const statusId = await getStartingStatus();

        setWorkflowStartStatusId(String(statusId));
      } catch (error) {
        console.error("Failed to load workflow starting status", error);
      }
    };
    const [isImageViewerModalOpen, setIsImageViewerModalOpen] = useState(false);
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState<string>("");
    const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
    const [statusEditComment, setStatusEditComment] = useState<string>("");
    const [viewingDefectHistory, setViewingDefectHistory] = useState<
      RealDefectHistoryEntry[]
    >([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isEditingRejectionComment, setIsEditingRejectionComment] =
      useState(false);

    // Add state to track original status and selected next status
    const [originalStatusId, setOriginalStatusId] = useState<string>("");
    const [selectedNextStatusId, setSelectedNextStatusId] = useState<string>("");

    const [priorities, setPriorities] = useState<Priority[]>([]);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [defectStatuses, setDefectStatuses] = useState<any[]>([]);
    const [isStatusLoading, setIsStatusLoading] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);

    // State for next available statuses based on current status
    const [nextStatuses, setNextStatuses] = useState<DefectStatus[]>([]);
    const [isNextStatusLoading, setIsNextStatusLoading] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState<{
      open: boolean;
      defectId: string | null;
    }>({ open: false, defectId: null });

    // Add state for severities and defect types
    const [severities, setSeverities] = useState<
      { id: number; name: string; color: string }[]
    >([]);
    const [defectTypes, setDefectTypes] = useState<
      { id: number; name: string }[]
    >([]);

    // Add state for modules and submodules
    const [modules, setModules] = React.useState<{ id: string; name: string }[]>(
      [],
    );
    const [submodules, setSubmodules] = React.useState<
      { id: string; name: string }[]
    >([]);
    const [submoduleError] = React.useState<string>("");

    // Separate state for filter submodules
    // NOTE: previously this object type declared `name` twice (once required,
    // once optional) which caused TS2300 / TS2687 / TS2717 duplicate-identifier
    // errors. Fixed to a single `name: string`.
    const [filterSubmodules, setFilterSubmodules] = React.useState<
      { id: string; name: string; moduleId?: string }[]
    >([]);

    // Add state for allocated users for the selected module
    const [allocatedUsers, setAllocatedUsers] = useState<
      { userId: number; userName: string; empId: number }[]
    >([]);
    const [isAllocatedUsersLoading, setIsAllocatedUsersLoading] = useState(false);

    // Filter state
    const [filters, setFilters] = useState({
      id: "",
      module: [] as string[],
      subModule: [] as string[],
      type: [] as string[],
      severity: [] as string[],
      name: [] as string[],
      status: [] as string[],
      releaseId: [] as string[],
      assignedTo: [] as string[],
      reportedBy: [] as string[],
      search: "",
    });

    // Add debouncing for filter changes
    const [debouncedFilters, setDebouncedFilters] = useState(filters);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [defectsPerPage, setDefectsPerPage] = useState(10);
    const [totalPagesFromServer, setTotalPagesFromServer] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [isServerPaginated, setIsServerPaginated] = useState(false);

    const loadWorkflowStartStatus = async () => {
    try {
      const res = await apiClient.get("/status/workflow/start");

      const startStatusId = res.data?.data;
      console.log("WORKFLOW START STATUS ID:", startStatusId);
      if (startStatusId) {
        setWorkflowStartStatusId(String(startStatusId));
      }
    } catch (error) {
      console.error("Failed to load workflow starting status", error);
    }
  };

    useEffect(() => {
      fetchWorkflowStartStatus();//Workflow creator
    }, []);

    useEffect(() => {
      loadWorkflowStartStatus();
    }, []);
    const commentsContainerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (commentsContainerRef.current) {
        commentsContainerRef.current.scrollTop =
          commentsContainerRef.current.scrollHeight;
      }
    }, [commentsByDefectId, activeCommentsDefectId, isCommentsLoading]);
    const { projects } = useAccessibleProjects();

    const selectedProject = projects.find(
      (p) => String(p.id ?? p.projectId) === String(selectedProjectId),
    );
    const isProjectActive =
      !selectedProject || selectedProject.status?.toLowerCase() === "active";

    React.useEffect(() => {
      if (projectId) setSelectedProjectIdLocal(projectId);
    }, [projectId]);

    // Debounce filter changes to prevent excessive API calls
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedFilters(filters);
      }, 700); // 600ms delay so typing doesn't trigger a fetch/re-render per keystroke

      return () => clearTimeout(timer);
    }, [filters]);

    // Fetch developers for Assigned To filter dropdown
    useEffect(() => {
      if (!selectedProjectId) {
        setProjectDevelopers([]);
        return;
      }

      getDevelopersWithRolesByProjectId(selectedProjectId)
        .then((data: any) => {
          // The endpoint's wrapper shape varies (bare array, {data}, {users},
          // paginated {data:{content}}, double-wrapped {data:{data}}...), so
          // probe every known shape before giving up — otherwise the Assigned
          // To filter dropdown silently renders zero options.
          let developers: any[] = [];
          if (Array.isArray(data)) {
            developers = data;
          } else if (Array.isArray(data?.data)) {
            developers = data.data;
          } else if (Array.isArray(data?.data?.content)) {
            developers = data.data.content;
          } else if (Array.isArray(data?.content)) {
            developers = data.content;
          } else if (Array.isArray(data?.data?.data)) {
            developers = data.data.data;
          } else if (Array.isArray(data?.users)) {
            developers = data.users;
          }

          if (developers.length === 0) {
            console.warn(
              "Assigned To filter: /defect/developers returned no usable list",
              data,
            );
          }

          const mappedDevelopers = developers
            .map((dev: any) => ({
              id: dev.employeeId || dev.userId || dev.id,
              name:
                dev.firstName && dev.lastName
                  ? `${dev.firstName} ${dev.lastName}`.trim()
                  : dev.userName || dev.name || dev.employeeName || "Unknown",
              role: dev.role || dev.roleName,
            }))
            .filter((dev: any) => dev.id);

          setProjectDevelopers(mappedDevelopers);
        })
        .catch((error: any) => {
          console.error("Failed to fetch developers for filter:", error);
          setProjectDevelopers([]);
        });
    }, [selectedProjectId]);

    // Fetch project-specific lookup data (module map + submodule map)
    // when selectedProjectId changes. Uses moduleId / moduleName field names
    // to match the real API response shape:
    // { data: [{ moduleId, moduleName, subModules: [...] }] }
    React.useEffect(() => {
      if (!selectedProjectId) return;
      getAllDefectStatuses().then((statuses: any) => {
        // handled by fetchDefectStatuses() below; kept for status name cache only
        void statuses;
      });
      getModulesByProjectId(Number(selectedProjectId)).then((modules: any) => {
        const moduleList = Array.isArray(modules.data)
          ? modules.data
          : modules.data
            ? [modules.data]
            : [];
        Promise.all(
          moduleList.map((m: any) => getSubmodulesByModuleId(m.moduleId)),
        ).catch(() => null);
      });
    }, [selectedProjectId]);

    React.useEffect(() => {
    if (!selectedProjectId) return;
    getModulesByProjectId(Number(selectedProjectId))
      .then((res: any) => {
        console.log("🔍 RAW MODULES API RESPONSE:", res);
        console.log("🔍 res.data:", res.data);
        console.log("🔍 typeof res.data:", typeof res.data, Array.isArray(res.data));
        if (Array.isArray(res.data) && res.data.length > 0) {
          console.log("🔍 First module object keys:", Object.keys(res.data[0]));
          console.log("🔍 First module object:", res.data[0]);
        }

        const moduleData = Array.isArray(res.data)
          ? res.data
          : res.data
            ? [res.data]
            : [];
        const mapped = moduleData.map((m: any) => ({
          id: m.moduleId?.toString(),
          name: m.moduleName,
        }));
        console.log("🔍 MAPPED MODULES (what dropdown uses):", mapped);
        setModules(mapped);
      })
      .catch((error: any) => {
        console.error("Failed to fetch modules:", error?.message || error);
        setModules([]);
      });
  }, [selectedProjectId]);

    // Save edited comment function
    const saveEditedComment = async (comment: any, _commentId: string) => {
      if (editingCommentText.trim()) {
        try {
          await updateComment(comment.id, editingCommentText, comment.defectId);
          console.log(comment.defectId)

          setCommentsByDefectId((prev) => {
            const updatedComments = (prev[activeCommentsDefectId as string] || []).map((c) =>
              c.timestamp === comment.timestamp && c.userId === comment.userId
                ? { ...c, text: editingCommentText }
                : c,
            );
            return { ...prev, [activeCommentsDefectId as string]: updatedComments };
          });

          setEditingCommentId(null);
          setEditingCommentText("");
          showAlert("Comment updated successfully!");
        } catch (error) {
          console.error("Failed to update comment:", error);
          showAlert("Failed to update comment");
        }
      } else {
        setEditingCommentId(null);
        setEditingCommentText("");
      }
    };

    const formatTimeWithoutMs = (timeStr: string) => {
      if (!timeStr) return timeStr;
      if (timeStr.includes('.')) {
        return timeStr.split('.')[0];
      }
      const match = timeStr.match(/^(\d{2}:\d{2}:\d{2})/);
      return match ? match[1] : timeStr;
    };

    type DefectResponseDTO = {
      defectId: number;
      briefDescription: string;
      projectDefectNumber:number;
      steps: string;
      moduleId: number;
      subModuleId: number;
      severityId: number;
      priorityId: number;
      statusTypeId: number;
      defectTypeId: number;
      releaseId: number;
      testCaseRequired: boolean;
      moduleName: string;
      subModuleName: string;
      severityName: string;
      priorityName: string;
      statusName: string;
      defectTypeName: string;
      releaseName: string;
      projectName: string;
      assignToName: string;
      enterBy: string;
      attachmentImage: string | null;
    };

  const mapDefect = (d: any): FilteredDefect => {
    const description = d.briefDescription ?? d.description ?? "";
    const steps = d.steps ?? d.stepsToRecreation ?? "";

    return {
      id: d.defectId,
      defectId: String(d.defectId),
      description,
      projectDefectNumber: d.projectDefectNumber,
      steps,
      stepsToRecreation: steps,
      moduleId: d.moduleId,
      subModuleId: d.subModuleId,
      severityId: d.severityId,
      priorityId: d.priorityId,
      statusId: d.statusTypeId,
      defectTypeId: d.defectTypeId,
      releaseId: d.releaseId,
      isAddTestCase: d.testCaseRequired,
      testCaseId: undefined,
      module_name: d.moduleName,
      sub_module_name: d.subModuleName,
      severity_name: d.severityName,
      priority_name: d.priorityName,
      defect_status_name: d.statusName,
      defect_type_name: d.defectTypeName,
      release_name: d.releaseName,
      project_name: d.projectName,
      assigned_to_name: d.assignToName ?? d.assignTo ?? d.assignedToName ?? d.assignedTo,
      assigned_by_name: d.enterByName ?? d.enteredBy ?? d.enteredByName ?? d.reportedBy,
      // assigned_to_id: undefined,
      assigned_by_id: d.enterBy ?? d.enteredById ?? d.reportedById ?? undefined,
      // assigned_to_name: d.assignToName ?? "",
assigned_to_id: d.assignToId ?? undefined,
      attachment: d.attachmentImage,
      reOpenCount: 0,
      release_test_case_description: "",
      commentsCount: 0,
      name: d.priorityName,
    };
  };

    // Fetch defects when project changes or filters change
    const fetchData = () => {
      if (!selectedProjectId) return;

      const hasFilters = !!(
        (debouncedFilters.type && debouncedFilters.type.length > 0) ||
        (debouncedFilters.severity && debouncedFilters.severity.length > 0) ||
        (debouncedFilters.name && debouncedFilters.name.length > 0) ||
        (debouncedFilters.status && debouncedFilters.status.length > 0) ||
        (debouncedFilters.releaseId && debouncedFilters.releaseId.length > 0) ||
        (debouncedFilters.module && debouncedFilters.module.length > 0) ||
        (debouncedFilters.subModule && debouncedFilters.subModule.length > 0) ||
        (debouncedFilters.assignedTo && debouncedFilters.assignedTo.length > 0) ||
        (debouncedFilters.reportedBy && debouncedFilters.reportedBy.length > 0) ||
        (debouncedFilters.search && debouncedFilters.search.trim().length > 0)
      );

      setIsLoading(true);

      if (!hasFilters) {
        getDefectsByProjectId(
          Number(selectedProjectId),
          currentPage - 1,
          defectsPerPage
        )
          .then((pageData: any) => {
            console.log("🔍 RAW LIST ITEM:", pageData.content[0]);
            setBackendDefects(
              pageData.content.map(mapDefect).sort((a: FilteredDefect, b: FilteredDefect) => a.id - b.id),
            );
            setTotalPagesFromServer(pageData.totalPages);
            setTotalElements(pageData.totalElements);
            setIsServerPaginated(true);
          })
          .catch((err: any) => {
            setBackendDefects([]);
            setTotalPagesFromServer(1);
            setTotalElements(0);
            console.error("Failed to fetch defects by project:", err);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Backend /defect/filter only accepts a single id per field, so the
        // filter dropdowns for these fields are single-select (see
        // SearchableMultiSelect `singleSelect` usages below).
                const filterParams: DefectFilterParams = { projectId: selectedProjectId };

        if (debouncedFilters.search && debouncedFilters.search.trim()) {
          filterParams.search = debouncedFilters.search.trim();
        }

        if (debouncedFilters.type[0]) {
          const typeId = defectTypes?.find(
            (t) => t.name?.toLowerCase() === debouncedFilters.type[0].toLowerCase(),
          )?.id;
          if (typeId !== undefined) filterParams.defectTypeId = Number(typeId);
        }

        if (debouncedFilters.severity.length > 0) {
          const severityIds = debouncedFilters.severity
            .map((name) => severities?.find((s) => s.name?.toLowerCase() === name.toLowerCase())?.id)
            .filter((id) => id !== undefined)
            .map((id) => Number(id));
          if (severityIds.length > 0) filterParams.severityId = severityIds; 
        }

        if (debouncedFilters.name.length > 0) {
          const priorityIds = debouncedFilters.name
            .map((name) => priorities?.find((p) => p.name?.toLowerCase() === name.toLowerCase())?.id)
            .filter((id) => id !== undefined)
            .map((id) => Number(id));
          if (priorityIds.length > 0) filterParams.priorityId = priorityIds;
        }

        if (debouncedFilters.status.length > 0) {
          const statusTypeIds = debouncedFilters.status
            .map((name) => defectStatuses?.find((s) => s.statusName?.toLowerCase() === name.toLowerCase())?.id)
            .filter((id) => id !== undefined)
            .map((id) => Number(id));
          if (statusTypeIds.length > 0) filterParams.statusTypeId = statusTypeIds;
        }

        if (debouncedFilters.module[0]) {
          const moduleId = modules?.find(
            (m) => m.name?.toLowerCase() === debouncedFilters.module[0].toLowerCase(),
          )?.id;
          if (moduleId !== undefined) filterParams.moduleId = Number(moduleId);
        }

        if (debouncedFilters.subModule[0]) {
          const subModuleId = filterSubmodules?.find(
            (sm) => sm.name?.toLowerCase() === debouncedFilters.subModule[0].toLowerCase(),
          )?.id;
          if (subModuleId !== undefined) filterParams.subModuleId = Number(subModuleId);
        }

        // Best-effort: backend contract doesn't confirm releaseId support on
        // /defect/filter, so we also re-check it client-side below.
        if (debouncedFilters.releaseId[0]) {
          const releaseId = parseInt(debouncedFilters.releaseId[0]);
          if (!isNaN(releaseId)) filterParams.releaseId = releaseId;
        }

        filterDefects(filterParams, currentPage - 1, defectsPerPage)
          .then((data: any) => {
            const defectsData = Array.isArray(data)
              ? data
              : data?.content || data.data?.content || data.data || data;
            const tPages = data?.totalPages ?? data?.data?.totalPages ?? 1;
            const tElements = data?.totalElements ?? data?.data?.totalElements ?? defectsData.length;
            const hasServerPage = !!(data?.totalPages !== undefined || data?.data?.totalPages !== undefined);

            setBackendDefects(
              defectsData.map(mapDefect).sort((a: FilteredDefect, b: FilteredDefect) => a.id - b.id),
            );
            setTotalPagesFromServer(tPages);
            setTotalElements(tElements);
            setIsServerPaginated(hasServerPage);
          })
          .catch((err: any) => {
            setBackendDefects([]);
            setTotalPagesFromServer(1);
            setTotalElements(0);
            console.error("Failed to fetch defects with filters:", err?.message || err);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    };

    React.useEffect(() => {
      if (!selectedProjectId) return;
      fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      selectedProjectId,
      debouncedFilters,
      currentPage,
      defectsPerPage,
      defectRefreshTrigger,
    ]);

    const filteredDefects = backendDefects.filter((d) => {
      try {
        const search = filters.search.trim().toLowerCase();
        const matchesSearch =
          !search ||
          (d.description && d.description.toLowerCase().includes(search)) ||
          (d.defectId && d.defectId.toLowerCase().includes(search)) ||
          (d.steps && d.steps.toLowerCase().includes(search));
// const projectDefectNumber = d.projectDefectNumber?.toString() || "";
        const matchesEnteredBy =
          !filters.reportedBy || filters.reportedBy.length === 0 ||
          (d.assigned_by_name && filters.reportedBy.includes(d.assigned_by_name));

        // Backend /defect/filter has no release/assignedTo params, so these
        // are re-checked here as a client-side pass over the fetched page.
        const matchesRelease =
          !filters.releaseId || filters.releaseId.length === 0 ||
          (d.releaseId !== undefined && filters.releaseId.includes(String(d.releaseId)));

        // filters.assignedTo now holds assignee *names* (matching the dropdown
        // option values), so compare directly against the defect's name.
        const matchesAssignedTo =
          !filters.assignedTo || filters.assignedTo.length === 0 ||
          (!!d.assigned_to_name && filters.assignedTo.includes(d.assigned_to_name));

        return matchesSearch && matchesEnteredBy && matchesRelease && matchesAssignedTo;
      } catch (error) {
        console.error("Error filtering defect:", error, d);
        return true;
      }
    });
    ///added new method to save only active releases

const fetchReleaseData = async (selectedProject: string | null) => {
  try {
    if (!selectedProject) return;

    const data = await getActiveReleasesByProject(selectedProject);

    setReleasesData(
      Array.isArray(data)
        ? (data as any).filter((release: any) => release.status === "ACTIVE")
        : [],
    );
  } catch (error) {
    console.error("Failed to fetch active releases:", error);
    setReleasesData([]);
  }
};


    //by dilakshan
    // const fetchReleaseData = async (selectedProject: string | null) => {
    //   try {
    //     if (!selectedProject) return;

    //     const data = await getActiveReleasesByProject(selectedProject);
    //     setReleasesData(Array.isArray(data) ? (data as any) : []);
    //   } catch (error) {
    //     console.error("Failed to fetch active releases:", error);
    //     setReleasesData([]);
    //   }
    // };

    const fetchNextStatuses = async (fromStatusId: number) => {
    try {
      console.log("FETCH NEXT STATUSES FOR:", fromStatusId);

      setIsNextStatusLoading(true);

      const transitions = await getWorkFlowsByStatusTypeId(fromStatusId);

      console.log("NEXT STATUS RESPONSE:", transitions);

      const mappedStatuses = (transitions || [])
        .map((item: any) => {
          const status = (defectStatuses as any[]).find(
            (s) => String(s.id) === String(item.statusTypeId2),
          );
          return status
            ? {
                id: status.id,
                statusName: status.statusName,
                colorCode: status.colorCode,
              }
            : null;
        })
        .filter(Boolean);

      setNextStatuses(mappedStatuses as any);
    } catch (error: any) {
      console.error("NEXT STATUS API ERROR:", error);
      setNextStatuses([]);
    } finally {
      setIsNextStatusLoading(false);
    }
  };

    useEffect(() => {
      fetchReleaseData(selectedProjectId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProjectId]);

    // Project selection handler
    const handleProjectSelect = (id: string) => {
      setSelectedProjectIdLocal(id);
      setGlobalProjectId(id);
      navigate(`/projects/${id}/defects`);
    };


const defectAdd = async () => {
  const effectiveStatusId =
    formData.statusId ||
    workflowStartStatusId ||
    defectStatuses[0]?.id?.toString() ||
    "";

  // ============================================================
  // STEP 1: Determine existing test case ID, if any
  // ============================================================
  let linkedTestCaseId: number | null = formData.testCaseId
    ? Number(formData.testCaseId)
    : null;

  // ============================================================
  // STEP 2: If Test Case Required = YES and no test case exists,
  //         CREATE TEST CASE FIRST
  // ============================================================
  if (formData.testCaseRequired && !linkedTestCaseId) {
    if (!formData.moduleId || !formData.subModuleId) {
      showAlert(
        "Select a module and sub-module before creating a test case."
      );
      return;
    }

    try {
      const projectId = Number(selectedProjectId);
      const moduleId = Number(formData.moduleId);
      const subModuleId = Number(formData.subModuleId);

      const testCasePayload = {
        testCaseName:
          formData.description?.slice(0, 100) || "TestCase",

        description: formData.description,

        testSteps: formData.steps,

        defectTypeId: formData.typeId
          ? Number(formData.typeId)
          : undefined,

        projectId,

        moduleId,

        subModuleId,

        severityId: formData.severityId
          ? Number(formData.severityId)
          : undefined,
      };

      console.log(
        "CREATE TEST CASE PAYLOAD:",
        testCasePayload
      );

      // ----------------------------------------------------------
      // CREATE TEST CASE
      // ----------------------------------------------------------
      const tcRes = await createTestCase(
        projectId,
        moduleId,
        subModuleId,
        testCasePayload as any
      );

      console.log(
        "CREATE TEST CASE RESPONSE:",
        tcRes
      );

      // ----------------------------------------------------------
      // GET TEST CASE ID FROM RESPONSE
      // ----------------------------------------------------------
      linkedTestCaseId =
        tcRes?.data?.testCaseId ??
        tcRes?.data?.id ??
        (tcRes as any)?.testCaseId ??
        null;

      console.log(
        "NEW TEST CASE ID:",
        linkedTestCaseId
      );

      // ----------------------------------------------------------
      // If no ID returned, STOP.
      // Do NOT create defect.
      // ----------------------------------------------------------
      if (!linkedTestCaseId) {
        showAlert(
          "Test case was not created correctly. Defect was not saved."
        );
        return;
      }
    } catch (tcError: any) {
      console.error(
        "FAILED TO CREATE TEST CASE:",
        tcError
      );

      showAlert(
        "Failed to create test case. Defect was not saved."
      );

      return;
    }
  }

  // ============================================================
  // STEP 3: NOW CREATE DEFECT
  //         linkedTestCaseId contains the newly created ID
  // ============================================================
const user = JSON.parse(localStorage.getItem("user") || "{}");

const enterBy = user.employeeId;
  const payload: any = {
    briefDescription: formData.description,

    steps: formData.steps,

    expectedResult: "",

    actualResult: "",

    projectId: selectedProjectId
      ? Number(selectedProjectId)
      : undefined,

    moduleId: formData.moduleId
      ? Number(formData.moduleId)
      : undefined,

    subModuleId: formData.subModuleId
      ? Number(formData.subModuleId)
      : undefined,

    defectTypeId: formData.typeId
      ? Number(formData.typeId)
      : undefined,

    severityId: formData.severityId
      ? Number(formData.severityId)
      : undefined,

    priorityId: formData.priorityId
      ? Number(formData.priorityId)
      : undefined,

    statusTypeId: effectiveStatusId
      ? Number(effectiveStatusId)
      : undefined,

    releaseIds: formData.releaseId
      ? [Number(formData.releaseId)]
      : [],

    // enterBy: formData.assignbyId
    //   ? Number(formData.assignbyId)
    //   : undefined,
    enterBy:enterBy ? Number(enterBy) : undefined,

    assignToId: formData.assigntoId
      ? Number(formData.assigntoId)
      : null,

    // IMPORTANT
    testCaseRequired: formData.testCaseRequired,

    // IMPORTANT:
    // This will contain the newly created test case ID
    testCaseId: linkedTestCaseId,
  };

  console.log(
    "FINAL CREATE DEFECT PAYLOAD:",
    payload
  );

  // ============================================================
  // STEP 4: CREATE DEFECT
  // ============================================================

  try {
    const attachmentFile =
      (formData as any).attachmentFile as
        | File
        | null
        | undefined;
    
    const response = workflowStartStatusId ? await addDefects(
      payload,
      attachmentFile ?? null
    ):[];

    console.log(
      "CREATE DEFECT RESPONSE:",
      response
    );

    if (
      response?.statusCode === 200 ||
      response?.statusCode === 201 ||
      response?.statusCode === 2000
    ) {
      showAlert("Defect added successfully!");

      await fetchData();

      resetForm();
    } else {
      const errorMessage =
        (response as any)?.statusMessage ||
        (response as any)?.message ||
        "Failed to add defect.";

      showAlert(
        `Failed to add defect: ${errorMessage}`
      );
    }
  } catch (error: any) {
    // Keep your existing catch block exactly as-is
    console.error("CREATE DEFECT ERROR:", error);

    // Your existing error handling here
     let errorMessage = "Error adding defect. Please try again.";

      if (error.response) {
        const { status, data } = error.response;

        if (data?.data && Array.isArray(data.data)) {
          errorMessage = data.data
            .map((item: any) => item.message)
            .join("\n");
        } else if (data?.message) {
          errorMessage = data.message;
        } else if (data?.statusMessage) {
          errorMessage = data.statusMessage;
        } else if (typeof data === "string") {
          errorMessage = data;
        } else {
          errorMessage = `Server error (${status})`;
        }
      } else if (error.request) {
        errorMessage =
          "Network error. Please check your connection.";
      } else {
        errorMessage =
          error.message || "Unknown error";
      }

      showAlert(`Failed to add defect: ${errorMessage}`);
  }
};





    // CRUD handlers
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (isSubmitting) return;

      if (!formData.description.trim()) {
        showAlert("Please enter a description");
        return;
      }
        if (!formData.assigntoId.trim()) {
          console.log("Assigned To ID is empty:", formData.assigntoId);
        showAlert("Please select an Assigned To user");
        return;
      }

      if (isOnlyNumberText(formData.description)) {
        showAlert("Brief Description can't be only numbers");
        return;
      }
      if (!formData.severityId) {
        showAlert("Please select a severity");
        return;
      }
      if (!formData.priorityId) {
        showAlert("Please select a name");
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
      
      if (isOnlyNumberText(formData.steps)) {
        showAlert("Steps can't be only numbers");
        return;
      };

      if (!editingDefect && !formData.releaseId) {
        showAlert("Failed to add defect: Release cannot be null");
        return;
      }

      setIsSubmitting(true);

      if (editingDefect) {
        try {
          const defectIdForApi = Number(formData.id);

          if (
            editingDefect.assigned_to_name &&
            userList.length === 0 &&
            isUsersLoading
          ) {
            showAlert("Please wait for user data to load before updating...");
            return;
          }

          const original = originalFormDataRef.current;
          const hasChanges =
            !original ||
            original.description !== formData.description ||
            original.steps !== formData.steps ||
            original.moduleId !== formData.moduleId ||
            original.subModuleId !== formData.subModuleId ||
            original.severityId !== formData.severityId ||
            original.priorityId !== formData.priorityId ||
            original.statusId !== formData.statusId ||
            original.typeId !== formData.typeId ||
            original.releaseId !== formData.releaseId ||
            original.assigntoId !== formData.assigntoId ||
            original.testCaseId !== formData.testCaseId ||
            original.testCaseRequired !== formData.testCaseRequired ||
            original.attachment !== formData.attachment ||
            !!(formData as any).attachmentFile;

          if (!hasChanges) {
            showAlert("No changes were made.");
            setIsSubmitting(false);
            return;
          }
          const payload = {
            briefDescription: formData.description,
            steps: formData.steps,
            expectedResult: "",
            actualResult: "",
            isAddTestCase: formData.testCaseRequired,
            moduleId: Number(formData.moduleId),
            subModuleId: Number(formData.subModuleId),
            severityId: Number(formData.severityId),
            priorityId: Number(formData.priorityId),
            statusTypeId: Number(formData.statusId),
            defectTypeId: Number(formData.typeId),
            releaseId: Number(formData.releaseId),
            projectId: Number(selectedProjectId),
            assignToId: formData.assigntoId
              ? Number(formData.assigntoId)
              : null,
            testCaseId: formData.testCaseId ? Number(formData.testCaseId) : null,
            // Case C: existing attachment cleared and no new file picked
            removeAttachment:
              formData.attachment === "" && !(formData as any).attachmentFile,
          };

          console.log("UPDATE DEFECT PAYLOAD:", payload, {
            "formData.statusId": formData.statusId,
            selectedNextStatusId,
            originalStatusId,
            canChangeStatus,
          });

          
          const response = await updateDefectById(defectIdForApi, payload, (formData as any).attachmentFile);
          const responseData =
            response && (response as any).data
              ? (response as any).data
              : response;
          if (
            responseData?.status === "Success" ||
            responseData?.statusCode === 200 ||
            responseData?.statusCode === 2000
          ) {
            showAlert("Defect updated successfully!");
            await fetchData();
            resetForm();
          } else {
            showAlert("Failed to update defect.");
          }
       } catch (error: any) {
  let errorMessage = "Error updating defect. Please try again.";

  if (error.response) {
    const { status, data } = error.response;

    if (data) {
      // Your backend ResponseWrapper error message
      if (data.statusMessage) {
        errorMessage = data.data[0]?.message;
      }
      // Fallback
      else if (data.message) {
        errorMessage = data.message;
      }
      // Fallback if message is inside data array
      else if (
        Array.isArray(data.data) &&
        data.data.length > 0 &&
        data.data[0]?.message
      ) {
        errorMessage = data.data[0].message;
      }
      else if (data.error) {
        errorMessage = data.error;
      }
      else if (typeof data === "string") {
        errorMessage = data;
      }
      else {
        errorMessage = `Update failed (${status}). Please try again.`;
      }
    } else {
      errorMessage = `Server error (${status}). Please try again.`;
    }
  } else if (error.request) {
    errorMessage =
      "Failed to update defect: Network error. Please check your connection.";
  } else {
    errorMessage =
      `Failed to update defect: ${error.message || "Unknown error"}`;
  }

  showAlert(errorMessage);

} finally {
  setIsSubmitting(false);
}
      } else {
        try {
          await defectAdd();
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    const handleEdit = async (defect: FilteredDefect) => {
      const defectSubModuleId =
        (defect as any).subModuleId?.toString() ||
        (defect as any).sub_module_id?.toString() ||
        "";

      let moduleId =
        (defect as any).moduleId?.toString() ||
        (defect as any).module_id?.toString() ||
        modules.find((m) => m.name === defect.module_name)?.id ||
        "";

      if (!moduleId && defectSubModuleId) {
        for (const module of modules) {
          const res = await getSubmodulesByModuleId(Number(module.id));

          const list = res.data || [];

          const found = list.find(
            (sm: any) => sm.id?.toString() === defectSubModuleId,
          );

          if (found) {
            moduleId = module.id.toString();
            break;
          }
        }
      }

      const severityId =
        (defect as any).severityId?.toString() ||
        (defect as any).severity_id?.toString() ||
        severities.find((s) => s.name === defect.severity_name)?.id?.toString() ||
        "";

      const priorityId =
        (defect as any).priorityId?.toString() ||
        (defect as any).priority_id?.toString() ||
        (priorities as any[]).find(
          (p) => (p.name) === defect.priority_name,
        )?.id?.toString() ||
        (priorities as any[]).find(
          (p) => (p.name) === defect.priority_name,
        )?.id?.toString() ||
        "";

      const typeId =
        (defect as any).defectTypeId?.toString() ||
        (defect as any).typeId?.toString() ||
        (defect as any).type_id?.toString() ||
        defectTypes
          .find((t) => t.name === defect.defect_type_name)
          ?.id?.toString() ||
        "";

      const statusId =
    (defect as any).statusId?.toString() ||
    (defect as any).status_id?.toString() ||
    (defect as any).statusTypeId?.toString() ||
    (defect as any).status_type_id?.toString() ||
    (defect as any).defectStatusId?.toString() ||
    (defectStatuses as any[])
      .find(
        (s) =>
          s.statusName?.toLowerCase() ===
          defect.defect_status_name?.toLowerCase()
      )
      ?.id?.toString() ||
    "";

      const releaseId =
    (defect as any).releaseId?.toString() ||
    (defect as any).release_id?.toString() ||
    (releasesData as any[])
      .find(
        (r) =>
          r.releaseName === defect.release_name
      )
      ?.releaseId?.toString() ||
    "";

      const assigntoId =
        defect.assigned_to_id?.toString() ||
        (defect as any).assignedTo?.toString() ||
        (defect as any).assignedToId?.toString() ||
        allocatedUsers
          .find((u) => u.userName === defect.assigned_to_name)
          ?.userId?.toString() ||
        userList
          .find((u) => `${u.firstName} ${u.lastName}` === defect.assigned_to_name)
          ?.id?.toString() ||
        "";

      setEditingDefect(defect);

      const editFormData = {
        defectId: defect.defectId?.toString() || "",
        id: defect.id?.toString() || "",
        description: defect.description || "",
        steps: (defect as any).stepsToRecreation || defect.steps || "",
        moduleId,
        subModuleId: defectSubModuleId,
        severityId,
        priorityId,
        typeId,
        assigntoId,
        assignbyId:
          defect.assigned_by_id?.toString() ||
          (defect as any).assignedBy?.toString() ||
          (defect as any).assignedById?.toString() ||
          "",
        releaseId,
        attachment: defect.attachment || "",
        statusId,
        testCaseId:
          (defect as any).testCaseId?.toString() ||
          (defect as any).test_case_id?.toString() ||
          "",
        testCaseRequired:
          (defect as any).isAddTestCase ??
          (defect as any).testCaseRequired ??
          true,
      };

      setFormData(editFormData);
      originalFormDataRef.current = editFormData;

      setOriginalStatusId(statusId);
      setSelectedNextStatusId(statusId);

      if (statusId) {
        await fetchNextStatuses(Number(statusId));
      }

      setIsModalOpen(true);

      if (moduleId) {
        try {
          const res = await getSubmodulesByModuleId(Number(moduleId));

          const mapped = (res.data || []).map((sm: any) => ({
            id: sm.id?.toString() || sm.subModuleId?.toString(),
            name: sm.name || sm.subModuleName,
          }));

          setSubmodules(mapped);

          const subModuleId =
            (defect as any).subModuleId?.toString() ||
            (defect as any).sub_module_id?.toString() ||
            mapped.find((sm) => sm.name === defect.sub_module_name)?.id ||
            "";

          setFormData((prev) => ({
            ...prev,
            subModuleId,
          }));
        } catch (err) {
          setSubmodules([]);
        }
      }
    };

    const fetchDefectStatuses = async () => {
      setIsStatusLoading(true);
      setStatusError(null);

      try {
        // const response = await apiClient.get("/status-type");

        // console.log("STATUS TYPE RESPONSE:", response.data);

        // let statusData = [];

        // if (response.data?.data?.content) {
        //   statusData = response.data.data.content;
        // } else if (response.data && Array.isArray(response.data)) {
        //   statusData = response.data;
        // } else if (
        //   response.data?.content &&
        //   Array.isArray(response.data.content)
        // ) {
        //   statusData = response.data.content;
        // } else if (
        //   response.data?.data &&
        //   Array.isArray(response.data.data)
        // ) {
        //   statusData = response.data.data;
        // }
        const response = await getAllDefectStatuses(0, 100);

        const statusData = response.content || [];

        const mappedStatuses = statusData.map((s: any) => ({
          id: String(s.statusTypeId),
          statusName: s.statusName,
          colorCode: s.colorCode || "#808080",
        }));

        console.log("WORKFLOW START ID:", workflowStartStatusId);
        console.log("AVAILABLE STATUSES:", mappedStatuses);

        setDefectStatuses(mappedStatuses);

        if (!editingDefect && !formData.statusId && mappedStatuses.length > 0) {
          const defaultStatusId =
            workflowStartStatusId || mappedStatuses[0]?.id?.toString();
          if (defaultStatusId) {
            setFormData((prev) => ({ ...prev, statusId: defaultStatusId }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch statuses:", error);
        setStatusError("Failed to load statuses");
      } finally {
        setIsStatusLoading(false);
      }
    };

    useEffect(() => {
    
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fetchWorkflowStartStatus();
    }, []);

    useEffect(() => {
    fetchDefectStatuses();
    }, [workflowStartStatusId]);//Workflow creator

    const openDeleteConfirm = (defectId: string) =>
      setDeleteConfirm({ open: true, defectId });
    const closeDeleteConfirm = () =>
      setDeleteConfirm({ open: false, defectId: null });
    const handleDelete = async (defectId: string) => {
      openDeleteConfirm(defectId);
    };

    const confirmDelete = async () => {
      if (!deleteConfirm.defectId) return closeDeleteConfirm();
      try {
        const defect = backendDefects.find(
          (d) => d.defectId === deleteConfirm.defectId,
        );
        if (!defect) {
          showAlert("Defect not found.");
          closeDeleteConfirm();
          return;
        }
        const response = await deleteDefectById(defect.id);
        if ((response as any).statusMessage === "Success" || (response as any).statusCode === 200) {
          showAlert("Defect deleted successfully.");
          await fetchData();
        } else {
          showAlert("Delete failed. Please try again.");
        }
      } catch (error: any) {
        let errorMessage = "Failed to delete defect. Please try again.";

        if (error.response) {
          const { status, data } = error.response;

          if (data) {
            if (data?.data[0]?.message) {
              errorMessage = `Failed to delete defect: ${data?.data[0].message}`;
            } else if (data.error) {
              errorMessage = `Failed to delete defect: ${data.error}`;
            } else if (typeof data === "string") {
              errorMessage = `Failed to delete defect: ${data}`;
            } else {
              errorMessage = `Failed to delete defect: ${JSON.stringify(data)}`;
            }
          } else {
            errorMessage = `Failed to delete defect: Server error (${status})`;
          }
        } else if (error.request) {
          errorMessage =
            "Failed to delete defect: Network error. Please check your connection.";
        } else {
          errorMessage =  error.response?.data?.statusMessage ||
    error.response?.data?.data?.[0]?.message ||
    "Failed to delete defect.";;
        }

        showAlert(errorMessage);
      } finally {
        closeDeleteConfirm();
      }
    };

    useEffect(() => {
      const viewId = new URLSearchParams(location.search).get("view");

      if (!viewId) return;

      const defect = backendDefects.find((d) => String(d.id) === String(viewId));

      if (defect) {
        setViewingDefectDetails({
          ...defect,
          module: defect.module_name,
          submodule: defect.sub_module_name,
          type: defect.defect_type_name,
          severity: defect.severity_name,
          priority: defect.priority_name,
          status: defect.defect_status_name,
          assignedTo: defect.assigned_to_name,
          enteredBy: defect.assigned_by_name,
          release: defect.release_name,
          commentCount: defect.commentCount,
        });

        setIsViewDefectDetailsModalOpen(true);
      }
    }, [backendDefects, location.search]);

    const resetForm = () => {
      setFormData({
        defectId: "",
        id: "",
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
        testCaseId: "",
        testCaseRequired: false,
      });
      setEditingDefect(null);
      setIsModalOpen(false);
      setIsSubmitting(false);
      originalFormDataRef.current = null;

      setSubmodules([]);
      setAllocatedUsers([]);

      setNextStatuses([]);
      setIsNextStatusLoading(false);

      setOriginalStatusId("");
      setSelectedNextStatusId("");
    };

    const handleViewAttachment = (attachmentUrl: string) => {
      let fullUrl = attachmentUrl;
      if (attachmentUrl && !attachmentUrl.startsWith("http")) {
        // The backend returns attachment paths as relative paths (e.g.
        // "/uploads/defects/xxx.png"). Resolving a relative path from the
        // frontend page would point at the frontend's own origin (e.g. the
        // Vite dev server on :5173), not the backend that actually serves
        // the file. Prefix with the backend origin so the URL always points
        // at the real file server, both for the in-app preview and for
        // "Open in New Tab".
        const baseUrl = FILE_SERVER_BASE_URL;

        const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
        // The backend stores the value as "/uploads/defects/<file>", but older
        // rows (saved by a previous buggy update) hold just the bare filename.
        // Normalise both forms to the static path served by the file server.
        let relPath = attachmentUrl.replace(/^\/+/, "");
        if (!relPath.startsWith("uploads/")) {
          relPath = `uploads/defects/${relPath}`;
        }
        fullUrl = `${cleanBase}/${relPath}`;
      }
      setViewingImageUrl(fullUrl);
      setIsImageViewerModalOpen(true);
    };

    const closeImageViewer = () => {
      setIsImageViewerModalOpen(false);
      setViewingImageUrl(null);
    };

    const handleInputChange = async (field: string, value: string) => {
      if (field === "testCaseRequired") {
        setFormData((prev) => ({ ...prev, [field]: value === "true" }));
      } else if (field === "statusId") {
        setSelectedNextStatusId(value);

        setFormData((prev) => ({
          ...prev,
          statusId: value,
        }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: value }));
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
      const safeSeverityName = severityName ? String(severityName) : "";
      if (!safeSeverityName) return "bg-gray-100 text-gray-800";

      try {
        const severity = severities.find(
          (s) => s.name?.toLowerCase() === safeSeverityName.toLowerCase(),
        );
        if (severity && severity.color) {
          const hexColor = severity.color.startsWith("#")
            ? severity.color
            : `#${severity.color}`;
          return { backgroundColor: hexColor, color: "white" };
        }
      } catch (err) {
        console.warn("Error finding severity color:", err);
      }

      switch (safeSeverityName.toLowerCase()) {
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

    const releaseOptions = (releasesData as any[]).map((release) => ({
    value: release.releaseId.toString(),
    label: release.releaseName,
  }));

    const getPriorityColor = (priorityName: string | undefined | null) => {
      const safePriorityName = priorityName ? String(priorityName) : "";
      if (!safePriorityName) return "bg-gray-100 text-gray-800";

      try {
        const matched = (priorities as any[]).find(
          (p) => (p.name)?.toLowerCase() === safePriorityName.toLowerCase(),
        );
        const color = matched?.color;
        if (matched && color) {
          const hexColor = color.startsWith("#") ? color : `#${color}`;
          return { backgroundColor: hexColor, color: "white" };
        }
      } catch (err) {
        console.warn("Error finding name color:", err);
      }

      switch (safePriorityName.toLowerCase()) {
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

    const getStatusColor = (statusName: string | undefined | null) => {
      const safeStatusName = statusName ? String(statusName) : "";
      if (!safeStatusName) return "bg-gray-100 text-gray-800";

      try {
        const status = (defectStatuses as any[]).find(
          (s) => s.statusName?.toLowerCase() === safeStatusName.toLowerCase(),
        );
        if (status && status.colorCode) {
          const hexColor = status.colorCode.startsWith("#")
            ? status.colorCode
            : `#${status.colorCode}`;
          return { backgroundColor: hexColor, color: "white" };
        }
      } catch (err) {
        console.warn("Error finding status color:", err);
      }

      switch (safeStatusName.toLowerCase()) {
        case "open":
          return "bg-purple-100 text-purple-800";
        case "in-progress":
          return "bg-blue-100 text-blue-800";
        case "resolved":
          return "bg-green-100 text-green-800";
        case "closed":
          return "bg-gray-100 text-gray-800";
        case "rejected":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    React.useEffect(() => {
    if (!formData.moduleId) {
      setSubmodules([]);
      setFormData((f) => ({ ...f, subModuleId: "" }));
      return;
    }
    getSubmodulesByModuleId(Number(formData.moduleId))
      .then((res: any) => {
        console.log("🔍 RAW SUBMODULES RESPONSE:", res);
        console.log("🔍 res.data:", res.data);
        const rawList = Array.isArray(res.data) ? res.data : res.data?.content || [];
        console.log("🔍 rawList:", rawList);
        if (rawList.length > 0) {
          console.log("🔍 First submodule object keys:", Object.keys(rawList[0]));
        }

        const mapped = rawList.map((sm: any) => ({
          id: (sm.id ?? sm.subModuleId)?.toString(),
          name: sm.name ?? sm.subModuleName,
        }));
        console.log("🔍 MAPPED SUBMODULES:", mapped);
        setSubmodules(mapped);
      })
      .catch((err) => {
        console.error("Failed to fetch submodules:", err?.message || err);
        setSubmodules([]);
      });
  }, [formData.moduleId]);

    // Fetch submodules for filter when module filter changes
    React.useEffect(() => {
      if (!filters.module || !filters.module.length) {
        setFilterSubmodules([]);
        return;
      }

      const selectedModules = modules.filter((m) =>
        filters.module.includes(m.name),
      );
      if (!selectedModules.length) {
        setFilterSubmodules([]);
        return;
      }

      Promise.all(
        selectedModules.map((module) =>
          getSubmodulesByModuleId(Number(module.id))
            .then((res) => ({
              moduleId: module.id,
              name: module.name,
              submodules: (res.data || []).map((sm: any) => ({
                id: sm.id?.toString() || sm.subModuleId?.toString(),
                name: sm.name || sm.subModuleName,
                moduleId: module.id,
              })),
            }))
            .catch((error) => {
              console.error(
                `Failed to fetch submodules for module ${module.name}:`,
                error,
              );
              return { moduleId: module.id, name: module.name, submodules: [] };
            }),
        ),
      ).then((results) => {
        const allSubmodules = results.flatMap((result) => result.submodules);
        setFilterSubmodules(allSubmodules);
      });
    }, [filters.module, modules]);

    // Get highlight param from URL
    const highlightId = React.useMemo(() => {
      const params = new URLSearchParams(location.search);
      return params.get("highlight");
    }, [location.search]);
    const highlightedRowRef = React.useRef<HTMLTableRowElement>(null);
    React.useEffect(() => {
      if (highlightedRowRef.current) {
        highlightedRowRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, [highlightId]);

    // ---------------------------------------------------------------------
    // Normalization helper: converts a raw backend record into a consistent
    // { id, name, color } shape regardless of what the backend calls its
    // fields (defectTypeId vs id, priorityName vs name, etc). Every fetch
    // below runs its response through this ONCE, right at the API boundary.
    // Nothing past this point (JSX, filters, color lookups) should ever
    // reference a raw backend field name again — only .id / .name / .color.
    // ---------------------------------------------------------------------
    const normalizeIdName = (
      item: any,
      idKeys: string[],
      nameKeys: string[],
      colorKeys: string[] = [],
    ) => ({
      id: idKeys.map((k) => item?.[k]).find((v) => v !== undefined),
      name: nameKeys.map((k) => item?.[k]).find((v) => v !== undefined),
      color:
        colorKeys
          .map((k) => item?.[k])
          .find((v) => v !== undefined) || "#6B7280",
    });

    // Fetch severities, defect types, priorities on mount
    React.useEffect(() => {
      // Confirmed shape: { data: [{ severityId, severityName, severityColor }] }
      // (falls back to id/name/color in case a different endpoint variant is used)
      getSeverities()
        .then((res: any) => {
          const raw = res.data?.content || res.data || [];
          const list = Array.isArray(raw) ? raw : [];
          setSeverities(
            list.map((s: any) =>
              normalizeIdName(
                s,
                ["severityId", "id"],
                ["severityName", "name"],
                ["severityColor", "colorCode"],
              ),
            ) as any,
          );
        })
        .catch((error: any) => {
          console.error("Failed to fetch severities:", error?.message || error);
          setSeverities([]);
        });

      // Confirmed shape (from DefectType.tsx, which already works correctly):
      // getDefectTypes(page, pageSize) -> { data: { content: [{ defectTypeId, defectTypeName }], totalPages } }
      (getDefectTypes as any)(0, 1000)
        .then((res: any) => {
          const raw = res.data?.content || res.data || res.content || [];
          const list = Array.isArray(raw) ? raw : [];
          setDefectTypes(
            list.map((t: any) =>
              normalizeIdName(t, ["defectTypeId", "id"], ["defectTypeName", "name"]),
            ) as any,
          );
        })
        .catch((error: any) => {
          console.error("Failed to fetch defect types:", error?.message || error);
          setDefectTypes([]);
        });

      // Confirmed shape: { priorityId, priorityName, priorityColor }
      getAllPriorities()
        .then((res: any) => {
          let raw: any[] = [];
          if (res.data?.data && Array.isArray(res.data.data)) {
            raw = res.data.data;
          } else if (res.data?.content && Array.isArray(res.data.content)) {
            raw = res.data.content;
          } else if (res.data && Array.isArray(res.data)) {
            raw = res.data;
          } else if (Array.isArray(res)) {
            raw = res;
          } else if (res.content && Array.isArray(res.content)) {
            raw = res.content;
          }
          setPriorities(
            raw.map((p: any) =>
              normalizeIdName(
                p,
                ["priorityId", "id"],
                ["priorityName", "name"],
                ["priorityColor", "colorCode"],
              ),
            ) as any,
          );
        })
        .catch((error: any) => {
          console.error("Failed to fetch priorities:", error);
          setPriorities([]);
        });
    }, []);

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!selectedProjectId) {
        showAlert("Please select a project before importing defects.");
        return;
      }

      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];

      if (
        !allowedTypes.includes(file.type) &&
        !file.name.match(/\.(xlsx|xls|csv)$/i)
      ) {
        showAlert(
          "Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.",
        );
        return;
      }

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      try {
  setIsImporting(true);

  const response: any = await importDefects(
    uploadFormData,
    selectedProjectId
  );

  // Backend returns:
  // {
  //   total: 5,
  //   imported: 5,
  //   failed: 0,
  //   skipped: 0
  // }

  if (
    response &&
    typeof response.total === "number" &&
    typeof response.imported === "number" &&
    typeof response.failed === "number" &&
    typeof response.skipped === "number"
  ) {
    await fetchData();

    const totalCount = response.total;
    const importedCount = response.imported;
    const failedCount = response.failed;
    const skippedCount = response.skipped;

    let successMessage = "";

    if (failedCount === 0 && skippedCount === 0) {
      successMessage =
        `✅ Import completed successfully! ` +
        `All ${importedCount} defects imported.`;
    } else if (importedCount > 0 && failedCount > 0) {
      successMessage =
        `⚠️ Partial import completed! ` +
        `${importedCount} out of ${totalCount} defects imported successfully, ` +
        `${failedCount} defects failed to import.`;

      if (skippedCount > 0) {
        successMessage += ` ${skippedCount} defects skipped.`;
      }
    } else if (importedCount > 0 && skippedCount > 0) {
      successMessage =
        `✅ Import completed! ` +
        `${importedCount} defects imported successfully, ` +
        `${skippedCount} defects skipped.`;
    } else if (failedCount > 0) {
      successMessage =
        `❌ Import completed with errors. ` +
        `${failedCount} defects failed to import.`;
    } else {
      successMessage =
        `Import completed. Total: ${totalCount}, ` +
        `Imported: ${importedCount}, ` +
        `Failed: ${failedCount}, ` +
        `Skipped: ${skippedCount}`;
    }

    showAlert(successMessage);
  } else {
    showAlert("Import failed: Invalid response from server.");
  }
} catch (error: any) {
  console.error("Import error:", error);

  let errorMessage = "Import failed: Unknown error";

  if (error?.response?.data?.message) {
    errorMessage = `Import failed: ${error.response.data.message}`;
  } else if (error?.message) {
    errorMessage = `Import failed: ${error.message}`;
  }

  showAlert(errorMessage);
} finally {
  setIsImporting(false);
}

      // try {
      //   setIsImporting(true);

        

      //   const response: any = await importDefects(uploadFormData, selectedProjectId);

      //   if (
      //     response.status === "success" ||
      //     response.status === "Success" ||
      //     response.status === "Created" ||
      //     response.statusCode === 200 ||
      //     response.statusCode === 201 ||
      //     response.statusCode === 2000
      //   ) {
      //     await fetchData();

      //     let successMessage = "Defects imported successfully!";

      //     if (response.data) {
      //       const importedCount =
      //         response.data.imported ||
      //         response.data.success ||
      //         response.data.successCount ||
      //         0;
      //       const failedCount =
      //         response.data.failed ||
      //         response.data.error ||
      //         response.data.failedCount ||
      //         0;
      //       const totalCount =
      //         response.data.total ||
      //         response.data.totalCount ||
      //         importedCount + failedCount;
      //       const skippedCount =
      //         response.data.skipped || response.data.skippedCount || 0;

      //       if (totalCount > 0 && failedCount === 0 && skippedCount === 0) {
      //         successMessage = `✅ Import completed successfully! All ${totalCount} defects imported.`;
      //       } else if (importedCount > 0 && failedCount > 0) {
      //         successMessage = `⚠️ Partial import completed! ${importedCount} out of ${totalCount} defects imported successfully, ${failedCount} defects failed to import.`;

      //         if (
      //           response.data.failureReasons &&
      //           Array.isArray(response.data.failureReasons)
      //         ) {
      //           const reasons = response.data.failureReasons
      //             .slice(0, 3)
      //             .join(", ");
      //           const moreReasons =
      //             response.data.failureReasons.length > 3
      //               ? ` and ${response.data.failureReasons.length - 3} more issues`
      //               : "";
      //           successMessage += ` Failure reasons: ${reasons}${moreReasons}`;
      //         } else if (
      //           response.data.errors &&
      //           Array.isArray(response.data.errors)
      //         ) {
      //           const errors = response.data.errors
      //             .slice(0, 2)
      //             .map((error: any) => {
      //               if (typeof error === "string") return error;
      //               if (error.message) return error.message;
      //               return JSON.stringify(error);
      //             })
      //             .join(", ");
      //           const moreErrors =
      //             response.data.errors.length > 2
      //               ? ` and ${response.data.errors.length - 2} more errors`
      //               : "";
      //           successMessage += ` Issues: ${errors}${moreErrors}`;
      //         }
      //       } else if (importedCount > 0 && skippedCount > 0) {
      //         successMessage = `✅ Import completed! ${importedCount} defects imported successfully, ${skippedCount} defects skipped.`;
      //         if (response.data.skipReasons) {
      //           successMessage += ` Skip reasons: ${response.data.skipReasons}`;
      //         }
      //       } else if (importedCount > 0) {
      //         successMessage = `✅ Import completed successfully! ${importedCount} defects imported.`;
      //       } else if (totalCount > 0) {
      //         successMessage = `✅ Import completed successfully! ${totalCount} defects imported.`;
      //       }

      //       if (
      //         response.data.warnings &&
      //         Array.isArray(response.data.warnings) &&
      //         response.data.warnings.length > 0
      //       ) {
      //         const warningCount = response.data.warnings.length;
      //         successMessage += ` Note: ${warningCount} defect(s) imported with warnings.`;
      //       }

      //       if (response.data.breakdown) {
      //         successMessage += ` Breakdown: ${response.data.breakdown}`;
      //       }
      //     }

      //     if (
      //       successMessage === "Defects imported successfully!" &&
      //       response.message
      //     ) {
      //       successMessage = `Defects imported successfully! ${response.message}`;
      //     }

      //     showAlert(successMessage);
      //   } else {
      //     let failureMessage = "Import failed: Unknown error";

      //     if (response.message) {
      //       failureMessage = `Import failed: ${response.message}`;
      //     }

      //     if (
      //       response.data &&
      //       failureMessage === "Import failed: Unknown error"
      //     ) {
      //       if (
      //         response.data.validationErrors &&
      //         Array.isArray(response.data.validationErrors)
      //       ) {
      //         const validationErrors = response.data.validationErrors
      //           .slice(0, 3)
      //           .map((error: any) => {
      //             if (error.row && error.field && error.message) {
      //               return `Row ${error.row}, ${error.field}: ${error.message}`;
      //             } else if (error.row && error.message) {
      //               return `Row ${error.row}: ${error.message}`;
      //             } else if (error.message) {
      //               return error.message;
      //             }
      //             return JSON.stringify(error);
      //           });
      //         const moreErrors =
      //           response.data.validationErrors.length > 3
      //             ? ` and ${response.data.validationErrors.length - 3} more validation errors`
      //             : "";
      //         failureMessage = `Import failed - Validation errors: ${validationErrors.join(", ")}${moreErrors}`;
      //       } else if (
      //         response.data.fileErrors &&
      //         Array.isArray(response.data.fileErrors)
      //       ) {
      //         failureMessage = `Import failed - File errors: ${response.data.fileErrors.join(", ")}`;
      //       } else if (
      //         response.data.errors &&
      //         Array.isArray(response.data.errors)
      //       ) {
      //         const errorCount = response.data.errors.length;
      //         const sampleErrors = response.data.errors
      //           .slice(0, 3)
      //           .map((error: any) => {
      //             if (typeof error === "string") return error;
      //             if (error.message) return error.message;
      //             if (error.error) return error.error;
      //             return JSON.stringify(error);
      //           });
      //         const moreErrors =
      //           errorCount > 3 ? ` and ${errorCount - 3} more errors` : "";
      //         failureMessage = `Import failed: ${sampleErrors.join(", ")}${moreErrors}`;
      //       } else if (response.data.summary) {
      //         failureMessage = `Import failed: ${response.data.summary}`;
      //       } else if (response.data.error) {
      //         failureMessage = `Import failed: ${response.data.error}`;
      //       } else if (response.data.message) {
      //         failureMessage = `Import failed: ${response.data.message}`;
      //       }
      //     }

      //     if (response.statusCode && failureMessage === "Import failed: Unknown error") {
      //       if (response.statusCode === 400) {
      //         failureMessage =
      //           "Import failed: Bad request - Please check your file format and data.";
      //       } else if (response.statusCode === 413) {
      //         failureMessage =
      //           "Import failed: File too large. Please reduce file size and try again.";
      //       } else if (response.statusCode === 415) {
      //         failureMessage =
      //           "Import failed: Unsupported file type. Please use Excel (.xlsx) or CSV (.csv) format.";
      //       } else if (response.statusCode === 422) {
      //         failureMessage =
      //           "Import failed: Data validation error. Please check your file content.";
      //       } else if (response.statusCode >= 500 && response.statusCode < 5000) {
      //         failureMessage = `Import failed: Server error (${response.statusCode}). Please try again later.`;
      //       } else {
      //         failureMessage =
      //           "Import failed: Please check your file and try again.";
      //       }
      //     }

      //     showAlert(failureMessage);
      //   }
      // } catch (error: any) {
      //   let errorMessage = "Failed to import defects. Please try again.";

      //   if (error.response) {
      //     const { status, data } = error.response;

      //     if (data) {
      //       if (data.validationErrors && Array.isArray(data.validationErrors)) {
      //         const validationErrors = data.validationErrors
      //           .slice(0, 3)
      //           .map((error: any) => {
      //             if (error.row && error.field && error.message) {
      //               return `Row ${error.row}, ${error.field}: ${error.message}`;
      //             } else if (error.row && error.message) {
      //               return `Row ${error.row}: ${error.message}`;
      //             } else if (error.message) {
      //               return error.message;
      //             }
      //             return JSON.stringify(error);
      //           });
      //         const moreErrors =
      //           data.validationErrors.length > 3
      //             ? ` and ${data.validationErrors.length - 3} more validation errors`
      //             : "";
      //         errorMessage = `Import failed - Validation errors: ${validationErrors.join(", ")}${moreErrors}`;
      //       } else if (data.fileErrors && Array.isArray(data.fileErrors)) {
      //         errorMessage = `Import failed - File processing errors: ${data.fileErrors.join(", ")}`;
      //       } else if (data.message) {
      //         errorMessage = `Import failed: ${data.message}`;

      //         if (
      //           data.message.includes("column") ||
      //           data.message.includes("header")
      //         ) {
      //           errorMessage +=
      //             " Please check your file headers and column names.";
      //         } else if (
      //           data.message.includes("format") ||
      //           data.message.includes("invalid")
      //         ) {
      //           errorMessage +=
      //             " Please ensure your file is in the correct format.";
      //         } else if (
      //           data.message.includes("size") ||
      //           data.message.includes("large")
      //         ) {
      //           errorMessage +=
      //             " Please reduce the file size or split into smaller files.";
      //         }
      //       } else if (data.error) {
      //         errorMessage = `Import failed: ${data.error}`;
      //       } else if (data.errors && Array.isArray(data.errors)) {
      //         const errorCount = data.errors.length;
      //         const sampleErrors = data.errors.slice(0, 3).map((error: any) => {
      //           if (typeof error === "string") return error;
      //           if (error.message) return error.message;
      //           if (error.error) return error.error;
      //           return JSON.stringify(error);
      //         });
      //         const moreErrors =
      //           errorCount > 3 ? ` and ${errorCount - 3} more errors` : "";
      //         errorMessage = `Import failed: ${sampleErrors.join(", ")}${moreErrors}`;
      //       } else if (data.details && Array.isArray(data.details)) {
      //         const errorDetails = data.details.slice(0, 3).map((detail: any) => {
      //           if (typeof detail === "string") return detail;
      //           if (detail.row && detail.field && detail.message) {
      //             return `Row ${detail.row}, ${detail.field}: ${detail.message}`;
      //           } else if (detail.row && detail.message) {
      //             return `Row ${detail.row}: ${detail.message}`;
      //           } else if (detail.message) {
      //             return detail.message;
      //           }
      //           return JSON.stringify(detail);
      //         });
      //         const moreErrors =
      //           data.details.length > 3
      //             ? ` and ${data.details.length - 3} more errors`
      //             : "";
      //         errorMessage = `Import failed: ${errorDetails.join(", ")}${moreErrors}`;
      //       } else if (typeof data === "string") {
      //         errorMessage = `Import failed: ${data}`;
      //       } else {
      //         errorMessage = `Import failed: ${JSON.stringify(data)}`;
      //       }
      //     } else {
      //       if (status === 400) {
      //         errorMessage =
      //           "Import failed: Bad request - Please check your file format and data.";
      //       } else if (status === 413) {
      //         errorMessage =
      //           "Import failed: File too large. Please reduce file size and try again.";
      //       } else if (status === 415) {
      //         errorMessage =
      //           "Import failed: Unsupported file type. Please use Excel (.xlsx) or CSV (.csv) format.";
      //       } else if (status === 422) {
      //         errorMessage =
      //           "Import failed: Data validation error. Please check your file content.";
      //       } else if (status >= 500 && status < 5000) {
      //         errorMessage = `Import failed: Server error (${status}). Please try again later.`;
      //       } else {
      //         errorMessage = `Import failed: Please check your file and try again.`;
      //       }
      //     }
      //   } else if (error.request) {
      //     errorMessage =
      //       "Import failed: Network error. Please check your internet connection and try again.";
      //   } else if (error.message) {
      //     if (error.message.includes("timeout")) {
      //       errorMessage =
      //         "Import failed: Request timeout. The file might be too large or server is busy. Please try again.";
      //     } else if (error.message.includes("abort")) {
      //       errorMessage =
      //         "Import failed: Request was cancelled. Please try again.";
      //     } else {
      //       errorMessage = `Import failed: ${error.message}`;
      //     }
      //   }

      //   showAlert(errorMessage);
      // } finally {
      //   setIsImporting(false);

      //   if (fileInputRef.current) {
      //     fileInputRef.current.value = "";
      //   }
      // }
    };

    const exportDefects = async () => {
      if (!selectedProjectId) {
        showAlert("Please select a project before exporting defects.");
        return;
      }

      setIsExporting(true);
      try {
        const response = await apiClient.get(ENDPOINTS.defectBulkExport, {
          params: { projectId: selectedProjectId },
          responseType: "blob",
        });

        const url = window.URL.createObjectURL(response.data);

  const link = document.createElement("a");

  link.href = url;
  link.download = "defects_export.xlsx";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);

} catch (error) {
  console.error("Export error:", error);
}finally {
    setIsExporting(false);
}

    };

    const handleExportExcel = () => {
      exportDefects();
    };

    const releaseMap = React.useMemo(
      () => Object.fromEntries(releases.map((r) => [Number(r.id), r.name])),
      [releases],
    );

    // Add state for users for 'Assigned To' and 'Entered By'
    const [userList, setUserList] = React.useState<
      { id: number; firstName: string; lastName: string }[]
    >([]);

    const uniqueEnteredByNames = React.useMemo(() => {
      const names = new Set<string>();
      backendDefects.forEach((defect) => {
        if (defect.assigned_by_name) {
          names.add(defect.assigned_by_name);
        }
      });
      return Array.from(names).sort();
    }, [backendDefects]);

    // Fallback source for the Assigned To filter: names taken straight from the
    // loaded defects, used when the /defect/developers call yields nothing so
    // the dropdown still offers whatever is actually on screen.
    const uniqueAssignedToNames = React.useMemo(() => {
      const names = new Set<string>();
      backendDefects.forEach((defect) => {
        if (defect.assigned_to_name) {
          names.add(defect.assigned_to_name);
        }
      });
      return Array.from(names).sort();
    }, [backendDefects]);

    React.useEffect(() => {
      setIsUsersLoading(true);

      getAllUsersSimple()
        .then((response: any) => {
          let usersArray = [];

          if (response?.data?.data && Array.isArray(response.data.data)) {
            usersArray = response.data.data;
          } else if (
            response?.data?.content &&
            Array.isArray(response.data.content)
          ) {
            usersArray = response.data.content;
          } else if (response?.data && Array.isArray(response.data)) {
            usersArray = response.data;
          } else if (Array.isArray(response)) {
            usersArray = response;
          } else if (
            response?.data?.data?.content &&
            Array.isArray(response.data.data.content)
          ) {
            usersArray = response.data.data.content;
          }

          if (usersArray.length > 0) {
            const mappedUsers = usersArray
              .map((u: any) => ({
                id: u.id || u.userId || 0,
                firstName: u.firstName || u.name?.split(" ")[0] || "",
                lastName: u.lastName || u.name?.split(" ")[1] || "",
              }))
              .filter((u: any) => u.id);

            setUserList(mappedUsers);
          } else {
            setUserList([]);
          }
          setIsUsersLoading(false);
        })
        .catch((error: any) => {
          console.error("Failed to fetch users:", error);
          setUserList([]);
          setIsUsersLoading(false);
        });
    }, []);

    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [isUsersLoading, setIsUsersLoading] = useState(true);

    React.useEffect(() => {
      if (userList.length > 0 && isUsersLoading) {
        setIsUsersLoading(false);
      }
    }, [userList.length, isUsersLoading]);

    const handleOpenDefectHistory = async (defectId: string) => {
      setIsHistoryModalOpen(true);
      setIsHistoryLoading(true);
      setHistoryError(null);
      try {
        const defect = backendDefects.find((d) => d.defectId === defectId);
        if (!defect) {
          setHistoryError("Defect not found");
          setViewingDefectHistory([]);
          return;
        }

        const data = await getDefectHistoryByDefectId(defect.id);
        setViewingDefectHistory(data);
      } catch (err: any) {
        setViewingDefectHistory([]);
        setHistoryError(err.message || "Failed to fetch defect history");
      } finally {
        setIsHistoryLoading(false);
      }
    };

    const handleOpenCommentsModal = async (defectId: string) => {
      setActiveCommentsDefectId(defectId);
      setIsCommentsModalOpen(true);
      setNewCommentText("");

      const defect = backendDefects.find((d) => d.defectId === defectId);
      if (!defect) {
        showAlert("Defect not found for comments.");
        return;
      }

      setIsCommentsLoading(true);
      try {
        const response = await getCommentsByDefectId(defect.id);
        setCommentsByDefectId((prev) => ({
          ...prev,
          [defectId]: (response.data || []).map((c: any) => ({
            id: c.id || c.commentId,
            defectId: defect.id,
            text: c.comment,
            timestamp: c.createdTime || c.createdAt || new Date().toISOString(),
            userId: c.createdBy,
            createdByName: c.createdByName,
          })),
        }));

        setCommentsCountByDefectId((prev) => ({
          ...prev,
          [defectId]: response.data?.length || 0,
        }));
      } catch (error: any) {
        console.error("Failed to fetch comments:", error);
        showAlert(error.message || "Failed to fetch comments");
        setCommentsByDefectId((prev) => ({ ...prev, [defectId]: [] }));
      } finally {
        setIsCommentsLoading(false);
      }
    };

    const handleAddComment = async () => {
      if (activeCommentsDefectId && newCommentText.trim() && user) {
        const defect = backendDefects.find(
          (d) => d.defectId === activeCommentsDefectId,
        );
        if (!defect) {
          showAlert("Defect not found for comment.");
          return;
        }

        const userName =
          (user as any)?.firstName && (user as any)?.lastName
            ? `${(user as any).firstName} ${(user as any).lastName}`
            : (user as any)?.userName || (user as any)?.name || `User ${(user as any)?.id}`;

        const commentText = newCommentText;
        const userId = (user as any)?.userId || (user as any)?.id;
        const activeId = activeCommentsDefectId;

        setEditingCommentId(null);
        setEditingCommentText("");

        setCommentsByDefectId((prev) => {
          const prevComments = prev[activeId] || [];
          return {
            ...prev,
            [activeId]: [
              ...prevComments,
              {
                text: commentText,
                timestamp: new Date().toISOString(),
                userId: userId,
                createdByName: userName,
              },
            ],
          };
        });

        setCommentsCountByDefectId((prev) => ({
          ...prev,
          [activeId]: (prev[activeId] || 0) + 1,
        }));

        setBackendDefects((prev) =>
          prev.map((d) =>
            d.defectId === activeId
              ? { ...d, commentsCount: (d.commentsCount || 0) + 1 }
              : d,
          ),
        );

        setNewCommentText("");

        setTimeout(() => {
          if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop =
              commentsContainerRef.current.scrollHeight;
          }
        }, 50);

        try {
          await createComment({
            userId: userId,
            defectId: defect.id,
            comment: commentText,
          });

          const response = await getCommentsByDefectId(defect.id);
          const newComments = (response.data || []).map((c: any) => ({
            id: c.id || c.commentId || c._id,
            defectId: defect.id,
            text: c.comment,
            timestamp: c.createdAt || new Date().toISOString(),
            userId: c.createdBy,
            createdByName: c.createdByName || c.userName || `User ${c.createdBy}`,
          }));

          setCommentsByDefectId((prev) => ({
            ...prev,
            [activeId]: newComments,
          }));

          const actualCount = newComments.length;
          setCommentsCountByDefectId((prev) => ({
            ...prev,
            [activeId]: actualCount,
          }));

          setBackendDefects((prev) =>
            prev.map((d) =>
              d.defectId === activeId
                ? { ...d, commentsCount: actualCount }
                : d,
            ),
          );

          setTimeout(() => {
            if (commentsContainerRef.current) {
              commentsContainerRef.current.scrollTop =
                commentsContainerRef.current.scrollHeight;
            }
          }, 100);
        } catch (error: any) {
          console.error("Comment creation error:", error);
          showAlert(error.message || "Failed to add comment");

          setCommentsByDefectId((prev) => {
            const prevComments = prev[activeId] || [];
            return {
              ...prev,
              [activeId]: prevComments.slice(0, -1),
            };
          });

          setCommentsCountByDefectId((prev) => ({
            ...prev,
            [activeId]: Math.max(
              (prev[activeId] || 1) - 1,
              0,
            ),
          }));

          setBackendDefects((prev) =>
            prev.map((d) =>
              d.defectId === activeId
                ? { ...d, commentsCount: Math.max((d.commentsCount || 1) - 1, 0) }
                : d,
            ),
          );
        }
      }
    };

    // Pagination state
    const totalPages = isServerPaginated
      ? totalPagesFromServer
      : (Math.ceil(filteredDefects.length / defectsPerPage) || 1);
    const [pageInput, setPageInput] = useState("1");

    useEffect(() => {
      setPageInput(String(currentPage));
    }, [currentPage]);

    useEffect(() => {
      setCurrentPage(1);
    }, [filters, selectedProjectId, defectsPerPage]);

    useEffect(() => {
      if (selectedProjectId) {
        setFilters({
          id: "",
          module: [],
          subModule: [],
          type: [],
          severity: [],
          name: [],
          status: [],
          releaseId: [],
          assignedTo: [],
          reportedBy: [],
          search: "",
        });
        setShowReassign(false);
      }
    }, [selectedProjectId]);

    const paginatedDefects = isServerPaginated
      ? filteredDefects
      : filteredDefects.slice(
        (currentPage - 1) * defectsPerPage,
        currentPage * defectsPerPage,
      );

    // Fetch developers already allocated to the selected SUBMODULE
    // (Module Management allocation) directly from the submodule
    // endpoint, so only those devs are selectable as Assign To.
    useEffect(() => {
      if (!formData.subModuleId) {
        setAllocatedUsers([]);
        return;
      }
      setIsAllocatedUsersLoading(true);
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
        })
        .catch((error: any) => {
          // 404 just means no developers allocated yet
          if (error?.response?.status !== 404) {
            console.error(
              "Failed to fetch developers allocated to submodule:",
              error,
            );
          }
          setAllocatedUsers([]);
        })
        .finally(() => setIsAllocatedUsersLoading(false));
    }, [formData.subModuleId]);

    useEffect(() => {
      if (!selectedProjectId) {
        setDefectSeveritySummary(null);
        return;
      }

      setLoadingSeveritySummary(true);
      setSeveritySummaryError(null);

      const numericProjectId = Number(selectedProjectId);

      getDefectSeveritySummary(numericProjectId)
        .then((apiData: any) => {
          const dynamicSummary: any = {};

          if (apiData?.data) {
            dynamicSummary.Remark = apiData.data.totalRemark || 0;
            dynamicSummary.TotalDefect = apiData.data.totalDefects || 0;

            const summaryList = apiData.data.severities || [];

            if (Array.isArray(summaryList)) {
              summaryList.forEach((item: any) => {
                const sevKey = String(
                  item.severityName || item.name || "",
                ).toLowerCase();

                const statusCounts: Record<string, number> = {};

                if (item.statusCounts && typeof item.statusCounts === "object") {
                  Object.entries(item.statusCounts).forEach(([status, val]) => {
                    const count =
                      val && typeof (val as any).count === "number"
                        ? (val as any).count
                        : typeof val === "number"
                          ? val
                          : 0;
                    statusCounts[status.toLowerCase()] = count;
                  });
                }

                dynamicSummary[sevKey] = {
                  statusCounts,
                  total: item.totalDefects || 0,
                  totalDefects: item.totalDefects || 0,
                  validDefects: item.totalDefects || 0,
                };
              });
            }
          }

          setDefectSeveritySummary(
            Object.keys(dynamicSummary).length > 0 ? dynamicSummary : null,
          );
        })
        .catch((error: any) => {
          console.error("Severity Summary Error:", error);
          setSeveritySummaryError("Failed to load defect severity summary");
          setDefectSeveritySummary(null);
        })
        .finally(() => {
          setLoadingSeveritySummary(false);
        });
    }, [selectedProjectId, backendDefects]);

    React.useEffect(() => {
      if (!selectedProjectId) {
        return;
      }
      getActiveRelease(selectedProjectId).catch(() => null);
    }, [selectedProjectId]);

    const { user } = useAuth();

    const [commentsCountByDefectId, setCommentsCountByDefectId] = useState<
      Record<string, number>
    >({});

    const totalCount = isServerPaginated ? totalElements : filteredDefects.length;
    const startItem = totalCount === 0 ? 0 : (currentPage - 1) * defectsPerPage + 1;
    const endItem = isServerPaginated
      ? Math.min(currentPage * defectsPerPage, totalElements)
      : Math.min(currentPage * defectsPerPage, filteredDefects.length);

    return (
      <>
        {isImporting && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-[380px] rounded-2xl bg-white p-8 shadow-2xl">
              <div className="flex flex-col items-center">
                <OrbitProgress color="#2563eb" size="medium" text="" textColor="" />
                <h2 className="mt-6 text-2xl font-bold text-gray-800">
                  Importing Defects
                </h2>
                <p className="mt-2 text-center text-gray-500">
                  Please wait while the Excel file is being imported...
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
                <OrbitProgress color="#2563eb" size="medium" text="" textColor="" />
                <h2 className="mt-6 text-2xl font-bold text-gray-800">
                  Exporting Defects
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
        <style>
          {`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        <div className="max-w-6xl mx-auto">
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelect={handleProjectSelect}
          />
          {showReassign ? (
            <div className="mt-4">
              <ReassignDefects
                defects={backendDefects}
                projectId={selectedProjectId || ''}
                onReassign={bulkReassignDefects}
                onClose={() => setShowReassign(false)}
                onSuccess={() => {
                  fetchData();
                  setShowReassign(false);
                }}
              />
            </div>
          ) : (
            <>
              {/* Defect Severity Breakdown */}
              <div className="mb-8 mt-4">
                <div className="flex items-center mb-3 gap-4">
                  <h2 className="text-lg font-semibold text-gray-700">
                    Defect Severity Breakdown
                  </h2>
                  {defectSeveritySummary && (
                    <div className="flex items-center gap-3">
                      <span
                        className="text-base font-bold text-blue-500 border border-blue-400 rounded-lg px-3 py-1 bg-blue-50 shadow-sm"
                        style={{ boxShadow: "0 1px 4px 0 rgba(59,130,246,0.07)" }}
                      >
                        Total Remark : {defectSeveritySummary.Remark || 0}
                      </span>
                      <span
                        className="text-base font-bold text-red-500 border border-red-400 rounded-lg px-3 py-1 bg-red-50 shadow-sm"
                        style={{ boxShadow: "0 1px 4px 0 rgba(239,68,68,0.07)" }}
                      >
                        Total Defect : {defectSeveritySummary.TotalDefect || 0}
                      </span>
                    </div>
                  )}
                </div>
                {(loadingSeveritySummary || isStatusLoading) && (
                  <div className="text-gray-500 p-4">Loading...</div>
                )}
                {(severitySummaryError || statusError) && (
                  <div className="text-red-500 p-4">
                    {severitySummaryError || statusError}
                  </div>
                )}
                {!loadingSeveritySummary &&
                  !isStatusLoading &&
                  !severitySummaryError &&
                  !statusError &&
                  defectSeveritySummary &&
                  defectStatuses.length > 0 && (
                    <div className="relative flex items-center">
                      <button
                        onClick={() => {
                          const container = document.getElementById(
                            "defects-severity-scroll",
                          );
                          if (container) container.scrollLeft -= 300;
                        }}
                        className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 mr-2"
                        type="button"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <div
                        id="defects-severity-scroll"
                        className="flex space-x-6 overflow-x-auto pb-2 scroll-smooth flex-1 scrollbar-hide"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                          maxWidth: "100%",
                        }}
                      >
                        {(() => {
                          const severityKeys = Object.keys(
                            defectSeveritySummary,
                          ).filter((key) => {
                            const v = defectSeveritySummary[key];
                            return v && typeof v === "object" && "statusCounts" in v;
                          });
                          const severityOrder: Record<string, number> = {
                            critical: 3,
                            high: 2,
                            medium: 1,
                            low: 0,
                          };
                          severityKeys.sort(
                            (a, b) =>
                              (severityOrder[b] ?? -1) - (severityOrder[a] ?? -1),
                          );
                          return severityKeys.map((severity) => {
                            const severityLabel = `Defects on ${severity.charAt(0).toUpperCase() + severity.slice(1)}`;
                                                        const severityData = severities.find(
                              (s: any) =>
                                (s?.name || s?.severityName || "").toLowerCase() === severity,
                            );

                            const severityColor = severityData?.color || "#6B7280";
                            const hexColor = severityColor.startsWith("#")
                              ? severityColor
                              : `#${severityColor}`;

                            const statusList = (defectStatuses as any[]).map((s) =>
                              s.statusName.toLowerCase(),
                            );
                            const statusColorMap: Record<string, string> =
                              Object.fromEntries(
                                (defectStatuses as any[]).map((s) => [
                                  s.statusName.toLowerCase(),
                                  s.colorCode,
                                ]),
                              );
                            const summary = defectSeveritySummary[severity] || {
                              statusCounts: {},
                              total: 0,
                            };
                            const statusCounts = statusList.map(
                              (status) => summary.statusCounts?.[status] || 0,
                            );
                            const half = Math.ceil(statusList.length / 2);
                            const leftStatuses = statusList.slice(0, half);
                            const rightStatuses = statusList.slice(half);
                            return (
                              <div
                                key={severity}
                                className={`bg-white rounded-xl shadow flex flex-col justify-between min-h-[200px] min-w-[300px] border border-gray-200 border-l-8`}
                                style={{ borderLeftColor: hexColor }}
                              >
                                <div className="px-6 pt-4 pb-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <span
                                      className="font-semibold text-base"
                                      style={{ color: hexColor }}
                                    >
                                      {severityLabel}
                                    </span>
                                    <span className="font-semibold text-gray-600 text-base"></span>
                                  </div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                                      Total Defect: {summary.validDefects || 0}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-row gap-8 px-6 pb-1">
                                  <div className="flex flex-col gap-1">
                                    {leftStatuses.map((status, idx) => (
                                      <div
                                        key={status}
                                        className="flex items-center gap-2 text-xs"
                                      >
                                        <span
                                          className="inline-block w-2.5 h-2.5 rounded-full"
                                          style={{
                                            backgroundColor: statusColorMap[status],
                                          }}
                                        ></span>
                                        <span className="text-gray-700 font-normal">
                                          {(defectStatuses as any[])[idx].statusName}
                                        </span>
                                        <span className="text-gray-700 font-medium">
                                          {statusCounts[idx]}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    {rightStatuses.map((status, idx) => (
                                      <div
                                        key={status}
                                        className="flex items-center gap-2 text-xs"
                                      >
                                        <span
                                          className="inline-block w-2.5 h-2.5 rounded-full"
                                          style={{
                                            backgroundColor: statusColorMap[status],
                                          }}
                                        ></span>
                                        <span className="text-gray-700 font-normal">
                                          {(defectStatuses as any[])[half + idx]?.statusName}
                                        </span>
                                        <span className="text-gray-700 font-medium">
                                          {statusCounts[half + idx]}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="px-6 pb-3">
                                  <button
                                    className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-md font-medium text-xs border border-blue-100 hover:bg-blue-100 transition"
                                    onClick={() =>
                                      setPieModal({ open: true, severity })
                                    }
                                  >
                                    View Chart
                                  </button>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <button
                        onClick={() => {
                          const container = document.getElementById(
                            "defects-severity-scroll",
                          );
                          if (container) container.scrollLeft += 300;
                        }}
                        className="flex-shrink-0 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 ml-2"
                        type="button"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  )}

                {pieModal.open &&
                  pieModal.severity &&
                  (() => {
                    const severity = pieModal.severity;
                    const statusList = (defectStatuses as any[]).map((s) =>
                      (s.statusName || "").toLowerCase(),
                    );
                    const statusColorMap = Object.fromEntries(
                      (defectStatuses as any[]).map((s) => [
                        (s.statusName || "").toLowerCase(),
                        s.colorCode,
                      ]),
                    );
                    const summary = defectSeveritySummary[severity] || {
                      statusCounts: {},
                      total: 0,
                    };
                    const statusCounts = statusList.map(
                      (status) => summary.statusCounts?.[status] || 0,
                    );
                    const pieData = {
                      labels: statusList.map((s) => s.toUpperCase()),
                      datasets: [
                        {
                          data: statusCounts,
                          backgroundColor: statusList.map(
                            (s) => statusColorMap[s] || "#ccc",
                          ),
                        },
                      ],
                    };
                    return (
                      <Modal
                        isOpen={pieModal.open}
                        onClose={() => setPieModal({ open: false, severity: null })}
                        title={`Status Breakdown for ${severity.charAt(0).toUpperCase() + severity.slice(1)}`}
                      >
                        <div className="flex flex-col items-center justify-center p-4">
                          <div className="w-64 h-64">
                            <ChartJSPie
                              data={pieData}
                              options={{
                                plugins: {
                                  legend: { display: true, position: "bottom" },
                                },
                              }}
                            />
                          </div>
                        </div>
                      </Modal>
                    );
                  })()}
              </div>

              {/* Header Row with Import/Export/Add Defect Buttons */}
              <div className="flex justify-between items-center m-4">
                <h1 className="text-2xl font-bold text-gray-900">Defects</h1>
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setShowReassign(!showReassign)}
                    className={`flex items-center px-3 py-2 rounded shadow transition-colors ${showReassign
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                      }`}
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
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                    {showReassign ? 'Hide Reassign' : 'Reassign Defects'}
                  </button>

                  {can.defect.create && (
                    <button
                      type="button"
                      className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
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
                      Import from Excel
                    </button>
                  )}
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleImportExcel}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow"
                    onClick={handleExportExcel}
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

                  {can.defect.create && (
    <Button
      onClick={() => {
        setFormData((prev) => ({
          ...prev,
          statusId:
            prev.statusId ||
            workflowStartStatusId ||
            defectStatuses[0]?.id?.toString() ||
            "",
        }));
        setIsModalOpen(true);
      }}
      icon={Plus}
      disabled={!isProjectActive}
      title={!isProjectActive ? "Defects can only be added to Active projects" : undefined}
    >
      Add Defect
    </Button>
  )}
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  {(filteredDefects.length > 0 ||
                    backendDefects.length > 0 ||
                    isLoading) && (
                      <div className="p-3 mx-4 mt-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-blue-700">
                            {isLoading ? (
                              <span className="font-medium flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                                Loading Remarks...
                              </span>
                            ) : (
                              <span className="font-medium">
                                {totalCount} remark
                                {totalCount !== 1 ? "s" : ""} found
                              </span>
                            )}
                          </div>
                          {!isLoading && !isServerPaginated &&
                            filteredDefects.length !== backendDefects.length && (
                              <div className="text-xs text-blue-600 font-medium">
                                {backendDefects.length} total defects in project
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                  {!isLoading || backendDefects.length > 0 ? <div className="overflow-x-auto mt-4">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 whitespace-nowrap">
                          <th
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-20 bg-gray-50 border-r border-gray-100"
                            style={{ minWidth: 120, maxWidth: 120 }}
                          >
                            Defect ID
                          </th>
                          <th
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[120px] z-20 bg-gray-50 border-r border-gray-100"
                            style={{ minWidth: 220, maxWidth: 220 }}
                          >
                            Brief Description
                          </th>
                          <th
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[340px] z-20 bg-gray-50 border-r border-gray-100"
                            style={{ minWidth: 100, maxWidth: 100 }}
                          >
                            Steps
                          </th>
                          <th
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[440px] z-20 bg-gray-50 border-r border-gray-100"
                            style={{ minWidth: 120, maxWidth: 120 }}
                          >
                            Attachment
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Module
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submodule
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Severity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            History
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assigned To
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Entered By
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Release
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                        <tr className="bg-gray-50 border-b border-gray-200">

                          <th
                            colSpan={4}
                            className="px-2 py-2 sticky left-0 z-20 bg-gray-50 border-r border-gray-200"
                            style={{ minWidth: 560, maxWidth: 560 }}
                          >
                            <input
                              type="text"
                              placeholder="Search ID / Description..."
                              value={filters.search}
                              onChange={(e) =>
                                setFilters((f) => ({ ...f, search: e.target.value }))
                              }
                              className="w-full px-2 py-3 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
                            />
                          </th>

                          <th className="px-2 py-2" style={{ minWidth: 140 }}>
                            <SearchableMultiSelect
                              options={modules.map((m) => ({
                                value: m.name,
                                label: m.name,
                              }))}
                              selectedValues={filters.module}
                              onChange={(values) =>
                                setFilters((f) => ({ ...f, module: values, subModule: [] }))
                              }
                              placeholder="All"
                              className="text-xs"
                              singleSelect
                            />
                          </th>

                          <th className="px-2 py-2" style={{ minWidth: 140 }}>
                            <SearchableMultiSelect
                              options={filterSubmodules.map((sm) => ({
                                value: sm.name,
                                label: sm.name,
                              }))}
                              selectedValues={filters.subModule}
                              onChange={(values) =>
                                setFilters((f) => ({ ...f, subModule: values }))
                              }
                              placeholder={
                                !filters.module.length
                                  ? "Select module"
                                  : filterSubmodules.length === 0
                                    ? "None"
                                    : "All"
                              }
                              className="text-xs"
                              disabled={!filters.module.length}
                              singleSelect
                            />
                          </th>

                          <th className="px-2 py-2" style={{ minWidth: 120 }}>
                            <SearchableMultiSelect
                              options={defectTypes.map((t) => ({
                                value: t.name,
                                label: t.name,
                              }))}
                              selectedValues={filters.type}
                              onChange={(values) =>
                                setFilters((f) => ({ ...f, type: values }))
                              }
                              placeholder="All"
                              className="text-xs"
                          
                            />
                          </th>

                          <th className="px-2 py-2" style={{ minWidth: 120 }}>
                            <SearchableMultiSelect
                              options={severities.map((s) => ({
                                value: s.name,
                                label: s.name,
                              }))}
                              selectedValues={filters.severity}
                              onChange={(values) =>
                                setFilters((f) => ({ ...f, severity: values }))
                              }
                              placeholder="All"
                              className="text-xs"
                              singleSelect
                            />
                          </th>

                          <th className="px-2 py-2" style={{ minWidth: 120 }}>
                            <SearchableMultiSelect
                              options={priorities.map((p) => ({
                                value: p.name,
                                label: p.name,
                              }))}
                              selectedValues={filters.name}
                              onChange={(values) =>
                                setFilters((f) => ({ ...f, name: values }))
                              }
                              placeholder="All"
                              className="text-xs"
                              singleSelect
                            />
                          </th>

                          <th className="px-2 py-2" style={{ minWidth: 120 }}>
                            <SearchableMultiSelect
                              options={
                                isStatusLoading
                                  ? []
                                  : statusError
                                    ? []
                                    : defectStatuses.map((s) => ({
                                      value: s.statusName,
                                      label: s.statusName,
                                    }))
                              }
                              selectedValues={filters.status}
                              onChange={(values) =>
                                setFilters((f) => ({ ...f, status: values }))
                              }
                              placeholder="All"
                              className="text-xs"
                              disabled={isStatusLoading || !!statusError}
                              singleSelect
                            />
                          </th>

                          <th className="px-2 py-2"></th>

                          <th className="px-2 py-2" style={{ minWidth: 140 }}>
                            <SearchableMultiSelect
                              options={
                                projectDevelopers.length > 0
                                  ? projectDevelopers
                                      .filter(
                                        (dev, index, self) =>
                                          self.findIndex((d) => d.id === dev.id) === index
                                      )
                                      .map((dev) => ({
                                        value: dev.name,
                                        label: dev.role ? `${dev.name} (${dev.role})` : dev.name,
                                      }))
                                  : uniqueAssignedToNames.map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                              }
                              selectedValues={filters.assignedTo}
                              onChange={(values) =>
                                setFilters((f) => ({ ...f, assignedTo: values }))
                              }
                              placeholder={
                                projectDevelopers.length === 0 &&
                                uniqueAssignedToNames.length === 0
                                  ? "None"
                                  : "All"
                              }
                              className="text-xs"
                            />
                          </th>

                          <th className="px-2 py-2" style={{ minWidth: 140 }}>
                            <SearchableMultiSelect
                              options={uniqueEnteredByNames.map((name) => ({
                                value: name,
                                label: name,
                              }))}
                              selectedValues={filters.reportedBy}
                              onChange={(values) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  reportedBy: values,
                                }))
                              }
                              placeholder={
                                uniqueEnteredByNames.length === 0 ? "None" : "All"
                              }
                              className="text-xs"
                              disabled={uniqueEnteredByNames.length === 0}
                            />
                          </th>

                          <th className="px-2 py-2" style={{ minWidth: 140 }}>
                            <SearchableMultiSelect
                              options={releaseOptions}
                              selectedValues={filters.releaseId}
                              onChange={(values) =>
                                setFilters((f) => ({ ...f, releaseId: values }))
                              }
                              placeholder="All"
                              className="text-xs"
                            />
                          </th>

                          <th className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() =>
                                setFilters({
                                  id: "",
                                  module: [],
                                  subModule: [],
                                  type: [],
                                  severity: [],
                                  name: [],
                                  status: [],
                                  releaseId: [],
                                  assignedTo: [],
                                  reportedBy: [],
                                  search: "",
                                })
                              }
                              className="text-ms px-2 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors font-medium w-full text-center"
                            >
                              Clear
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredDefects.length > 0 ? (
                          paginatedDefects.map((defect) => (
                            <tr
                              key={defect.defectId}
                              ref={
                                highlightId === defect.defectId
                                  ? highlightedRowRef
                                  : undefined
                              }
                              className={`border-b border-gray-200 hover:bg-gray-50 ${highlightId === defect.defectId ? "border-2 border-blue-500" : ""}`}
                            >
                              <td
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 sticky left-0 z-10 bg-white border-r border-gray-200"
                                style={{ minWidth: 120 }}
                              >
                                {defect.projectDefectNumber}
                              </td>
                              <td
                                className="px-6 py-4 text-sm text-gray-900 sticky left-[120px] z-10 bg-white border-r border-gray-200"
                                style={{ minWidth: 220, maxWidth: 220 }}
                              >
                                <div
                                  className="break-words overflow-hidden"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical",
                                    lineHeight: "1.4",
                                    maxHeight: "4.2em",
                                  }}
                                  title={defect.description}
                                >
                                  {defect.description}
                                </div>
                              </td>
                              <td
                                className="px-6 py-4 text-sm text-blue-600 cursor-pointer sticky left-[340px] z-10 bg-white border-r border-gray-200"
                                style={{ minWidth: 100, maxWidth: 100 }}
                              >
                                <button
                                  type="button"
                                  className="flex items-center space-x-1 hover:underline"
                                  onClick={() => {
                                    setViewingSteps(defect.steps);
                                    setIsViewStepsModalOpen(true);
                                  }}
                                  title="View Steps"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  <span>View</span>
                                </button>
                              </td>
                              <td
                                className="px-6 py-4 text-sm text-gray-900 sticky left-[440px] z-10 bg-white border-r border-gray-200"
                                style={{ minWidth: 120, maxWidth: 120 }}
                              >
                                {defect.attachment ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleViewAttachment(defect.attachment as string)
                                    }
                                    className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none cursor-pointer"
                                  >
                                    View Attachment
                                  </button>
                                ) : (
                                  <span className="text-gray-400">No attachment</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {defect.module_name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {defect.sub_module_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {defect.defect_type_name || defect.defectTypeName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {renderColoredSpan(
                                  defect.severity_name,
                                  getSeverityColor(defect.severity_name),
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {renderColoredSpan(
                                  defect.priority_name,
                                  getPriorityColor(defect.priority_name),
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap w-32">
                                <div className="flex flex-col items-center gap-1">
                                  {renderColoredSpan(
                                    defect.defect_status_name,
                                    getStatusColor(defect.defect_status_name),
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                <button
                                  type="button"
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                  title="View defect history"
                                  onClick={() =>
                                    handleOpenDefectHistory(defect.defectId)
                                  }
                                  disabled={!can.defect.history}
                                >
                                  <History className="h-5 w-5 inline" />
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {defect.assigned_to_name || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {defect.assigned_by_name || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {(defect as any).release_name?.toString() ||
                                  releaseMap[(defect as any).releaseId || ""] ||
                                  "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className="text-blue-600 hover:text-blue-900 flex items-center"
                                    title="View Defect Details"
                                    onClick={() => {
                                      setViewingDefectDetails({
                                        defectId: defect.defectId,
                                        description: defect.description,
                                        steps: defect.steps,
                                        module: defect.module_name,
                                        submodule: defect.sub_module_name,
                                        type: defect.defect_type_name,
                                        severity: defect.severity_name,
                                        name: defect.priority_name,
                                        status: defect.defect_status_name,
                                        assignedTo: defect.assigned_to_name,
                                        enteredBy: defect.assigned_by_name,
                                        release:
                                          (defect as any).release_name?.toString() ||
                                          releaseMap[
                                          (defect as any).releaseId || ""
                                          ] ||
                                          "-",
                                        attachment: defect.attachment,
                                      });
                                      setIsViewDefectDetailsModalOpen(true);
                                      navigate(
                                        `/projects/${selectedProjectId}/defects?view=${defect.id}`,
                                        { replace: true },
                                      );
                                    }}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="text-green-600 hover:text-green-900 flex items-center"
                                    title="Edit Defect"
                                    onClick={() => handleEdit(defect)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  {can.defect.delete && (
                                    <button
                                      type="button"
                                      className="text-red-600 hover:text-red-900 flex items-center"
                                      title="Delete Defect"
                                      onClick={() => handleDelete(defect.defectId)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  {can.defectComment.view && (
                                    <button
                                      type="button"
                                      className="relative text-blue-600 hover:text-blue-800 flex items-center"
                                      title="Comments"
                                      onClick={() =>
                                        handleOpenCommentsModal(defect.defectId)
                                      }
                                    >
                                      <MessageSquare className="w-5 h-5" />
                                      {(defect.commentsCount ?? 0) > 0 && (
                                        <span className="ml-1 text-xs text-gray-500">
                                          {defect.commentsCount}
                                        </span>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={10}
                              className="p-12 text-center text-gray-500"
                            >
                              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <div className="text-lg font-medium text-gray-900 mb-2">
                                No defects found
                              </div>
                              <div className="text-gray-500 mb-4">
                                No defects have been reported for this project
                              </div>

                              {can.defect.create && (
    <Button
      onClick={() => {
        setFormData((prev) => ({
          ...prev,
          statusId:
            prev.statusId ||
            workflowStartStatusId ||
            defectStatuses[0]?.id?.toString() ||
            "",
        }));
        setIsModalOpen(true);
      }}
      icon={Plus}
      disabled={!isProjectActive}
      title={!isProjectActive ? "Defects can only be added to Active projects" : undefined}
    >
      Add Defect
    </Button>
  )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div> : <div className="flex justify-center items-center py-20">
                    <OrbitProgress
                      variant="dotted"
                      color="#3B82F6"
                      size="medium"
                      text=""
                      textColor=""
                    />
                  </div>}
                  <div
                    className="sticky bottom-0 left-0 w-full bg-white border-t z-10"
                    style={{ boxShadow: "0 -2px 8px rgba(0,0,0,0.04)" }}
                  >
                    <div className="flex items-center justify-between px-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">Rows per page:</span>
                          <select
                            value={defectsPerPage}
                            onChange={(e) => {
                              setDefectsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
                        <span className="text-sm text-gray-500">
                          Showing {startItem}–{endItem} of {totalCount} defects
                        </span>
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                            (pageNum) => {
                              const isCurrent = pageNum === currentPage;
                              const isEdge = pageNum === 1 || pageNum === totalPages;
                              const isNear = Math.abs(pageNum - currentPage) <= 1;
                              if (isEdge || isNear) {
                                return (
                                  <button
                                    key={pageNum}
                                    type="button"
                                    className={`px-2 py-1 rounded text-sm font-medium transition-all duration-150 ${isCurrent ? "bg-blue-600 text-white shadow-sm" : "bg-gray-200 text-gray-700 hover:bg-blue-100"}`}
                                    onClick={() => setCurrentPage(pageNum)}
                                    disabled={isCurrent}
                                    style={{ minWidth: 32 }}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              }
                              if (pageNum === 2 && currentPage > 3) {
                                return (
                                  <span key="start-ellipsis" className="px-2 text-gray-400">
                                    ...
                                  </span>
                                );
                              }
                              if (
                                pageNum === totalPages - 1 &&
                                currentPage < totalPages - 2
                              ) {
                                return (
                                  <span key="end-ellipsis" className="px-2 text-gray-400">
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            },
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Go to</span>
                        <input
                          type="text"
                          value={pageInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            setPageInput(val);
                          }}
                          onBlur={() => {
                            let numVal = Number(pageInput);
                            if (pageInput === "" || isNaN(numVal) || numVal < 1) {
                              numVal = 1;
                            } else if (numVal > totalPages) {
                              numVal = totalPages;
                            }
                            setCurrentPage(numVal);
                            setPageInput(String(numVal));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          placeholder="1"
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-sm text-gray-700">/ {totalPages}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          {/* Modal for Add/Edit Defect */}
          <Modal
            isOpen={isModalOpen}
            // onClose={resetForm}
            onClose={()=>{
              setIsModalOpen(false)


            }}
            title={editingDefect ? "Edit Defect" : "Add New Defect"}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  label="Brief Description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  disabled={!!editingDefect && !canEditDefect}
                  required
                  error={
                    isDescriptionOnlyNumber
                      ? "Brief Description can't be only numbers."
                      : undefined
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Steps
                </label>
                <textarea
                  value={formData.steps}
                  onChange={(e) => handleInputChange("steps", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!!editingDefect && !canEditDefect}
                  rows={3}
                  required
                />
              </div>
              <ImagePicker
                label="Attachment Image"
                value={(formData as any).attachmentFile || null}
                existingAttachment={editingDefect ? formData.attachment : null}
                isEditing={!!editingDefect}
                onChange={(file) => {
                  if (file === null) {
                    setFormData((prev: any) => ({
                      ...prev,
                      attachmentFile: null,
                      attachment: "",
                    }));
                  } else {
                    setFormData((prev: any) => ({
                      ...prev,
                      attachmentFile: file,
                    }));
                  }
                }}
              />

              {!editingDefect && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Case Required
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange("testCaseRequired", "true")
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${formData.testCaseRequired
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange("testCaseRequired", "false")
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${!formData.testCaseRequired
                        ? "bg-red-600 text-white shadow-md"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

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
                    disabled={!!editingDefect && !canEditDefect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select module</option>
                    {modules.map((module) => (
                      <option key={`module-${module.id}`} value={module.id}>
                        {module.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Submodules
                  </label>
                  {submoduleError && (
                    <div className="mb-2 text-red-600 text-sm">
                      {submoduleError}
                    </div>
                  )}
                  <select
                    value={formData.subModuleId}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, subModuleId: e.target.value }))
                    }
                    disabled={
                      (!!editingDefect && !canEditDefect) || !formData.moduleId
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">
                      {submodules.length === 0
                        ? "No submodules"
                        : "Select submodule"}
                    </option>
                    {submodules.map((submodule) => (
                      <option
                        key={`submodule-${submodule.id}`}
                        value={submodule.id}
                      >
                        {submodule.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.typeId}
                    onChange={(e) => handleInputChange("typeId", e.target.value)}
                    disabled={!!editingDefect && !canEditDefect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select type</option>
                    {defectTypes.map((t) => (
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
                    disabled={!!editingDefect && !canEditDefect}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Found in Release <span className="text-gray-400"></span>
                  </label>
                  {editingDefect ? (
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      value={
                        (releasesData as any[]).find(
                          (r) => r.id === String(formData.releaseId),
                        )?.name ||
                        (editingDefect as any).release_name?.toString() ||
                        "-"
                      }
                      readOnly
                      disabled
                    />
                  ) : (
                    <select
                      value={formData.releaseId}
                      onChange={(e) =>
                        handleInputChange("releaseId", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select release</option>

  {(releasesData as any[]).map((release) => (
    <option
      key={release.releaseId}
      value={release.releaseId.toString()}
    >
      {release.releaseName}
    </option>
  ))}
                    </select>
                  )}
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
                    disabled={!!editingDefect && !canEditDefect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select priority</option>
                    {(priorities as any[]).map((p, index) => (
                      <option key={`${p.id}-${index}`} value={(p.id).toString()}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/*
                  FIX: "Assigned To" now shows for BOTH create and edit modes.
                  Previously this field (and Status / Entered By) were all
                  wrapped in a single `{editingDefect && (...)}` block, so
                  nothing here rendered at all when adding a new defect —
                  that's why the "Add Defect" button next to Export to Excel
                  never showed an Assign To dropdown. Status and Entered By
                  genuinely only make sense once a defect exists, so those
                  stay behind the editingDefect check below; Assigned To is
                  now pulled out so it's available on create too.
                */}
       <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <select
                    value={formData.assigntoId}
                    onChange={(e) =>
                      handleInputChange("assigntoId", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={
                      isAllocatedUsersLoading ||
                      !formData.subModuleId ||
                      (!!editingDefect && !can.defect.assignDeveloper)
                    }
                  >
                    <option value="">
                      {isAllocatedUsersLoading
                        ? "Loading users..."
                        : !formData.subModuleId
                          ? "Select a submodule first"
                          : allocatedUsers.length === 0
                            ? "No users available for this module"
                            : editingDefect &&
                              editingDefect.assigned_to_name &&
                              !formData.assigntoId
                              ? editingDefect.assigned_to_name
                              : "Select assignee"}
                    </option>
                    {allocatedUsers.map((user, idx) => (
                      <option
                        key={`${user.userId}-${idx}`}
                        value={user.userId.toString()}
                      >
                        {user.userName}
                      </option>
                    ))}
                  </select>
                </div>

                {editingDefect && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                        {isNextStatusLoading && (
                          <span className="text-sm text-gray-500 font-normal">
                            {" "}
                            (Loading...)
                          </span>
                        )}
                      </label>
                      <select
                        value={selectedNextStatusId || formData.statusId}
                        onChange={(e) =>
                          handleInputChange("statusId", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={
                          isNextStatusLoading ||
                          (!!editingDefect && !canChangeStatus)
                        }
                      >
                        {(() => {
                          const currentStatus = (defectStatuses as any[]).find(
                            (s: any) => String(s.id) === String(originalStatusId),
                          );
                          const currentStatusName =
                            editingDefect?.defect_status_name ||
                            currentStatus?.statusName ||
                            "Current Status";
                          return (
                            <option value={originalStatusId}>
                              {currentStatusName}
                            </option>
                          );
                        })()}
                        {nextStatuses
                          .filter(
                            (s: any) => String(s.id) !== String(originalStatusId),
                          )
                          .map((s: any, index) => (
                            <option key={`next-${s.id}-${index}`} value={s.id}>
                              {s.statusName}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entered By
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                        value={editingDefect?.assigned_by_name || "-"}
                        readOnly
                        disabled
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isDescriptionOnlyNumber}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingDefect
                      ? "Save Changes"
                      : "Submit"}
                </Button>
              </div>
            </form>
          </Modal>

          <Modal
            isOpen={isViewStepsModalOpen}
            onClose={() => setIsViewStepsModalOpen(false)}
            title="Steps"
            size="md"
          >
            <div className="overflow-x-auto">
              {viewingSteps ? (
                <div className="whitespace-pre-line text-gray-700 p-4 bg-gray-50 rounded-lg">
                  {viewingSteps}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  No steps provided
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsViewStepsModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </Modal>

          <Modal
            isOpen={isViewDefectDetailsModalOpen}
            onClose={() => {
              setIsViewDefectDetailsModalOpen(false);
              navigate(`/projects/${selectedProjectId}/defects`, {
                replace: true,
              });
            }}
            title="Defect Details"
            size="lg"
          >
            <div className="overflow-x-auto">
              {viewingDefectDetails && (
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-1/3">
                        Defect ID
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {viewingDefectDetails.defectId}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Description
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {viewingDefectDetails.description}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Steps
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-pre-line">
                        {viewingDefectDetails.steps || "No steps provided"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Module
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {viewingDefectDetails.module}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Submodule
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {viewingDefectDetails.submodule}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Type
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {viewingDefectDetails.type}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Severity
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderColoredSpan(
                          viewingDefectDetails.severity,
                          getSeverityColor(viewingDefectDetails.severity),
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Priority
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderColoredSpan(
                          viewingDefectDetails.name,
                          getPriorityColor(viewingDefectDetails.name),
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Status
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderColoredSpan(
                          viewingDefectDetails.status,
                          getStatusColor(viewingDefectDetails.status|| viewingDefectDetails.status),
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Assigned To
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {viewingDefectDetails.assignedTo || "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Entered By
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {viewingDefectDetails.enteredBy || "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Release
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {viewingDefectDetails.release}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Attachment
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {viewingDefectDetails.attachment ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleViewAttachment(
                                viewingDefectDetails.attachment,
                              )
                            }
                            className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none cursor-pointer"
                          >
                            View Attachment
                          </button>
                        ) : (
                          <span className="text-gray-400">No attachment</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsViewDefectDetailsModalOpen(false);
                  navigate(`/projects/${selectedProjectId}/defects`, {
                    replace: true,
                  });
                }}
              >
                Close
              </Button>
            </div>
          </Modal>

          <Modal
            isOpen={isRejectionCommentModalOpen}
            onClose={() => {
              setIsRejectionCommentModalOpen(false);
              setIsEditingRejectionComment(false);
            }}
            title="Rejection Comment"
            size="md"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Comment
              </label>
              {!isEditingRejectionComment ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-800 text-base whitespace-pre-line flex-1">
                    {statusEditComment || (
                      <span className="italic text-gray-400">No comment</span>
                    )}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsEditingRejectionComment(true)}
                  >
                    Edit
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!editingStatusId)
                      return setIsRejectionCommentModalOpen(false);
                    const defect = backendDefects.find(
                      (d) => d.defectId === editingStatusId,
                    ) as FilteredDefect;
                    if (!defect) return setIsRejectionCommentModalOpen(false);
                    setIsEditingRejectionComment(false);
                    setIsRejectionCommentModalOpen(false);
                  }}
                >
                  <Input
                    value={statusEditComment}
                    onChange={(e) => setStatusEditComment(e.target.value)}
                    placeholder="Enter reason for rejection"
                    required
                  />
                  <div className="flex justify-end pt-4 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsEditingRejectionComment(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Save
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Modal>

          <Modal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            title="Defect History"
            size="xl"
          >
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
              {isHistoryLoading ? (
                <div className="text-gray-500">Loading history...</div>
              ) : historyError ? (
                <div className="text-red-500">{historyError}</div>
              ) : !Array.isArray(viewingDefectHistory) ||
                viewingDefectHistory.length === 0 ? (
                <div className="text-gray-500">No history available.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Assigned By
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Assigned To
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Time
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Previous Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Current Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Release
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        EditBy
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(viewingDefectHistory) &&
                      viewingDefectHistory.map((entry, idx) => (
                        <tr
                          key={`history-${entry.defectDate}-${entry.defectTime}-${idx}`}
                        >
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {entry.assignedByName}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {entry.assignedToName}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {entry.defectDate}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {entry.defectTime ? formatTimeWithoutMs(entry.defectTime) : entry.defectTime}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {entry.previousStatus}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {entry.defectStatus}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            
                            {entry.releaseName}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {entry.updatedBy}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </Modal>

          <Modal
            isOpen={isCommentsModalOpen}
            onClose={() => setIsCommentsModalOpen(false)}
            title="Comments"
            size="lg"
          >
            <div className="flex flex-col h-[500px]">
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3"
                ref={commentsContainerRef}
              >
                {isCommentsLoading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading comments...</div>
                  </div>
                ) : activeCommentsDefectId &&
                  commentsByDefectId[activeCommentsDefectId]?.length > 0 ? (
                  <div className="space-y-3">
                    {[...commentsByDefectId[activeCommentsDefectId]]
                      .sort(
                        (a, b) =>
                          new Date(a.timestamp).getTime() -
                          new Date(b.timestamp).getTime(),
                      )
                      .map((comment, idx) => {
                        const isCurrentUser =
                          String(comment.userId) === String((user as any)?.userId) ||
                          String(comment.userId) === String((user as any)?.id);

                        const commentId = `${comment.timestamp}-${idx}`;
                        const isEditing = editingCommentId === commentId;

                        const handleDoubleClick = () => {
                          if (isCurrentUser && !isEditing) {
                            setEditingCommentId(commentId);
                            setEditingCommentText(comment.text);
                          }
                        };

                        return (
                          <div
                            key={`comment-${activeCommentsDefectId}-${comment.timestamp}-${idx}`}
                            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} w-full`}
                          >
                            <div
                              className={`max-w-[85%] px-4 py-2.5 ${isCurrentUser
                                ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md"
                                : "bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm shadow-sm"
                                } ${isCurrentUser && !isEditing
                                  ? "cursor-pointer hover:opacity-90 transition-opacity"
                                  : ""
                                } ${isEditing ? "ring-2 ring-blue-400 ring-offset-2" : ""}`}
                              onDoubleClick={handleDoubleClick}
                            >
                              <div
                                className={`text-xs font-semibold mb-1 flex items-center justify-between ${isCurrentUser
                                  ? "text-blue-200"
                                  : "text-blue-600"
                                  }`}
                              >
                                <span>
                                  {comment.createdByName ||
                                    `User ${comment.userId}`}
                                </span>
                                {isCurrentUser && !isEditing && (
                                  <span className="text-[10px] opacity-70">
                                    ✏️ Double tap
                                  </span>
                                )}
                              </div>

                              {isEditing ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingCommentText}
                                    onChange={(e) =>
                                      setEditingCommentText(e.target.value)
                                    }
                                    className={`w-full px-3 py-2 rounded-lg text-sm resize-none min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${isCurrentUser
                                      ? "bg-blue-500 text-white placeholder-blue-300"
                                      : "bg-white text-gray-800 border border-gray-300"
                                      }`}
                                    rows={3}
                                    autoFocus
                                    placeholder="Edit your comment..."
                                    onKeyDown={(e) => {
                                      if (e.key === "Escape") {
                                        setEditingCommentId(null);
                                        setEditingCommentText("");
                                      }
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        saveEditedComment(comment, commentId);
                                      }
                                    }}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditingCommentText("");
                                      }}
                                      className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        saveEditedComment(comment, commentId)
                                      }
                                      className="text-xs px-3 py-1.5 bg-white text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors shadow-sm"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${isCurrentUser ? "text-white" : "text-gray-700"
                                    }`}
                                >
                                  {comment.text}
                                </div>
                              )}

                              <div
                                className={`mt-1 text-[10px] ${isCurrentUser
                                  ? "text-blue-200"
                                  : "text-gray-400"
                                  }`}
                              >
                                {new Date(comment.timestamp).toLocaleString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                                {isEditing && (
                                  <span className="ml-2 text-blue-300">
                                    ✏️ Editing...
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500">No comments yet.</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Be the first to add a comment!
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add a comment
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <textarea
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[60px]"
                    rows={2}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder="Write a comment... (Press Enter to send)"
                  />
                  <div className="flex gap-2 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setIsCommentsModalOpen(false);
                        setEditingCommentId(null);
                        setEditingCommentText("");
                      }}
                      className="whitespace-nowrap"
                    >
                      Close
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAddComment}
                      disabled={!newCommentText.trim()}
                      className="whitespace-nowrap"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Modal>

          <AlertModal
            isOpen={alert.open}
            message={alert.message}
            onClose={closeAlert}
          />
          <ConfirmModal
            isOpen={deleteConfirm.open}
            message={"Are you sure you want to delete this defect?"}
            onCancel={closeDeleteConfirm}
            onConfirm={confirmDelete}
          />

          <Modal
            isOpen={isImageViewerModalOpen}
            onClose={closeImageViewer}
            title="View Attachment"
            size="xl"
          >
            <div className="flex justify-center">
              {viewingImageUrl && (
                <img
                  src={viewingImageUrl}
                  alt="Attachment"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const errorDiv = document.createElement("div");
                    errorDiv.className = "text-red-600 text-center p-4";
                    errorDiv.textContent =
                      "Failed to load image. The file may not be a valid image or may have been moved.";
                    target.parentNode?.appendChild(errorDiv);
                  }}
                />
              )}
            </div>
            <div className="flex justify-end pt-4 gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (viewingImageUrl) {
                    window.open(viewingImageUrl, "_blank");
                  }
                }}
              >
                Open in New Tab
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={closeImageViewer}
              >
                Close
              </Button>
            </div>
          </Modal>
        </div>
      </>
    );
  };
