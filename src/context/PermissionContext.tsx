import ENDPOINTS from "../utils/endpoints";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import apiClient from "../lib/api";

interface ProjectInfo {
  projectId: number;
  projectName: string;
  role: string;
}

interface PermissionContextType {
  can: any;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permList: string[]) => boolean;
  allPermissions: string[];
  isLoading: boolean;
  permissionsReady: boolean;
  projects: ProjectInfo[];
  selectedProjectId: number | null;
  switchProject: (projectId: number | null) => Promise<void>;
  refreshPermissions: () => Promise<void>;
  isAdmin: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined,
);

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context)
    throw new Error("usePermission must be used within PermissionProvider");
  return context;
};

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionsReady, setPermissionsReady] = useState(false);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    () => {
      const saved = localStorage.getItem("selectedProjectId");
      return saved ? parseInt(saved) : null;
    },
  );

  const fetchProjects = async () => {
    if (!user) return [];

    try {
      const response = await apiClient.get(ENDPOINTS.currentUserProjects);
      const projectList = response.data?.data || [];
      setProjects(projectList);
      return projectList;
    } catch (error) {
      setProjects([]);
      return [];
    }
  };

  // const fetchPermissions = useCallback(
  //   async (projectId: number | null) => {
  //     if (!user) return [];

  //     try {
  //       const url = projectId
  //         ? ENDPOINTS.currentUserProjectPermissions(projectId)
  //         : ENDPOINTS.currentUserPermissions;

  //       const response = await apiClient.get(url);
  //       const data = response.data?.data || {};

  //       let perms: string[] = ["ALL_PERMISSIONS"];
  //       setIsAdmin(true);
  //       setPermissions(perms);
  //       return perms;
  //     } catch (error) {
  //       setPermissions(["ALL_PERMISSIONS"]);
  //       setIsAdmin(true);
  //       return ["ALL_PERMISSIONS"];
  //     }
  //   },
  //   [user],
  // );
const fetchPermissions = useCallback(
  async (projectId: number | null) => {
    if (!user) {
      setPermissions([]);
      setIsAdmin(false);
      return [];
    }

    setIsLoading(true);

    try {
      const url = projectId
        ? ENDPOINTS.currentUserProjectPermissions(projectId)
        : ENDPOINTS.currentUserPermissions;

      const response = await apiClient.get(url);

      const data = response.data?.data || {};

      const admin = Boolean(data.admin);

      const perms: string[] = Array.isArray(data.permissions)
        ? data.permissions
        : [];

      setIsAdmin(admin);

      if (admin) {
        setPermissions([]);
        return ["ALL_PERMISSIONS"];
      }

      setPermissions(perms);

      return perms;
    } catch (error) {
      console.error("Failed to fetch permissions:", error);

      // IMPORTANT:
      // Never give ALL_PERMISSIONS when API fails.
      setPermissions([]);
      setIsAdmin(false);

      return [];
    } finally {
      setIsLoading(false);
    }
  },
  [user],
);
  const switchProject = useCallback(
    async (projectId: number | null) => {
      if (selectedProjectId === projectId) return;

      setPermissionsReady(false);

      if (projectId) {
        localStorage.setItem("selectedProjectId", String(projectId));
      } else {
        localStorage.removeItem("selectedProjectId");
      }

      setSelectedProjectId(projectId);

      await fetchPermissions(projectId);
      setPermissionsReady(true);
    },
    [fetchPermissions, selectedProjectId],
  );

  const refreshPermissions = async () => {
    await fetchPermissions(selectedProjectId);
  };

 useEffect(() => {
  const init = async () => {
    setPermissionsReady(false);

    try {
      if (!user) {
        setPermissions([]);
        setProjects([]);
        setIsAdmin(false);
        return;
      }

      const projectList = await fetchProjects();

      const savedProjectId = localStorage.getItem("selectedProjectId");

      let targetProjectId: number | null = savedProjectId
        ? parseInt(savedProjectId)
        : null;

      if (targetProjectId) {
        const stillExists = projectList.some(
          (p: ProjectInfo) => p.projectId === targetProjectId,
        );

        if (stillExists) {
          await fetchPermissions(targetProjectId);
          setSelectedProjectId(targetProjectId);
        } else {
          await fetchPermissions(null);
          setSelectedProjectId(null);
          localStorage.removeItem("selectedProjectId");
        }
      } else {
        await fetchPermissions(null);
        setSelectedProjectId(null);
      }
    } finally {
      setPermissionsReady(true);
    }
  };

  init();
}, [user, fetchPermissions]);
const hasPermission = (permission: string): boolean => {
  return isAdmin || permissions.includes(permission);
};

const hasAnyPermission = (permList: string[]): boolean => {
  return isAdmin || permList.some((permission) =>
    permissions.includes(permission)
  );
};

  const can = {
    designation: {
      create: hasPermission("DESIGNATION_CREATE"),
      edit: hasPermission("DESIGNATION_UPDATE"),
      view: hasPermission("DESIGNATION_READ"),
      delete: hasPermission("DESIGNATION_DELETE"),
    },
    role: {
      create: hasPermission("ROLE_CREATE"),
      edit: hasPermission("ROLE_UPDATE"),
      view: hasPermission("ROLE_READ"),
      delete: hasPermission("ROLE_DELETE"),
    },
    permission: { view: hasPermission("PERMISSION_READ") },
    rolePermission: {
      assign: hasPermission("ROLE_PERMISSION_ASSIGN"),
      view: hasPermission("ROLE_PERMISSION_READ"),
    },
    employeePermission: {
      assign: hasPermission("EMPLOYEE_PERMISSION_ASSIGN"),
      view: hasPermission("EMPLOYEE_PERMISSION_READ"),
    },
    defectType: {
      create: hasPermission("DEFECT_TYPE_CREATE"),
      edit: hasPermission("DEFECT_TYPE_UPDATE"),
      view: hasPermission("DEFECT_TYPE_READ"),
      delete: hasPermission("DEFECT_TYPE_DELETE"),
    },
    releaseType: {
      create: hasPermission("RELEASE_TYPE_CREATE"),
      edit: hasPermission("RELEASE_TYPE_UPDATE"),
      view: hasPermission("RELEASE_TYPE_READ"),
      delete: hasPermission("RELEASE_TYPE_DELETE"),
    },
    severity: {
      create: hasPermission("SEVERITY_CREATE"),
      edit: hasPermission("SEVERITY_UPDATE"),
      view: hasPermission("SEVERITY_READ"),
      delete: hasPermission("SEVERITY_DELETE"),
    },
    priority: {
      create: hasPermission("PRIORITY_CREATE"),
      edit: hasPermission("PRIORITY_UPDATE"),
      view: hasPermission("PRIORITY_READ"),
      delete: hasPermission("PRIORITY_DELETE"),
    },
    statusType: {
      create: hasPermission("STATUS_CREATE"),
      edit: hasPermission("STATUS_UPDATE"),
      view: hasPermission("STATUS_READ"),
      delete: hasPermission("STATUS_DELETE"),
    },
    moduleallocation:{
      assign: hasPermission("MODULE_ALLOCATION_ASSIGN"),
      // view: hasPermission("MODULE_ALLOCATION_READ"),
      deallocate: hasPermission("MODULE_ALLOCATION_DEALLOCATE"),
    },
    submoduleallocation:{
      assign: hasPermission("SUB_MODULE_ALLOCATION_ASSIGN"),
      // view: hasPermission("SUB_MODULE_ALLOCATION_READ"),
      deallocate: hasPermission("SUB_MODULE_ALLOCATION_DEALLOCATE"),
    },
    workflow: {
      create: hasPermission("WORKFLOW_CREATE"),
      view: hasPermission("WORKFLOW_READ"),
    },
    emailConfig: {
      create: hasPermission("EMAIL_CONFIG_CREATE"),
      edit: hasPermission("EMAIL_CONFIG_UPDATE"),
      view: hasPermission("EMAIL_CONFIG_READ"),
      delete: hasPermission("EMAIL_CONFIG_DELETE"),
      statusUpdate: hasPermission("EMAIL_CONFIG_CHANGE"),
    },
    pointSetup: {
      view: hasPermission("POINT_SETUP_READ"),
      statusUpdate: hasPermission("POINT_SETUP_UPDATE"),
    },
    roleEmailRecipient: {
      assign: hasPermission("ROLE_EMAIL_RECIPIENT_ASSIGN"),
      view: hasPermission("ROLE_EMAIL_RECIPIENT_READ"),
    },
    employeeEmailRecipient: {
      assign: hasPermission("EMPLOYEE_EMAIL_RECIPIENT_ASSIGN"),
      view: hasPermission("EMPLOYEE_EMAIL_RECIPIENT_READ"),
    },
    emailTemplate: {
      edit: hasPermission("EMAIL_TEMPLATE_UPDATE"),
      view: hasPermission("EMAIL_TEMPLATE_READ"),
    },
    employee: {
      create: hasPermission("EMPLOYEE_CREATE"),
      edit: hasPermission("EMPLOYEE_UPDATE"),
      view: hasPermission("EMPLOYEE_READ"),
      delete: hasPermission("EMPLOYEE_DELETE"),
      statusUpdate: hasPermission("EMPLOYEE_STATUS_UPDATE"),
    },
    bench: { view: hasPermission("BENCH_READ") },
    project: {
      create: hasPermission("PROJECT_CREATE"),
      edit: hasPermission("PROJECT_UPDATE"),
      view: hasPermission("PROJECT_READ"),
      delete: hasPermission("PROJECT_DELETE"),
    },
    module: {
      create: hasPermission("MODULE_CREATE"),
      edit: hasPermission("MODULE_UPDATE"),
      view: hasPermission("MODULE_READ"),
      delete: hasPermission("MODULE_DELETE"),
    },
    subModule: {
      create: hasPermission("SUB_MODULE_CREATE"),
      edit: hasPermission("SUB_MODULE_UPDATE"),
      view: hasPermission("SUB_MODULE_READ"),
      delete: hasPermission("SUB_MODULE_DELETE"),
    },
    projectAllocation: {
      assign: hasPermission("PROJECT_ALLOCATION_ASSIGN"),
      view: hasPermission("PROJECT_ALLOCATION_READ"),
      extend: hasPermission("PROJECT_ALLOCATION_EXTEND"),
      deallocate: hasPermission("PROJECT_ALLOCATION_DEALLOCATE"),
    },
    testCase: {
      create: hasPermission("TEST_CASE_CREATE"),
      edit: hasPermission("TEST_CASE_UPDATE"),
      view: hasPermission("TEST_CASE_READ"),
      delete: hasPermission("TEST_CASE_DELETE"),
    },
    release: {
      create: hasPermission("RELEASE_CREATE"),
      edit: hasPermission("RELEASE_UPDATE"),
      view: hasPermission("RELEASE_READ"),
      delete: hasPermission("RELEASE_DELETE"),
      statusUpdate: hasPermission("RELEASE_STATUS_CHANGE"),
    },
    defect: {
      create: hasPermission("DEFECT_CREATE"),
      edit: hasPermission("DEFECT_UPDATE"),
      view: hasPermission("DEFECT_READ"),
      delete: hasPermission("DEFECT_DELETE"),
      assignDeveloper: hasPermission("DEFECT_ASSIGN_DEVELOPER"),
      statusUpdate: hasPermission("DEFECT_STATUS_CHANGE"),
      history: hasPermission("DEFECT_READ_STATUS_HISTORY"),
    },
    defectComment: {
      create: hasPermission("DEFECT_COMMENT_CREATE"),
      view: hasPermission("DEFECT_COMMENT_READ"),
    },
    testcaseallocation:{
      access: hasPermission("TEST_CASE_ALLOCATION_ACCESS"),
    }
  };

  return (
    <PermissionContext.Provider
      value={{
        can,
        hasPermission,
        hasAnyPermission,
        allPermissions: permissions,
        isLoading,
        permissionsReady,
        projects,
        selectedProjectId,
        switchProject,
        refreshPermissions,
        isAdmin,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};
