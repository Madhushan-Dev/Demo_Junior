import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Button } from "../components/ui/Button";

import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Toast } from "../components/ui/Toast";
import {
  Save,
  Shield,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  ChevronLeft,
  Lock,
  Key,
  FileText,
  User,
  Search,
  Filter,
  X,
} from "lucide-react";


import { getAllUsersSimple, SimpleUser } from "../api/users/getallusers";
import { getAllRoles } from "../api/role/viewrole";
import { getDesignations, Designations } from "../api/designation/designation";
import { Input } from "../components/ui/Input";
import "../index.css";
import {
  addEmployeePermission,
  addRolePermission,
  getAllEmployeePermission,
  getAllPrivileges,
  getRolePermission,
  getRolePermissionByRoleId,
} from "../api/Privileges";
import { usePermission } from "../context/PermissionContext";

interface PrivilegeGroup {
  module: string;
  privileges: {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
  }[];
}

interface RolePrivilege {
  roleId: string;
  roleName: string;
  originalPrivileges: string[];
  privileges: string[];
}

interface UserPrivilege {
  userId: string;
  userName: string;
  userEmail?: string;
  designationName?: string;
  originalPrivileges: string[];
  privileges: string[];
  inheritedPrivileges: string[];
  roleDerivedPrivileges: string[];
}

interface Role {
  id: string;
  name?: string;
  roleName?: string;
  description?: string;
}

interface ApiRole {
   id?: number | string;
  roleId?: number | string;
  name?: string;
  roleName?: string;
  description?: string;
}

type PermissionId = number | string;

interface PermissionModuleAssignment {
  module: string;
  permissions: {
    permissionId: PermissionId;
    action: string;
    description: string | null;
    checked?: boolean;
    inheritedFromRole?: boolean;
  }[];
}

interface EmployeePermissionResponse {
  status: string;
  statusCode: number;
  statusMessage: string;
  data: PermissionModuleAssignment[];
}

interface RolePermissionResponse {
  permissionIds: PermissionId[];
}

interface PermissionAssignmentChange {
  permissionId: string;
  isAssigned: boolean;
}

interface EmployeePermissionUpdatePayload {
  permissionIds: number[];
}

type RolePermissionUpdatePayload = PermissionAssignmentChange[];

const isReadPermission = (privilegeName: string): boolean => {
  return privilegeName.toUpperCase() === "READ";
};

const getModulePermissions = (
  module: string,
  privilegeGroups: PrivilegeGroup[],
): string[] => {
  const group = privilegeGroups.find((g) => g.module === module);
  return group ? group.privileges.map((p) => p.id) : [];
};

const getReadPermissionIdForModule = (
  module: string,
  privilegeGroups: PrivilegeGroup[],
): string | null => {
  const group = privilegeGroups.find((g) => g.module === module);
  const readPermission = group?.privileges.find((p) =>
    isReadPermission(p.name),
  );
  return readPermission?.id || null;
};

const toIdString = (value: PermissionId) => String(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getResponseList = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) return response as T[];
  if (!isRecord(response)) return [];

  if (Array.isArray(response.data)) return response.data as T[];
  if (isRecord(response.data) && Array.isArray(response.data.content)) {
    return response.data.content as T[];
  }
  if (Array.isArray(response.content)) return response.content as T[];

  return [];
};

const normalizePermissionIds = (permissionIds: PermissionId[] = []) =>
  permissionIds.map(toIdString);

const getCheckedPermissionIds = (modules: PermissionModuleAssignment[] = []) =>
  modules.flatMap((module) =>
    module.permissions
      .filter((permission) => permission.checked)
      .map((permission) => toIdString(permission.permissionId)),
  );

const getInheritedPermissionIds = (
  modules: PermissionModuleAssignment[] = [],
) =>
  modules.flatMap((module) =>
    module.permissions
      .filter(
        (permission) => permission.checked && permission.inheritedFromRole,
      )
      .map((permission) => toIdString(permission.permissionId)),
  );

const buildPrivilegeGroupsFromPermissionModules = (
  modules: PermissionModuleAssignment[],
): PrivilegeGroup[] =>
  modules.map((moduleItem) => ({
    module: moduleItem.module,
    privileges: moduleItem.permissions.map((permission) => ({
      id: toIdString(permission.permissionId),
      name: permission.action,
      description: permission.description || "",
      permissions: [permission.action.split(" ")[0].toLowerCase()],
    })),
  }));

const getUserEntityId = (user: SimpleUser) =>
  user.empId?.toString() ??"";
const getUserDisplayName = (user: SimpleUser) =>
  `${user.firstName} ${user.lastName}`;
const getUserDropdownLabel = (user: SimpleUser) =>
  user.designationName
    ? `${getUserDisplayName(user)} - ${user.designationName}`
    : getUserDisplayName(user);
const getRoleDisplayName = (role: Role) =>
  role.name || role.roleName || "Unknown Role";

const buildUserPrivilege = (
  user: SimpleUser,
  modules: EmployeePermissionResponse["data"] = [],
): UserPrivilege => {
  const userId = getUserEntityId(user);
  const assignedPermissionIds = getCheckedPermissionIds(modules);
  const inheritedPermissionIds = getInheritedPermissionIds(modules);

  return {
    userId,
    userName: getUserDisplayName(user),
    userEmail: (user as SimpleUser & { email?: string }).email || "",
    designationName: user.designationName,
    originalPrivileges: [...assignedPermissionIds],
    privileges: [...assignedPermissionIds],
    inheritedPrivileges: [...inheritedPermissionIds],
    roleDerivedPrivileges: [],
  };
};

const buildRolePrivilege = (
  role: Role,
  rolePermissionAssignment?: RolePermissionResponse,
): RolePrivilege => {
  const roleId = role.id;
  const assignedPermissionIds = normalizePermissionIds(
    rolePermissionAssignment?.permissionIds,
  );

  return {
    roleId,
    roleName: getRoleDisplayName(role),
    originalPrivileges: [...assignedPermissionIds],
    privileges: [...assignedPermissionIds],
  };
};

const buildPermissionChanges = (
  originalPermissionIds: string[],
  currentPermissionIds: string[],
): PermissionAssignmentChange[] => {
  const originalSet = new Set(originalPermissionIds);
  const currentSet = new Set(currentPermissionIds);
  const addedPermissions = currentPermissionIds
    .filter((permissionId) => !originalSet.has(permissionId))
    .map((permissionId) => ({ permissionId, isAssigned: true }));
  const removedPermissions = originalPermissionIds
    .filter((permissionId) => !currentSet.has(permissionId))
    .map((permissionId) => ({ permissionId, isAssigned: false }));

  return [...addedPermissions, ...removedPermissions];
};

const buildEmployeePermissionUpdatePayload = (
  privilege: UserPrivilege | null,
): EmployeePermissionUpdatePayload | null => {
  if (!privilege) return null;

  return {
    permissionIds: privilege.privileges
      .filter(
        (permissionId) => !privilege.inheritedPrivileges.includes(permissionId),
      )
      .map(Number)
      .filter((permissionId) => !Number.isNaN(permissionId)),
  };
};

const buildRolePermissionUpdatePayload = (
  privilege: RolePrivilege | null,
): RolePermissionUpdatePayload | null => {
  if (!privilege) return null;

  return buildPermissionChanges(
    privilege.originalPrivileges,
    privilege.privileges,
  );
};



const Privileges: React.FC = () => {
  const navigate = useNavigate();
  const [privilegeGroups, setPrivilegeGroups] = useState<PrivilegeGroup[]>([]);
  const [rolePrivileges, setRolePrivileges] = useState<RolePrivilege | null>(
    null,
  );
  const [userPrivileges, setUserPrivileges] = useState<UserPrivilege | null>(
    null,
  );
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [isUserMode, setIsUserMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({ isOpen: false, message: "", type: "success" });

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ isOpen: true, message, type });
    },
    [],
  );

 const { can } = usePermission(); 
 const canAssignPermissions = isUserMode
  ? can.employeePermission.assign
  : can.rolePermission.assign;
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>(
    [],
  );
  const [availableDesignations, setAvailableDesignations] = useState<string[]>(
    [],
  );
  const [isDesignationDropdownOpen, setIsDesignationDropdownOpen] =
    useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSourceRoleDropdownOpen, setIsSourceRoleDropdownOpen] =
    useState(false);
  const [selectedSourceRoleIds, setSelectedSourceRoleIds] = useState<string[]>(
    [],
  );
  const [applyingRolePermissions, setApplyingRolePermissions] = useState(false);
  const [loadingEmployeePermissions, setLoadingEmployeePermissions] =
    useState(false);
  const latestEmployeePermissionRequestRef = useRef<string | null>(null);
  const latestSourceRolePermissionRequestRef = useRef(0);

  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const latestRolePermissionRequestRef = useRef<string | null>(null);
  const [moduleSearchTerm, setModuleSearchTerm] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllUsersSimple(0, 1000);
      setUsers(getResponseList<SimpleUser>(response));
    } catch (error) {
showToast("Failed to load employees", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadDesignations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDesignations(0, 100);
      const designations = getResponseList<Designations>(response)
        .map((designation) => designation.designationName)
        .filter(
          (designation): designation is string =>
            typeof designation === "string" && designation.trim() !== "",
        )
        .sort();

      setAvailableDesignations([...new Set(designations)]);
    } catch (error) {
showToast("Failed to load designations", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllRoles();

      const rolesData = getResponseList<ApiRole>(response);

      const filteredRoles = rolesData.filter((role) => role.id !== 1);

      const mappedRoles: Role[] = filteredRoles.map((role) => ({
        id:  (role.id ?? role.roleId)?.toString() || "",
        name: role.roleName || role.name || "",
        roleName: role.roleName || role.name || "",
        description: role.description || "",
      }));

      setRoles(mappedRoles);
    } catch (error) {
showToast("Failed to load roles", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      userSearchTerm === "" ||
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(userSearchTerm.toLowerCase());
    const matchesDesignation =
      selectedDesignations.length === 0 ||
      (user.designationName &&
        selectedDesignations.includes(user.designationName));
    return matchesSearch && matchesDesignation;
  });

  const filteredRoles = roles.filter((role) => {
    const roleName = role.name || role.roleName || "";
    const matchesSearch =
      roleSearchTerm === "" ||
      roleName.toLowerCase().includes(roleSearchTerm.toLowerCase());
    return matchesSearch;
  });

  const selectedUser = selectedUserId
    ? users.find((user) => getUserEntityId(user) === selectedUserId)
    : undefined;
  const selectedRole = selectedRoleId
    ? roles.find((role) => role.id === selectedRoleId)
    : undefined;
  const selectedSourceRoles = selectedSourceRoleIds
    .map((roleId) => roles.find((role) => role.id === roleId))
    .filter((role): role is Role => Boolean(role));
  const selectedTargetPermissionIds = isUserMode
    ? userPrivileges?.privileges || []
    : rolePrivileges?.privileges || [];
  const hasSelectedTargets = isUserMode
    ? Boolean(selectedUserId)
    : Boolean(selectedRoleId);
  const selectedTargetCount = hasSelectedTargets ? 1 : 0;

  const currentEditablePermissionIds = isUserMode
    ? (userPrivileges?.privileges || []).filter(
        (permissionId) =>
          !userPrivileges?.inheritedPrivileges.includes(permissionId),
      )
    : rolePrivileges?.privileges || [];

  const originalEditablePermissionIds = isUserMode
    ? (userPrivileges?.originalPrivileges || []).filter(
        (permissionId) =>
          !userPrivileges?.inheritedPrivileges.includes(permissionId),
      )
    : rolePrivileges?.originalPrivileges || [];

  const pendingPermissionChangeCount = buildPermissionChanges(
    originalEditablePermissionIds,
    currentEditablePermissionIds,
  ).length;

  const selectedTargetLabel = isUserMode
    ? selectedTargetCount === 1
      ? "user"
      : "users"
    : selectedTargetCount === 1
      ? "role"
      : "roles";
  const targetColumnTitle = isUserMode
    ? "Selected User Permissions"
    : "Selected Role Permissions";
  const targetPermissionsLoading = isUserMode
    ? loadingEmployeePermissions
    : loadingRolePermissions;
  const designationFilterLocked = isUserMode && Boolean(selectedUserId);
  const sourceRoleSelectionLocked =
    isUserMode &&
    (!selectedUserId || loadingEmployeePermissions || !userPrivileges);
  const roleSearchLocked = !isUserMode && Boolean(selectedRoleId);

  const filteredPrivilegeGroups = privilegeGroups.filter((group) => {
    const moduleName = group.module || "";

    const privilegeNames = group.privileges.map((p) => p.name).join(" ");

    return (
      moduleName.toLowerCase().includes(moduleSearchTerm.toLowerCase()) ||
      privilegeNames.toLowerCase().includes(moduleSearchTerm.toLowerCase())
    );
  });

  const handleDesignationToggle = (designation: string) => {
    if (designationFilterLocked) {
      showToast("Cancel the selected user to filter by designation", "error");
      return;
    }

    setSelectedDesignations((prev) =>
      prev.includes(designation)
        ? prev.filter((d) => d !== designation)
        : [...prev, designation],
    );
  };

  const handleUserToggle = async (userId: string) => {
    if (selectedUserId === userId) {
      latestEmployeePermissionRequestRef.current = null;
      latestSourceRolePermissionRequestRef.current += 1;
      setLoadingEmployeePermissions(false);
      setApplyingRolePermissions(false);
      setSelectedUserId(null);
      setUserPrivileges(null);
      setSelectedSourceRoleIds([]);
      setIsUserDropdownOpen(false);
      return;
    }

    setSelectedUserId(userId);
    latestSourceRolePermissionRequestRef.current += 1;
    setUserPrivileges(null);
    setSelectedSourceRoleIds([]);
    setApplyingRolePermissions(false);
    setIsUserDropdownOpen(false);
    await loadAllEmployeePermission(userId);
  };

  const handleRoleToggle = async (roleId: string) => {
    if (selectedRoleId === roleId) {
      setIsRoleDropdownOpen(false);
      if (!rolePrivileges && can.rolePermission.view) {
        const role = roles.find((item) => item.id === roleId);
        setRolePrivileges(
          role
            ? buildRolePrivilege(role)
            : {
                roleId,
                roleName: "Unknown Role",
                originalPrivileges: [],
                privileges: [],
              },
        );
        await loadRolePermission(roleId);
      }
      return;
    }

    const role = roles.find((item) => item.id === roleId);
    setSelectedRoleId(roleId);
    setRolePrivileges(
      role
        ? buildRolePrivilege(role)
        : {
            roleId,
            roleName: "Unknown Role",
            originalPrivileges: [],
            privileges: [],
          },
    );
    setRoleSearchTerm("");
    setIsRoleDropdownOpen(false);
    await loadRolePermission(roleId);
  };

  const syncSourceRolePermissions = async (nextSourceRoleIds: string[]) => {
    const requestId = latestSourceRolePermissionRequestRef.current + 1;
    latestSourceRolePermissionRequestRef.current = requestId;

    if (!userPrivileges) return;

    if (nextSourceRoleIds.length === 0) {
      setApplyingRolePermissions(false);
      setUserPrivileges((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          roleDerivedPrivileges: [],
          privileges: prev.privileges.filter(
            (permissionId) =>
              !prev.roleDerivedPrivileges.includes(permissionId) ||
              prev.originalPrivileges.includes(permissionId),
          ),
        };
      });
      return;
    }

    try {
      setApplyingRolePermissions(true);
      const rolePermissionResults = can.rolePermission.view ? await Promise.allSettled(
        nextSourceRoleIds.map((roleId) => getRolePermissionByRoleId(roleId))
      ) : [];

      if (latestSourceRolePermissionRequestRef.current !== requestId) return;

      const validSourceRoleIds: string[] = [];
      const fetchedRolePermissionIds: string[] = [];

      rolePermissionResults.forEach((result, index) => {
        if (result.status !== "fulfilled") return;

        validSourceRoleIds.push(nextSourceRoleIds[index]);
        fetchedRolePermissionIds.push(
          ...result.value.permissionIds.map(toIdString),
        );
      });

      const failedRoleCount =
        nextSourceRoleIds.length - validSourceRoleIds.length;
      if (failedRoleCount > 0) {
        setSelectedSourceRoleIds(validSourceRoleIds);
        showToast(
          failedRoleCount === 1
            ? "A selected role has no assigned permissions, so it was removed"
            : `${failedRoleCount} selected roles have no assigned permissions, so they were removed`,
          "error",
        );
      }

      const nextRoleDerivedPermissionIds = Array.from(
        new Set(fetchedRolePermissionIds),
      );

      setUserPrivileges((prev) => {
        if (!prev) return prev;

        const removedRoleDerivedPermissionIds =
          prev.roleDerivedPrivileges.filter(
            (permissionId) =>
              !nextRoleDerivedPermissionIds.includes(permissionId) &&
              !prev.originalPrivileges.includes(permissionId),
          );
        const mergedPrivileges = prev.privileges.filter(
          (permissionId) =>
            !removedRoleDerivedPermissionIds.includes(permissionId),
        );

        nextRoleDerivedPermissionIds.forEach((permissionId) => {
          if (!mergedPrivileges.includes(permissionId)) {
            mergedPrivileges.push(permissionId);
          }
        });

        return {
          ...prev,
          privileges: mergedPrivileges,
          roleDerivedPrivileges: nextRoleDerivedPermissionIds,
        };
      });
    } catch (error) {
showToast("Failed to load permissions from selected role", "error");
    } finally {
      if (latestSourceRolePermissionRequestRef.current === requestId) {
        setApplyingRolePermissions(false);
      }
    }
  };

  const handleSourceRoleToggle = async (roleId: string) => {
    if (sourceRoleSelectionLocked) {
      showToast(
        loadingEmployeePermissions
          ? "Wait until employee permissions finish loading"
          : "Select a user before choosing source roles",
        "error",
      );
      return;
    }

    const nextSourceRoleIds = selectedSourceRoleIds.includes(roleId)
      ? selectedSourceRoleIds.filter((id) => id !== roleId)
      : [...selectedSourceRoleIds, roleId];

    setSelectedSourceRoleIds(nextSourceRoleIds);
    await syncSourceRolePermissions(nextSourceRoleIds);
  };

  const removeDesignation = (designation: string) => {
    if (designationFilterLocked) {
      showToast("Cancel the selected user to filter by designation", "error");
      return;
    }

    setSelectedDesignations((prev) => prev.filter((d) => d !== designation));
  };

  const removeSelectedUser = (userId: string) => {
    if (selectedUserId !== userId) return;
    latestEmployeePermissionRequestRef.current = null;
    latestSourceRolePermissionRequestRef.current += 1;
    setLoadingEmployeePermissions(false);
    setApplyingRolePermissions(false);
    setSelectedUserId(null);
    setUserPrivileges(null);
    setSelectedSourceRoleIds([]);
  };

  const removeSelectedRole = (roleId: string) => {
    if (selectedRoleId !== roleId) return;
    latestRolePermissionRequestRef.current = null;
    setLoadingRolePermissions(false);
    setSelectedRoleId(null);
    setRolePrivileges(null);
    setRoleSearchTerm("");
  };

  const removeSelectedSourceRole = async (roleId: string) => {
    await handleSourceRoleToggle(roleId);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        isDesignationDropdownOpen &&
        !target.closest(".designation-dropdown")
      ) {
        setIsDesignationDropdownOpen(false);
      }
      if (isUserDropdownOpen && !target.closest(".user-dropdown")) {
        setIsUserDropdownOpen(false);
      }
      if (isRoleDropdownOpen && !target.closest(".role-dropdown")) {
        setIsRoleDropdownOpen(false);
      }
      if (
        isSourceRoleDropdownOpen &&
        !target.closest(".source-role-dropdown")
      ) {
        setIsSourceRoleDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    isDesignationDropdownOpen,
    isUserDropdownOpen,
    isRoleDropdownOpen,
    isSourceRoleDropdownOpen,
  ]);

  const loadPrivileges = useCallback(async () => {
    try {
      const response = await getAllPrivileges();
      if (response.data && Array.isArray(response.data)) {
        setPrivilegeGroups(
          buildPrivilegeGroupsFromPermissionModules(response.data),
        );
      }
    } catch (error) {
const backendErrorMessage =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Failed to load privileges";
      showToast(backendErrorMessage, "error");
    }
  }, [showToast]);

  const loadRolePermission = async (roleId: number | string) => {
    const requestedRoleId = String(roleId);
    latestRolePermissionRequestRef.current = requestedRoleId;
    setLoadingRolePermissions(true);

    try {
      const apiRoleId = Number(roleId);

      if (Number.isNaN(apiRoleId)) {
        showToast("Invalid role id", "error");
        return;
      }

      const role = roles.find((item) => item.id === requestedRoleId);

      const response = await getRolePermission(apiRoleId);

      if (latestRolePermissionRequestRef.current !== requestedRoleId) return;

      const permissionIds = (response.data?.permissionIds ?? []).map(String);

      setRolePrivileges({
        roleId: requestedRoleId,
        roleName: role ? getRoleDisplayName(role) : "Unknown Role",
        privileges: [...permissionIds],
        originalPrivileges: [...permissionIds],
      });

      const successMessage =
        typeof response?.statusMessage === "string"
          ? response.statusMessage
          : "Permissions loaded successfully";

      showToast(successMessage, "success");
    } catch (error) {
      if (latestRolePermissionRequestRef.current !== requestedRoleId) return;

      const role = roles.find((item) => item.id === requestedRoleId);
      setRolePrivileges({
        roleId: requestedRoleId,
        roleName: role ? getRoleDisplayName(role) : "Unknown Role",
        privileges: [],
        originalPrivileges: [],
      });
showToast("Retrieved Sucessfully", "success");
    } finally {
      if (latestRolePermissionRequestRef.current === requestedRoleId) {
        setLoadingRolePermissions(false);
      }
    }
  };

  const assignRolePermission = async (
    roleId: number | string,
    newUpdates: PermissionAssignmentChange[],
  ): Promise<boolean> => {
    try {
      const roleIdNum: number = Number(roleId);

      if (Number.isNaN(roleIdNum)) {
        showToast("Role Id is not a number", "error");
        return false;
      }

      const responseMessage = (await addRolePermission(roleIdNum, newUpdates))
        .statusMessage;
      showToast(responseMessage, "success");
      return true;
    } catch (error) {
      const errorMessage: string = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Default :Something wrong went";

      showToast(errorMessage, "error");
      return false;
    }
  };

  const loadAllEmployeePermission = async (employeeId: string) => {
    const requestedEmployeeId = String(employeeId);
    const empIdNum: number = Number(employeeId);

    if (Number.isNaN(empIdNum)) {
      showToast(employeeId + " is not a number", "error");
      return;
    }

    const user = users.find(
      (item) => getUserEntityId(item) === requestedEmployeeId,
    );

    if (!user) {
      showToast("Selected employee was not found", "error");
      return;
    }

    latestEmployeePermissionRequestRef.current = requestedEmployeeId;
    setLoadingEmployeePermissions(true);

    try {
      const response = await getAllEmployeePermission(empIdNum);

      if (latestEmployeePermissionRequestRef.current !== requestedEmployeeId)
        return;

      const modules = Array.isArray(response.data) ? response.data : [];
      setPrivilegeGroups(buildPrivilegeGroupsFromPermissionModules(modules));
      setUserPrivileges(buildUserPrivilege(user, modules));

      const responseMessage =
        typeof response.statusMessage === "string" &&
        response.statusMessage.trim() !== ""
          ? response.statusMessage
          : "Fetched employee permissions successfully";
      showToast(responseMessage, "success");
    } catch (error) {
      if (latestEmployeePermissionRequestRef.current !== requestedEmployeeId)
        return;

      const errorMessage = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Fetching employee permissions failed";
      showToast(errorMessage, "error");
    } finally {
      if (latestEmployeePermissionRequestRef.current === requestedEmployeeId) {
        setLoadingEmployeePermissions(false);
      }
    }
  };

  const assignEmployeePermission = async (
    employeeId: string,
    payload: EmployeePermissionUpdatePayload,
  ) => {
    const empIdNum: number = Number(employeeId);

    if (Number.isNaN(empIdNum)) {
      showToast(employeeId + " is not a number", "error");
      return;
    }

    try {
      const responseMessage = (await addEmployeePermission(empIdNum, payload))
        .statusMessage;
      showToast(responseMessage);
    } catch (error) {
      const errorMessage = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Fetching employee permissions failed";
      showToast(errorMessage, "error");
    }
  };

  useEffect(() => {
    setSelectedUserId(null);
    setUserPrivileges(null);
    setSelectedSourceRoleIds([]);
    setSelectedRoleId(null);
    setRolePrivileges(null);
    loadPrivileges();
    loadUsers();
    loadDesignations();
    loadRoles();
  }, [loadPrivileges, loadUsers, loadDesignations, loadRoles]);

  const handleToggle = () => {
    setIsUserMode(!isUserMode);
    setIsDesignationDropdownOpen(false);
    setIsUserDropdownOpen(false);
    setIsRoleDropdownOpen(false);
    setIsSourceRoleDropdownOpen(false);
  };

  const handleGroupToggle = (module: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(module)) {
        newSet.delete(module);
      } else {
        newSet.add(module);
      }
      return newSet;
    });
  };

  const targetHasPrivilege = (privilegeId: string) =>
    selectedTargetPermissionIds.includes(privilegeId);

  const isOriginalEmployeePrivilege = (privilegeId: string) =>
    isUserMode &&
    Boolean(userPrivileges?.originalPrivileges.includes(privilegeId));

  const isInheritedPrivilege = (privilegeId: string) =>
    isUserMode &&
    Boolean(userPrivileges?.inheritedPrivileges.includes(privilegeId));

  const isRoleDerivedPrivilege = (privilegeId: string) =>
    isUserMode &&
    Boolean(userPrivileges?.roleDerivedPrivileges.includes(privilegeId)) &&
    !isOriginalEmployeePrivilege(privilegeId);

  const isPrivilegeLocked = (privilegeId: string) =>
    isInheritedPrivilege(privilegeId);

  const getModifiablePrivilegeIds = (privilegeIds: string[]) =>
    privilegeIds.filter((privilegeId) => !isPrivilegeLocked(privilegeId));

  const isPrivilegeSelected = (privilegeId: string) =>
    hasSelectedTargets && targetHasPrivilege(privilegeId);

  const getSelectedPrivilegeTitle = (privilegeId: string) => {
    if (!hasSelectedTargets)
      return `Select ${isUserMode ? "users" : "roles"} first`;
    if (targetPermissionsLoading)
      return `Loading ${isUserMode ? "user" : "role"} permissions`;
    if (isInheritedPrivilege(privilegeId) && isPrivilegeSelected(privilegeId)) {
      return "Inherited from role and cannot be changed here";
    }
    if (
      isRoleDerivedPrivilege(privilegeId) &&
      isPrivilegeSelected(privilegeId)
    ) {
      return "From selected role permissions";
    }
    if (
      isOriginalEmployeePrivilege(privilegeId) &&
      isPrivilegeSelected(privilegeId)
    ) {
      return "From backend employee permissions";
    }
    return "Toggle permission for selected target";
  };

  const getSelectedPrivilegeIconClass = (privilegeId: string) =>
    isRoleDerivedPrivilege(privilegeId) && isPrivilegeSelected(privilegeId)
      ? "text-green-600"
      : "text-blue-600";

  const handleSelectedPrivilegeToggle = (
    privilegeId: string,
    moduleName?: string,
  ) => {
    if (
      !hasSelectedTargets ||
      targetPermissionsLoading ||
      isPrivilegeLocked(privilegeId)
    )
      return;

    const isRead = isReadPermission(
      privilegeGroups
        .find((g) => g.privileges.some((p) => p.id === privilegeId))
        ?.privileges.find((p) => p.id === privilegeId)?.name || "",
    );

    if (isUserMode) {
      setUserPrivileges((prev) => {
        if (!prev) return prev;
        let newPrivileges = [...prev.privileges];
        const isCurrentlySelected = newPrivileges.includes(privilegeId);

        if (isRead) {
          if (!isCurrentlySelected) {
            newPrivileges.push(privilegeId);
          } else {
            const modulePermissions = getModulePermissions(
              moduleName || "",
              privilegeGroups,
            );
            newPrivileges = newPrivileges.filter(
              (p) => !modulePermissions.includes(p),
            );
          }
        } else {
          const readPermissionId = getReadPermissionIdForModule(
            moduleName || "",
            privilegeGroups,
          );
          const hasRead =
            readPermissionId && newPrivileges.includes(readPermissionId);

          if (!isCurrentlySelected) {
            if (
              readPermissionId &&
              !hasRead &&
              !isPrivilegeLocked(readPermissionId)
            ) {
              newPrivileges.push(readPermissionId);
            }
            newPrivileges.push(privilegeId);
          } else {
            newPrivileges = newPrivileges.filter((p) => p !== privilegeId);
          }
        }
        return { ...prev, privileges: newPrivileges };
      });
    } else {
      setRolePrivileges((prev) => {
        const currentRolePrivilege =
          prev ||
          (selectedRole
            ? buildRolePrivilege(selectedRole)
            : selectedRoleId
              ? {
                  roleId: selectedRoleId,
                  roleName: "Unknown Role",
                  originalPrivileges: [],
                  privileges: [],
                }
              : null);

        if (!currentRolePrivilege) return currentRolePrivilege;

        let newPrivileges = [...currentRolePrivilege.privileges];
        const isCurrentlySelected = newPrivileges.includes(privilegeId);

        if (isRead) {
          if (!isCurrentlySelected) {
            newPrivileges.push(privilegeId);
          } else {
            const modulePermissions = getModulePermissions(
              moduleName || "",
              privilegeGroups,
            );
            newPrivileges = newPrivileges.filter(
              (p) => !modulePermissions.includes(p),
            );
          }
        } else {
          const readPermissionId = getReadPermissionIdForModule(
            moduleName || "",
            privilegeGroups,
          );
          const hasRead =
            readPermissionId && newPrivileges.includes(readPermissionId);

          if (!isCurrentlySelected) {
            if (readPermissionId && !hasRead) {
              newPrivileges.push(readPermissionId);
            }
            newPrivileges.push(privilegeId);
          } else {
            newPrivileges = newPrivileges.filter((p) => p !== privilegeId);
          }
        }

        return { ...currentRolePrivilege, privileges: newPrivileges };
      });
    }
  };

  const getAllPrivilegeIds = () =>
    privilegeGroups.flatMap((group) => group.privileges.map((p) => p.id));

  const isAllPrivilegesSelected = () => {
    if (!hasSelectedTargets) return false;
    const allIds = getAllPrivilegeIds();
    return (
      allIds.length > 0 &&
      allIds.every((id) => selectedTargetPermissionIds.includes(id))
    );
  };

  const isAllPrivilegesPartiallySelected = () => {
    if (!hasSelectedTargets) return false;
    const allIds = getAllPrivilegeIds();
    const selectedCount = allIds.filter((id) =>
      selectedTargetPermissionIds.includes(id),
    ).length;
    return selectedCount > 0 && selectedCount < allIds.length;
  };

  const handleSelectAllPrivileges = () => {
    if (!hasSelectedTargets || targetPermissionsLoading) return;

    const modifiablePrivilegeIds =
      getModifiablePrivilegeIds(getAllPrivilegeIds());
    if (modifiablePrivilegeIds.length === 0) return;

    const shouldSelect = !modifiablePrivilegeIds.every((id) =>
      selectedTargetPermissionIds.includes(id),
    );

    const applyToggle = (privileges: string[]) =>
      shouldSelect
        ? Array.from(new Set([...privileges, ...modifiablePrivilegeIds]))
        : privileges.filter((id) => !modifiablePrivilegeIds.includes(id));

    if (isUserMode) {
      setUserPrivileges((prev) =>
        prev ? { ...prev, privileges: applyToggle(prev.privileges) } : prev,
      );
    } else {
      setRolePrivileges((prev) =>
        prev ? { ...prev, privileges: applyToggle(prev.privileges) } : prev,
      );
    }
  };

  const handleSelectAllGroup = (module: string) => {
    const group = privilegeGroups?.find((g) => g.module === module);
    if (!group || !hasSelectedTargets || targetPermissionsLoading) return;

    const groupPrivilegeIds = group.privileges.map((p) => p.id);
    const modifiablePrivilegeIds = getModifiablePrivilegeIds(groupPrivilegeIds);
    if (modifiablePrivilegeIds.length === 0) return;

    const shouldSelect = !modifiablePrivilegeIds.every((id) =>
      selectedTargetPermissionIds.includes(id),
    );

    if (isUserMode) {
      setUserPrivileges((prev) => {
        if (!prev) return prev;
        let newPrivileges = [...prev.privileges];

        if (shouldSelect) {
          modifiablePrivilegeIds.forEach((id) => {
            if (!newPrivileges.includes(id)) newPrivileges.push(id);
          });
        } else {
          newPrivileges = newPrivileges.filter(
            (id) => !modifiablePrivilegeIds.includes(id),
          );
        }
        return { ...prev, privileges: newPrivileges };
      });
    } else {
      setRolePrivileges((prev) => {
        if (!prev) return prev;
        let newPrivileges = [...prev.privileges];
        if (shouldSelect) {
          modifiablePrivilegeIds.forEach((id) => {
            if (!newPrivileges.includes(id)) newPrivileges.push(id);
          });
        } else {
          newPrivileges = newPrivileges.filter(
            (id) => !modifiablePrivilegeIds.includes(id),
          );
        }
        return { ...prev, privileges: newPrivileges };
      });
    }
  };

  const isGroupSelected = (module: string) => {
    const group =
      privilegeGroups && privilegeGroups.find((g) => g.module === module);
    if (!group || !hasSelectedTargets) return false;

    const groupPrivilegeIds = group.privileges.map((p) => p.id);
    return groupPrivilegeIds.every((id) =>
      selectedTargetPermissionIds.includes(id),
    );
  };

  const isGroupPartiallySelected = (module: string) => {
    const group =
      privilegeGroups && privilegeGroups.find((g) => g.module === module);
    if (!group || !hasSelectedTargets) return false;

    const groupPrivilegeIds = group.privileges.map((p) => p.id);
    const selectedCount = groupPrivilegeIds.filter((id) =>
      selectedTargetPermissionIds.includes(id),
    ).length;
    return selectedCount > 0 && selectedCount < groupPrivilegeIds.length;
  };

  const handleSave = async () => {
    if (!canAssignPermissions) {
      showToast(
        `You do not have permission to assign ${isUserMode ? "user" : "role"} permissions`,
        "error",
      );
      return;
    }

    if (isUserMode) {
      if (!selectedUserId || !userPrivileges) {
        showToast("Please select a user first", "error");
        return;
      }

      const updatePayload =
        buildEmployeePermissionUpdatePayload(userPrivileges);

      if (!updatePayload) return;

      await assignEmployeePermission(selectedUserId, updatePayload);
      await loadAllEmployeePermission(selectedUserId);
      return;
    }

    const updatePayload = buildRolePermissionUpdatePayload(rolePrivileges);
    const roleId = selectedRoleId || rolePrivileges?.roleId;

    if (!roleId || !updatePayload) {
      showToast("Please select a role first", "error");
      return;
    }

    if (updatePayload.length === 0) {
      showToast("No role permission changes to save", "error");
      return;
    }
const saved = await assignRolePermission(roleId, updatePayload);
    if (saved) {
      await loadRolePermission(roleId);
    }

    if (saved) {
      setRolePrivileges((prev) =>
        prev
          ? {
              ...prev,
              originalPrivileges: [...prev.privileges],
            }
          : prev,
      );
    }
  };



  return (
    <div className="max-w-6xl mx-auto p-8">
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

      {}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Privileges Configuration
          </h1>
          <p className="text-gray-600 mt-1">
            Assign privileges to {isUserMode ? "users" : "roles"} for access
            control
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {}
          <Card className="p-3 bg-gray-50 border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span
                  className={`text-sm font-medium ${!isUserMode ? "text-blue-600" : "text-gray-500"}`}
                >
                  Roles
                </span>
              </div>

              <button
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isUserMode ? "bg-blue-600" : "bg-gray-300"
                }`}
                disabled={loading}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isUserMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>

              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-green-600" />
                <span
                  className={`text-sm font-medium ${isUserMode ? "text-green-600" : "text-gray-500"}`}
                >
                  Users
                </span>
              </div>
            </div>
          </Card>

         {(can.employeePermission.assign || can.rolePermission.assign) && (
  <Button
    onClick={handleSave}
    className="flex items-center space-x-2"
    disabled={
      loading ||
      targetPermissionsLoading ||
      !hasSelectedTargets ||
      !canAssignPermissions ||
      pendingPermissionChangeCount === 0
    }
  >
    <Save className="w-4 h-4" />
    <span>Save Changes</span>
  </Button>
)}
          <Button
            variant="secondary"
            onClick={() => navigate("/configurations")}
            className="flex items-center"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Back
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {isUserMode ? "User" : "Role"} Privileges Matrix
              </h3>
            </div>
            <div className="text-sm text-gray-500">
              {privilegeGroups.length} modules - {selectedTargetCount} selected{" "}
              {selectedTargetLabel}
              {isUserMode && filteredUsers.length !== users.length && (
                <span className="text-blue-600">
                  {" "}
                  (filtered from {users.length})
                </span>
              )}
              {!isUserMode && filteredRoles.length !== roles.length && (
                <span className="text-blue-600">
                  {" "}
                  (filtered from {roles.length})
                </span>
              )}
              {loading && (
                <span className="ml-2 text-blue-600">Loading...</span>
              )}
              <span className="ml-2 text-xs text-gray-400">
                (Choose {isUserMode ? "users" : "roles"} from the dropdown to
                edit permissions)
              </span>
            </div>
          </div>
        </CardHeader>

        {}
        {(isUserMode || !isUserMode) && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4 flex-wrap">
              {isUserMode ? (
                <>
                  {}
                  <div className="w-[220px] min-w-[220px] flex-shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search users by name..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {}
                  <div className="flex-1 max-w-md">
                    <div
                      className="relative"
                      title={
                        roleSearchLocked
                          ? "Cancel the selected role to search or filter roles"
                          : undefined
                      }
                    >
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search roles by name..."
                        value={roleSearchTerm}
                        onChange={(e) => {
                          if (!roleSearchLocked) {
                            setRoleSearchTerm(e.target.value);
                          }
                        }}
                        disabled={roleSearchLocked}
                        className={`pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          roleSearchLocked
                            ? "cursor-not-allowed opacity-70"
                            : ""
                        }`}
                      />
                    </div>
                  </div>
                </>
              )}

              {isUserMode ? (
                <>
                  {}
                  <div className="min-w-[220px] max-w-[320px] flex-1">
                    <div
                      className="relative designation-dropdown"
                      title={
                        designationFilterLocked
                          ? "Cancel the selected user to filter by designation"
                          : undefined
                      }
                    >
                      <Filter className="absolute left-3 top-3 text-gray-400 w-4 h-4 z-10" />
                      <div
                        className={`min-h-[42px] pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
                          designationFilterLocked ? "opacity-70" : ""
                        }`}
                      >
                        <div className="flex flex-wrap gap-1 items-center">
                          {selectedDesignations.map((designation) => (
                            <Badge
                              key={designation}
                              variant="info"
                              size="sm"
                              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              <span className="text-xs">{designation}</span>
                              <button
                                onClick={() => removeDesignation(designation)}
                                className={`ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors ${
                                  designationFilterLocked
                                    ? "cursor-not-allowed"
                                    : ""
                                }`}
                                type="button"
                                title={
                                  designationFilterLocked
                                    ? "Cancel the selected user to filter by designation"
                                    : "Remove designation"
                                }
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              if (designationFilterLocked) {
                                showToast(
                                  "Cancel the selected user to filter by designation",
                                  "error",
                                );
                                return;
                              }
                              setIsDesignationDropdownOpen(
                                !isDesignationDropdownOpen,
                              );
                              setIsUserDropdownOpen(false);
                              setIsSourceRoleDropdownOpen(false);
                            }}
                            className={`text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded ${
                              designationFilterLocked
                                ? "cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {selectedDesignations.length === 0
                              ? "Select designations..."
                              : "Add more..."}
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (designationFilterLocked) {
                            showToast(
                              "Cancel the selected user to filter by designation",
                              "error",
                            );
                            return;
                          }
                          setIsDesignationDropdownOpen(
                            !isDesignationDropdownOpen,
                          );
                          setIsUserDropdownOpen(false);
                          setIsSourceRoleDropdownOpen(false);
                        }}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${
                          designationFilterLocked ? "cursor-not-allowed" : ""
                        }`}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isDesignationDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isDesignationDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[9998]"
                            onClick={() => setIsDesignationDropdownOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-[9999] max-h-48 overflow-y-auto backdrop-blur-sm ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              {availableDesignations.map((designation) => (
                                <button
                                  key={designation}
                                  type="button"
                                  onClick={() =>
                                    handleDesignationToggle(designation)
                                  }
                                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                                    selectedDesignations.includes(designation)
                                      ? "bg-blue-50 text-blue-700 border-l-4 border-l-blue-500 font-semibold shadow-sm"
                                      : "text-gray-700 hover:text-gray-900 hover:bg-blue-50 hover:shadow-sm"
                                  }`}
                                >
                                  <span className="font-medium">
                                    {designation}
                                  </span>
                                  {selectedDesignations.includes(
                                    designation,
                                  ) && (
                                    <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  )}
                                </button>
                              ))}
                              {availableDesignations.length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-500 italic text-center">
                                  No designations available
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {}
                  <div className="min-w-[220px] max-w-[320px] flex-1">
                    <div className="relative user-dropdown">
                      <User className="absolute left-3 top-3 text-gray-400 w-4 h-4 z-10" />
                      <div className="min-h-[42px] pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                        <div className="flex flex-wrap gap-1 items-center">
                          {selectedUser && selectedUserId && (
                            <Badge
                              key={selectedUserId}
                              variant="info"
                              size="sm"
                              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              <span className="text-xs">
                                {getUserDropdownLabel(selectedUser)}
                              </span>
                              <button
                                onClick={() =>
                                  removeSelectedUser(selectedUserId)
                                }
                                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                type="button"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserDropdownOpen(!isUserDropdownOpen);
                              setIsDesignationDropdownOpen(false);
                              setIsSourceRoleDropdownOpen(false);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                          >
                            {!selectedUserId
                              ? "Select user..."
                              : "Change user..."}
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(!isUserDropdownOpen);
                          setIsDesignationDropdownOpen(false);
                          setIsSourceRoleDropdownOpen(false);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isUserDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isUserDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[9998]"
                            onClick={() => setIsUserDropdownOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-[9999] max-h-48 overflow-y-auto backdrop-blur-sm ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              {filteredUsers.map((user) => {
                                const userId = getUserEntityId(user);

                                return (
                                  <button
                                    key={userId}
                                    type="button"
                                    onClick={() => handleUserToggle(userId)}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                                      selectedUserId === userId
                                        ? "bg-blue-50 text-blue-700 border-l-4 border-l-blue-500 font-semibold shadow-sm"
                                        : "text-gray-700 hover:text-gray-900 hover:bg-blue-50 hover:shadow-sm"
                                    }`}
                                  >
                                    <span className="flex flex-col">
                                      <span className="font-medium">
                                        {getUserDisplayName(user)}
                                      </span>
                                      {user.designationName && (
                                        <span className="text-xs text-gray-400 mt-0.5">
                                          {user.designationName}
                                        </span>
                                      )}
                                    </span>
                                    {selectedUserId === userId && (
                                      <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                              {filteredUsers.length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-500 italic text-center">
                                  No users available
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {}
                  <div className="min-w-[220px] max-w-[320px] flex-1">
                    <div
                      className="relative source-role-dropdown"
                      title={
                        sourceRoleSelectionLocked
                          ? loadingEmployeePermissions
                            ? "Wait until employee permissions finish loading"
                            : "Select a user before choosing source roles"
                          : undefined
                      }
                    >
                      <Shield className="absolute left-3 top-3 text-gray-400 w-4 h-4 z-10" />
                      <div
                        className={`min-h-[42px] pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
                          sourceRoleSelectionLocked ? "opacity-70" : ""
                        }`}
                      >
                        <div className="flex flex-wrap gap-1 items-center">
                          {selectedSourceRoles.map((role) => (
                            <Badge
                              key={role.id}
                              variant="info"
                              size="sm"
                              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              <span className="text-xs">
                                {getRoleDisplayName(role)}
                              </span>
                              <button
                                onClick={() =>
                                  removeSelectedSourceRole(role.id)
                                }
                                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                type="button"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              if (sourceRoleSelectionLocked) {
                                showToast(
                                  loadingEmployeePermissions
                                    ? "Wait until employee permissions finish loading"
                                    : "Select a user before choosing source roles",
                                  "error",
                                );
                                return;
                              }
                              setIsSourceRoleDropdownOpen(
                                !isSourceRoleDropdownOpen,
                              );
                              setIsDesignationDropdownOpen(false);
                              setIsUserDropdownOpen(false);
                            }}
                            className={`text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded ${
                              sourceRoleSelectionLocked
                                ? "cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {applyingRolePermissions
                              ? "Loading permissions..."
                              : selectedSourceRoleIds.length === 0
                                ? "Select source roles..."
                                : "Add more roles..."}
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (sourceRoleSelectionLocked) {
                            showToast(
                              loadingEmployeePermissions
                                ? "Wait until employee permissions finish loading"
                                : "Select a user before choosing source roles",
                              "error",
                            );
                            return;
                          }
                          setIsSourceRoleDropdownOpen(
                            !isSourceRoleDropdownOpen,
                          );
                          setIsDesignationDropdownOpen(false);
                          setIsUserDropdownOpen(false);
                        }}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${
                          sourceRoleSelectionLocked ? "cursor-not-allowed" : ""
                        }`}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isSourceRoleDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isSourceRoleDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[9998]"
                            onClick={() => setIsSourceRoleDropdownOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-[9999] max-h-48 overflow-y-auto backdrop-blur-sm ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              {roles.map((role) => (
                                <button
                                  key={role.id}
                                  type="button"
                                  onClick={() =>
                                    handleSourceRoleToggle(role.id)
                                  }
                                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                                    selectedSourceRoleIds.includes(role.id)
                                      ? "bg-blue-50 text-blue-700 border-l-4 border-l-blue-500 font-semibold shadow-sm"
                                      : "text-gray-700 hover:text-gray-900 hover:bg-blue-50 hover:shadow-sm"
                                  }`}
                                >
                                  <span className="font-medium">
                                    {getRoleDisplayName(role)}
                                  </span>
                                  {selectedSourceRoleIds.includes(role.id) && (
                                    <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  )}
                                </button>
                              ))}
                              {roles.length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-500 italic text-center">
                                  No roles available
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="min-w-[220px] max-w-[320px] flex-1">
                  <div className="relative role-dropdown">
                    <Shield className="absolute left-3 top-3 text-gray-400 w-4 h-4 z-10" />
                    <div className="min-h-[42px] pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <div className="flex flex-wrap gap-1 items-center">
                        {selectedRole && selectedRoleId && (
                          <Badge
                            key={selectedRoleId}
                            variant="info"
                            size="sm"
                            className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200"
                          >
                            <span className="text-xs">
                              {getRoleDisplayName(selectedRole)}
                            </span>
                            <button
                              onClick={() => removeSelectedRole(selectedRoleId)}
                              className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                              type="button"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setIsRoleDropdownOpen(!isRoleDropdownOpen)
                          }
                          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                        >
                          {!selectedRoleId
                            ? "Select role..."
                            : "Change role..."}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isRoleDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isRoleDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[9998]"
                          onClick={() => setIsRoleDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-[9999] max-h-48 overflow-y-auto backdrop-blur-sm ring-1 ring-black ring-opacity-5">
                          <div className="py-1">
                            {filteredRoles.map((role) => (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => handleRoleToggle(role.id)}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                                  selectedRoleId === role.id
                                    ? "bg-blue-50 text-blue-700 border-l-4 border-l-blue-500 font-semibold shadow-sm"
                                    : "text-gray-700 hover:text-gray-900 hover:bg-blue-50 hover:shadow-sm"
                                }`}
                              >
                                <span className="font-medium">
                                  {getRoleDisplayName(role)}
                                </span>
                                {selectedRoleId === role.id && (
                                  <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                )}
                              </button>
                            ))}
                            {filteredRoles.length === 0 && (
                              <div className="px-4 py-3 text-sm text-gray-500 italic text-center">
                                No roles available
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {}
              {isUserMode
                ? (userSearchTerm ||
                    (!designationFilterLocked &&
                      selectedDesignations.length > 0)) && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setUserSearchTerm("");
                        if (!designationFilterLocked) {
                          setSelectedDesignations([]);
                        }
                        setIsDesignationDropdownOpen(false);
                      }}
                      className="px-3 py-2 text-sm"
                    >
                      Clear
                    </Button>
                  )
                : roleSearchTerm &&
                  !roleSearchLocked && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setRoleSearchTerm("");
                      }}
                      className="px-3 py-2 text-sm"
                    >
                      Clear
                    </Button>
                  )}

              {}
              <div className="text-sm text-gray-500">
                {isUserMode
                  ? `${filteredUsers.length} of ${users.length} users`
                  : `${filteredRoles.length} of ${roles.length} roles`}
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <div className="overflow-x-auto" style={{ maxHeight: "70vh" }}>
            <table className="w-full">
              <thead className="sticky top-0 z-30">
                <tr className="bg-gray-50 border-b border-gray-200 whitespace-nowrap">
                  {}
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-40 bg-gray-50 border-r border-gray-300"
                    style={{ minWidth: 320 }}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span>Module / Privilege</span>

                      <div className="relative w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

                        <Input
                          type="text"
                          placeholder="Search module / privilege..."
                          value={moduleSearchTerm}
                          onChange={(e) => setModuleSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                    style={{ minWidth: 280 }}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="flex items-center justify-center space-x-2">
                        {isUserMode ? (
                          <User className="w-4 h-4 text-green-600" />
                        ) : (
                          <Shield className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="font-medium text-sm">
                          {targetColumnTitle}
                        </span>
                        <button
                          type="button"
                          onClick={handleSelectAllPrivileges}
                          className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                          title={
                            !hasSelectedTargets
                              ? `Select ${isUserMode ? "users" : "roles"} first`
                              : targetPermissionsLoading
                                ? `Loading ${isUserMode ? "user" : "role"} permissions`
                                : "Select or deselect all privileges in every module"
                          }
                          disabled={
                            !hasSelectedTargets || targetPermissionsLoading
                          }
                        >
                          {isAllPrivilegesSelected() ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : isAllPrivilegesPartiallySelected() ? (
                            <div className="w-4 h-4 border-2 border-blue-500 bg-blue-50 rounded flex items-center justify-center">
                              <div className="w-2 h-0.5 bg-blue-500 rounded"></div>
                            </div>
                          ) : (
                            <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      <span
                        className="text-xs text-gray-400 mt-0.5"
                        style={{ fontSize: "10px" }}
                      >
                        {targetPermissionsLoading
                          ? `Loading ${isUserMode ? "user" : "role"} permissions...`
                          : hasSelectedTargets
                            ? `${pendingPermissionChangeCount} change${pendingPermissionChangeCount === 1 ? "" : "s"} pending`
                            : "Select from dropdown above"}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPrivilegeGroups.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.module);
                  const groupPrivilegeIds = group.privileges.map(
                    (privilege) => privilege.id,
                  );
                  const groupActionDisabled =
                    !hasSelectedTargets ||
                    targetPermissionsLoading ||
                    getModifiablePrivilegeIds(groupPrivilegeIds).length === 0;

                  return (
                    <React.Fragment key={group.module}>
                      {}
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-l-blue-500">
                        {}
                        <td className="px-4 py-3 sticky left-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 border-r border-gray-300">
                          <div className="flex items-center space-x-3 py-2">
                            <button
                              onClick={() => handleGroupToggle(group.module)}
                              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all duration-200"
                              title={
                                isCollapsed
                                  ? "Expand module"
                                  : "Collapse module"
                              }
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                            <div className="flex items-center space-x-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-gray-800 text-base">
                                {group.module}
                              </span>
                            </div>
                            <Badge variant="default" size="sm">
                              {group.privileges.length} privileges
                            </Badge>
                          </div>
                        </td>
                        {}
                        <td className="px-4 py-3 text-center bg-gradient-to-r from-gray-50 to-gray-100">
                          <button
                            onClick={() => handleSelectAllGroup(group.module)}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                            title={
                              !hasSelectedTargets
                                ? `Select ${isUserMode ? "users" : "roles"} first`
                                : targetPermissionsLoading
                                  ? `Loading ${isUserMode ? "user" : "role"} permissions`
                                  : groupActionDisabled
                                    ? "No permissions in this module can be changed"
                                    : "Select or deselect all selected targets"
                            }
                            disabled={groupActionDisabled}
                          >
                            {isGroupSelected(group.module) ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : isGroupPartiallySelected(group.module) ? (
                              <div className="w-5 h-5 border-2 border-blue-500 bg-blue-50 rounded flex items-center justify-center">
                                <div className="w-2.5 h-0.5 bg-blue-500 rounded"></div>
                              </div>
                            ) : (
                              <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {}
                      {!isCollapsed &&
                        group.privileges.map((privilege) => {
                          return (
                            <tr
                              key={privilege.id}
                              className="hover:bg-blue-50/30 transition-colors duration-150"
                            >
                              {}
                              <td className="px-4 py-3 sticky left-0 z-10 bg-white border-r border-gray-300">
                                <div className="pl-12 py-3">
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-1">
                                      <Lock className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h4 className="font-medium text-gray-900 text-sm">
                                          {privilege.name}
                                        </h4>
                                      </div>
                                      <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                                        {privilege.description}
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {privilege.permissions.map(
                                          (permission, index) => (
                                            <Badge
                                              key={index}
                                              variant="info"
                                              size="sm"
                                              className="text-xs font-medium"
                                            >
                                              {permission
                                                .charAt(0)
                                                .toUpperCase() +
                                                permission.slice(1)}
                                            </Badge>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {}
                              <td className="px-4 py-3 text-center bg-white">
                                <div className="flex justify-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSelectedPrivilegeToggle(
                                        privilege.id,
                                        group.module,
                                      )
                                    }
                                    className="p-2 hover:bg-blue-50 rounded-md transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                                    title={getSelectedPrivilegeTitle(
                                      privilege.id,
                                    )}
                                    disabled={
                                      !hasSelectedTargets ||
                                      targetPermissionsLoading ||
                                      isPrivilegeLocked(privilege.id)
                                    }
                                  >
                                    {isPrivilegeSelected(privilege.id) ? (
                                      <CheckSquare
                                        className={`w-5 h-5 ${getSelectedPrivilegeIconClass(privilege.id)}`}
                                      />
                                    ) : (
                                      <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {}
      <Card className="mt-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Key className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                <span>
                  How to Use {isUserMode ? "User" : "Role"} Privileges
                  Configuration
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <ChevronDown className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-blue-800">
                      Click chevron icons to expand/collapse module groups
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-blue-800">
                      Use module checkboxes to select/deselect all privileges
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Square className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-blue-800">
                      Individual checkboxes control specific privilege access
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 bg-blue-50 rounded mt-0.5 flex-shrink-0 flex items-center justify-center">
                      <div className="w-2 h-0.5 bg-blue-500 rounded"></div>
                    </div>
                    <span className="text-sm text-blue-800">
                      Blue dash indicators show partially selected modules
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    {isUserMode ? (
                      <User className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-sm text-blue-800">
                      Toggle between Role and User modes using the switch above
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Save className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-blue-800">
                      Remember to save changes when configuration is complete
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Privileges;
