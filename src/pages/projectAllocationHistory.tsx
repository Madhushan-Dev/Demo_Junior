
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  ChevronLeft,
  Users,
  Calendar,
  User,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { getAllProjects } from "../api/projectget";
import { Project } from "../types";
import {
  getProjectAllocationHistory,
  getProjectAllocationHistoryByRole,
} from "../api/projectAllocationHistory/projectAllocationHistory";
import { getAllRoles } from "../api/role/viewrole";
import * as Select from "@radix-ui/react-select";
import { useAccessibleProjects } from "../api/useAccessibleProjects";
import { formatDate } from "../utils/formatDateTime";
import ProjectSelector from "../components/ui/ProjectSelector";

interface AllocationRecord {
  id: number;
  percentage: number;
  userFullName: string;
  projectName: string;
  roleName: string;
  startDate: string;
  endDate: string;
  projectId: number;
  userId: number;
  roleId: number;
  status: boolean;
  allocationPercentage: number;
  firstName: string;
  email: string;
  lastName: string;
   employeeName?: string;
 employeeEmail?: string;
}

interface ProjectAllocationHistory {
  userId: number;
  allocations: AllocationRecord[];
  deallocations: AllocationRecord[];
}

interface Role {
  id: string | number;
  name?: string;
  roleName: string;
  description?: string;
  permissions?: string[];
  level?: string;
  createdAt?: string;
  updatedAt?: string;
}

const ProjectAllocationHistory: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const {
    selectedProjectId: contextProjectId,
    setSelectedProjectId: setContextProjectId,
  } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    contextProjectId || null,
  );

  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [allocationHistory, setAllocationHistory] = useState<
    ProjectAllocationHistory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const { projects: accessibleProjects, switchProject } =
    useAccessibleProjects();

  useEffect(() => {
    if (selectedProjectId) {
      setLoading(true);

      getProjectAllocationHistory(Number(selectedProjectId))
        .then((response: any) => {
          let historyData = [];

          if (response?.data?.data && Array.isArray(response.data.data)) {
            historyData = response.data.data;
          } else if (response?.data && Array.isArray(response.data)) {
            historyData = response.data;
          } else if (Array.isArray(response)) {
            historyData = response;
          }


        //  const mappedHistory = historyData.map((item: any) => ({
         //   userId: item.empId ?? item.employeeId ?? item.userId ?? item.id,
          //  allocations: [
            //  {
             //   id: item.benchAllocationId ?? item.id,
             //   firstName: item.firstName || "",
              //  lastName: item.lastName || "",
              //  email: item.userEmailemail || "",
             //   roleName: item.roleName || "",
             //   roleId: item.roleId,
                // The allocation-history API returns this value as `availability`.
             //   percentage:
              //    item.availability ?? item.allocationPercent ?? item.percentage ?? 0,
              //  startDate: item.startDate,
             //   endDate: item.endDate,
            //    status: item.status ?? true,
           //   },
         //   ],
         //   deallocations:// [],
        //  }));

          const userMap = new Map<number, ProjectAllocationHistory>();


          historyData.forEach((item: any) => {
            const userId = item.empId ?? item.employeeId ?? item.userId ?? item.id;
            const isAllocated = item.endDate
              ? new Date(item.endDate).getTime() > Date.now()
              : true;

            // const record = {
            //   id: item.benchAllocationId ?? item.id,
            //   firstName: item.firstName || "",
            //   lastName: item.lastName || "",
            //   email: item.email || "",
            //   roleName: item.roleName || "",
            //   roleId: item.roleId,
            //   percentage:
            //     item.availability ?? item.allocationPercent ?? item.percentage ?? 0,
            //   startDate: item.startDate,
            //   endDate: item.endDate,
            //   status: item.status !== undefined ? Boolean(item.status) : isAllocated,
            // };
            const nameParts = (item.employeeName || "").split(" ");

const record = {
  id: item.benchAllocationId ?? item.id,

  // Employee table data exists
  firstName: item.firstName || nameParts[0] || "",

  lastName:
    item.lastName ||
    nameParts.slice(1).join(" ") ||
    "",

  // Important: backend sends employeeEmail
  email: item.email || item.employeeEmail || "",

  roleName: item.roleName || "",

  roleId: item.roleId,

  percentage:
    item.availability ??
    item.allocationPercent ??
    item.percentage ??
    0,

  startDate: item.startDate,
  endDate: item.endDate,

  status:
    item.status !== undefined
      ? Boolean(item.status)
      : isAllocated,
};

            if (!userMap.has(userId)) {
              userMap.set(userId, {
                userId,
                allocations: [record],
                deallocations: [],
              });
            } else {
              userMap.get(userId)!.allocations.push(record);
            }
          });

                    userMap.forEach((user) => {
            user.allocations.sort((a, b) => {
             
              if (a.status !== b.status) {
                return a.status ? -1 : 1;
              }
             
              return (Number(b.id) || 0) - (Number(a.id) || 0);
            });
          });


          const mappedHistory = Array.from(userMap.values());
          setAllocationHistory(mappedHistory);

        })
        .catch(() => {
          setAllocationHistory([]);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedProjectId]);
useEffect(() => {
    if (contextProjectId && contextProjectId !== selectedProjectId) {
      setSelectedProjectId(contextProjectId);
    }
  }, [contextProjectId, selectedProjectId]);

  useEffect(() => {
    setRolesLoading(true);
    getAllRoles()
      .then((response: any) => {
      const roleArray = Array.isArray(response?.content)
  ? response.content
  : [];

setRoles(roleArray);
      })
      .catch((err) => {
        setRolesError(err.message);
        setRoles([]);
      })
      .finally(() => setRolesLoading(false));
  }, []);

  const currentProject = useMemo(
    () =>
      accessibleProjects.find(
        (p) => String(p.id) === String(selectedProjectId),
      ),
    [selectedProjectId, accessibleProjects],
  );
  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const getStatusColor = (status: boolean) => {
    if (status === true) {
      return "bg-green-100 text-green-800";
    }
    if (status === false) {
      return "bg-red-100 text-red-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "allocated":
        return "bg-green-100 text-green-800";
      case "deallocated":
        return "bg-red-100 text-red-800";
      case "percentage_changed":
        return "bg-blue-100 text-blue-800";
      case "role_changed":
        return "bg-purple-100 text-purple-800";
      case "period_changed":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleProjectSelect = (id: string) => {
    switchProject(Number(id));

    setSelectedProjectId(id);
    setContextProjectId?.(id);

    setExpandedUser(null);
  };

  const filteredAllocationHistory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return allocationHistory.filter((user) => {
      const records = [
        ...(user.allocations || []),
        ...(user.deallocations || []),
      ];

      const searchMatch =
        !term ||
        records.some((record) => {
          const fullName =
            `${record.firstName || ""} ${record.lastName || ""}`.toLowerCase();
          const roleName = (record.roleName || "").toLowerCase();

          return fullName.includes(term) || roleName.includes(term);
        });

      const roleMatch =
        roleFilter === "all" ||
        records.some((record) => String(record.roleId) === String(roleFilter));

      return searchMatch && roleMatch;
    });
  }, [allocationHistory, searchTerm, roleFilter]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {}
      <div className="mb-6">
        {}
        <div className="mb-4 flex justify-end">
          <Button
            variant="secondary"
            onClick={() =>
              navigate(`/projects/${projectId}/project-management`)
            }
            className="flex items-center"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Back
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-900">
            Project Allocation History
          </h1>
        </div>
        <p className="text-gray-600 mt-2">
          Track project-level user allocations and movements
        </p>
      </div>

      {}
      {}
      <ProjectSelector
        projects={accessibleProjects}
        selectedProjectId={selectedProjectId}
        onSelect={(id, project) => {
          handleProjectSelect(id);
        }}
      />
      {}

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by name, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 min-w-[220px]">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="w-full">
                <Select.Root value={roleFilter} onValueChange={setRoleFilter}>
                  <Select.Trigger
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full flex items-center justify-between"
                    aria-label="Role"
                  >
                    <Select.Value placeholder="All Roles" />
                    <Select.Icon>
                      <ChevronDown className="w-4 h-4" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      position="popper"
                      sideOffset={4}
                      className="bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[220px]"
                      style={{ position: "fixed" }}
                    >
                      <Select.Viewport>
                        <Select.Item
                          value="all"
                          className="pl-4 pr-8 py-2 flex items-center cursor-pointer data-[state=checked]:bg-blue-100"
                        >
                          <Select.ItemText>All Roles</Select.ItemText>
                        </Select.Item>
                        {[
                          ...new Map(
                            allocationHistory.flatMap((user) =>
                              (user.allocations || []).map((a) => [
                                a.roleId,
                                {
                                  id: a.roleId,
                                  roleName: a.roleName,
                                },
                              ]),
                            ),
                          ).values(),
                        ].map((r: any) => (
                          <Select.Item
                            key={r.id}
                            value={String(r.id)}
                            className="pl-4 pr-8 py-2 flex items-center cursor-pointer data-[state=checked]:bg-blue-100"
                          >
                            <Select.ItemText>{r.roleName}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Project Allocation History
            {selectedProjectId && (
              <span className="text-sm font-normal text-gray-600">
                - {currentProject?.projectName || currentProject?.name}
              </span>
            )}
          </h3>
        </CardHeader>
        <CardContent>
          {Array.isArray(filteredAllocationHistory) &&
          filteredAllocationHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No users found matching the selected criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(filteredAllocationHistory) &&
                filteredAllocationHistory.map((user, userIdx) => {
                  const isExpanded = expandedUser === user.userId;
                  return (
                    <Card
                      key={user.userId + "-" + userIdx}
                      className="border border-gray-200"
                    >
                      <CardContent className="p-0">
                        {}
                        {user &&
                          Array.isArray(user.allocations) &&
                          user.allocations.length > 0 && (
                            <div
                              key={user.userId + "-" + user.allocations[0].id}
                              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                setExpandedUser(isExpanded ? null : user.userId)
                              }
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-400" />
                                    )}
                                    <User className="w-5 h-5 text-blue-500" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      {user.allocations[0].firstName}{" "}
                                      {user.allocations[0].lastName}
                                    </h4>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                      {user.allocations[0].roleName}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {user.allocations[0].percentage}%
                                      allocated
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {user.allocations[0].startDate &&
                                      user.allocations[0].endDate
                                        ? `${formatDate(user.allocations[0].startDate)} to ${formatDate(user.allocations[0].endDate)}`
                                        : "No period set"}
                                    </p>
                                  </div>
                                  <Badge
                                    className={getStatusColor(
                                      user.allocations[0].status,
                                    )}
                                  >
                                    {user.allocations[0].status === true
                                      ? "Allocated"
                                      : user.allocations[0].status === false
                                        ? "Deallocated"
                                        : ""}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )}

                        {}
                        {isExpanded && (
                          <div className="border-t border-gray-200 bg-gray-50">
                            <div className="p-4">
                              <h5 className="font-semibold text-gray-900 mb-3">
                                Allocation History
                              </h5>
                              {(user.allocations &&
                                user.allocations.length > 0) ||
                              (user.deallocations &&
                                user.deallocations.length > 0) ? (
                                <div className="space-y-3">
                                  {[
                                    ...(user.allocations || []),
                                    ...(user.deallocations || []),
                                  ]
                                    .sort(
                                      (a, b) =>
                                        new Date(a.startDate).getTime() -
                                        new Date(b.startDate).getTime(),
                                    )
                                    .map((record, idx) => (
                                      <div
                                        key={
                                          user.userId +
                                          "-" +
                                          record.id +
                                          "-" +
                                          idx
                                        }
                                        className="bg-white p-3 rounded-lg border"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              className={getStatusColor(
                                                record.status,
                                              )}
                                            >
                                              {record.status === true
                                                ? "Allocated"
                                                : record.status === false
                                                  ? "Deallocated"
                                                  : ""}
                                            </Badge>
                                          </div>
                                          <span className="text-sm font-medium">
                                            {record.roleName || ""}
                                          </span>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="text-sm">
                                            <p>
                                              <span className="font-medium">
                                                User:
                                              </span>{" "}
                                              {record.firstName}{" "}
                                              {record.lastName}
                                            </p>
                                            <p>
                                              <span className="font-medium">
                                                Email:
                                              </span>{" "}
                                              {record.email}
                                            </p>
                                            <p>
                                              <span className="font-medium">
                                                Role:
                                              </span>{" "}
                                              {record.roleName}
                                            </p>
                                            <p>
                                              <span className="font-medium">
                                                Percentage:
                                              </span>{" "}
                                              {record.percentage}%
                                            </p>
                                            <p>
                                              <span className="font-medium">
                                                Period:
                                              </span>{" "}
                                              {formatDate(record.startDate)}{" "}
                                              to{" "}
                                              {formatDate(record.endDate)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">
                                  No allocation history available.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {}
    </div>
  );
};

export default ProjectAllocationHistory;

// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { Card, CardContent, CardHeader } from "../components/ui/Card";
// import { Button } from "../components/ui/Button";
// import { Badge } from "../components/ui/Badge";
// import {
//   ChevronLeft,
//   Users,
//   Calendar,
//   User,
//   Clock,
//   ArrowRight,
//   ChevronDown,
//   ChevronUp,
//   Search,
//   Filter,
//   ChevronRight,
// } from "lucide-react";
// import { useApp } from "../context/AppContext";
// import { getAllProjects } from "../api/projectget";
// import { Project } from "../types";
// import {
//   getProjectAllocationHistory,
//   getProjectAllocationHistoryByRole,
// } from "../api/projectAllocationHistory/projectAllocationHistory";
// import { getAllRoles } from "../api/role/viewrole";
// import * as Select from "@radix-ui/react-select";
// import { useAccessibleProjects } from "../api/useAccessibleProjects";
// import { formatDateTime } from "../utils/formatDateTime";
// import ProjectSelector from "../components/ui/ProjectSelector";

// interface AllocationRecord {
//   id: number;
//   percentage: number;
//   userFullName: string;
//   projectName: string;
//   roleName: string;
//   startDate: string;
//   endDate: string;
//   projectId: number;
//   userId: number;
//   roleId: number;
//   status: boolean;
//   allocationPercentage: number;
//   firstName: string;
//   email: string;
//   lastName: string;
// }

// interface ProjectAllocationHistory {
//   userId: number;
//   allocations: AllocationRecord[];
//   deallocations: AllocationRecord[];
// }

// interface Role {
//   id: string | number;
//   name?: string;
//   roleName: string;
//   description?: string;
//   permissions?: string[];
//   level?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// const ProjectAllocationHistory: React.FC = () => {
//   const navigate = useNavigate();
//   const { projectId } = useParams();
//   const {
//     selectedProjectId: contextProjectId,
//     setSelectedProjectId: setContextProjectId,
//   } = useApp();

//   const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
//     contextProjectId || null,
//   );

//   const [expandedUser, setExpandedUser] = useState<number | null>(null);
//   const [allocationHistory, setAllocationHistory] = useState<
//     ProjectAllocationHistory[]
//   >([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const scrollRef = React.useRef<HTMLDivElement>(null);

//   const [roleFilter, setRoleFilter] = useState<string>("all");
//   const [roles, setRoles] = useState<Role[]>([]);
//   const [rolesLoading, setRolesLoading] = useState(false);
//   const [rolesError, setRolesError] = useState<string | null>(null);

//   const { projects: accessibleProjects, switchProject } =
//     useAccessibleProjects();

//   useEffect(() => {
//     if (selectedProjectId) {
//       setLoading(true);

//       getProjectAllocationHistory(Number(selectedProjectId))
//         .then((response: any) => {
//           let historyData = [];

//           if (response?.data?.data && Array.isArray(response.data.data)) {
//             historyData = response.data.data;
//           } else if (response?.data && Array.isArray(response.data)) {
//             historyData = response.data;
//           } else if (Array.isArray(response)) {
//             historyData = response;
//           }

//           const mappedHistory = historyData.map((item: any) => ({
//             userId: item.employeeId || item.userId || item.id,
//             allocations: [
//               {
//                 id: item.id,
//                 firstName: item.firstName || "",
//                 lastName: item.lastName || "",
//                 email: item.email || "",
//                 roleName: item.roleName || "",
//                 roleId: item.roleId,
//                 percentage: item.allocationPercent || item.percentage || 0,
//                 startDate: item.startDate,
//                 endDate: item.endDate,
//                 status: item.status ?? true,
//               },
//             ],
//             deallocations: [],
//           }));

//           setAllocationHistory(mappedHistory);
//         })
//         .catch(() => {
//           setAllocationHistory([]);
//         })
//         .finally(() => setLoading(false));
//     }
//   }, [selectedProjectId]);
// useEffect(() => {
//     if (contextProjectId && contextProjectId !== selectedProjectId) {
//       setSelectedProjectId(contextProjectId);
//     }
//   }, [contextProjectId, selectedProjectId]);

//   useEffect(() => {
//     setRolesLoading(true);
//     getAllRoles()
//       .then((response: any) => {
//         let roleArray = [];
//         if (response?.data?.data && Array.isArray(response.data.data)) {
//           roleArray = response.data.data;
//         } else if (response?.data && Array.isArray(response.data)) {
//           roleArray = response.data;
//         } else if (Array.isArray(response)) {
//           roleArray = response;
//         } else {
//           roleArray = [];
//         }
//         setRoles(roleArray);
//       })
//       .catch((err) => {
//         setRolesError(err.message);
//         setRoles([]);
//       })
//       .finally(() => setRolesLoading(false));
//   }, []);

//   const currentProject = useMemo(
//     () =>
//       accessibleProjects.find(
//         (p) => String(p.id) === String(selectedProjectId),
//       ),
//     [selectedProjectId, accessibleProjects],
//   );
//   const scrollBy = (offset: number) => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
//     }
//   };

//   const getStatusColor = (status: boolean) => {
//     if (status === true) {
//       return "bg-green-100 text-green-800";
//     }
//     if (status === false) {
//       return "bg-red-100 text-red-800";
//     }
//     return "bg-gray-100 text-gray-800";
//   };

//   const getActionColor = (action: string) => {
//     switch (action) {
//       case "allocated":
//         return "bg-green-100 text-green-800";
//       case "deallocated":
//         return "bg-red-100 text-red-800";
//       case "percentage_changed":
//         return "bg-blue-100 text-blue-800";
//       case "role_changed":
//         return "bg-purple-100 text-purple-800";
//       case "period_changed":
//         return "bg-orange-100 text-orange-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const handleProjectSelect = (id: string) => {
//     switchProject(Number(id));

//     setSelectedProjectId(id);
//     setContextProjectId?.(id);

//     setExpandedUser(null);
//   };

//   const filteredAllocationHistory = useMemo(() => {
//     const term = searchTerm.trim().toLowerCase();

//     return allocationHistory.filter((user) => {
//       const records = [
//         ...(user.allocations || []),
//         ...(user.deallocations || []),
//       ];

//       const searchMatch =
//         !term ||
//         records.some((record) => {
//           const fullName =
//             `${record.firstName || ""} ${record.lastName || ""}`.toLowerCase();
//           const roleName = (record.roleName || "").toLowerCase();

//           return fullName.includes(term) || roleName.includes(term);
//         });

//       const roleMatch =
//         roleFilter === "all" ||
//         records.some((record) => String(record.roleId) === String(roleFilter));

//       return searchMatch && roleMatch;
//     });
//   }, [allocationHistory, searchTerm, roleFilter]);

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       {}
//       <div className="mb-6">
//         {}
//         <div className="mb-4 flex justify-end">
//           <Button
//             variant="secondary"
//             onClick={() =>
//               navigate(`/projects/${projectId}/project-management`)
//             }
//             className="flex items-center"
//           >
//             <ChevronLeft className="w-5 h-5 mr-2" /> Back
//           </Button>
//         </div>
//         <div className="flex items-center gap-3">
//           <Users className="w-8 h-8 text-blue-500" />
//           <h1 className="text-3xl font-bold text-gray-900">
//             Project Allocation History
//           </h1>
//         </div>
//         <p className="text-gray-600 mt-2">
//           Track project-level user allocations and movements
//         </p>
//       </div>

//       {}
//       {}
//       <ProjectSelector
//         projects={accessibleProjects}
//         selectedProjectId={selectedProjectId}
//         onSelect={(id, project) => {
//           handleProjectSelect(id);
//         }}
//       />
//       {}

//       <Card className="mb-6">
//         <CardContent className="p-4">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <input
//                   type="text"
//                   placeholder="Search users by name, or role..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//             </div>
//             <div className="flex items-center gap-2 min-w-[220px]">
//               <Filter className="w-4 h-4 text-gray-400" />
//               <div className="w-full">
//                 <Select.Root value={roleFilter} onValueChange={setRoleFilter}>
//                   <Select.Trigger
//                     className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full flex items-center justify-between"
//                     aria-label="Role"
//                   >
//                     <Select.Value placeholder="All Roles" />
//                     <Select.Icon>
//                       <ChevronDown className="w-4 h-4" />
//                     </Select.Icon>
//                   </Select.Trigger>
//                   <Select.Portal>
//                     <Select.Content
//                       position="popper"
//                       sideOffset={4}
//                       className="bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[220px]"
//                       style={{ position: "fixed" }}
//                     >
//                       <Select.Viewport>
//                         <Select.Item
//                           value="all"
//                           className="pl-4 pr-8 py-2 flex items-center cursor-pointer data-[state=checked]:bg-blue-100"
//                         >
//                           <Select.ItemText>All Roles</Select.ItemText>
//                         </Select.Item>
//                         {[
//                           ...new Map(
//                             allocationHistory.flatMap((user) =>
//                               (user.allocations || []).map((a) => [
//                                 a.roleId,
//                                 {
//                                   id: a.roleId,
//                                   roleName: a.roleName,
//                                 },
//                               ]),
//                             ),
//                           ).values(),
//                         ].map((r: any) => (
//                           <Select.Item
//                             key={r.id}
//                             value={String(r.id)}
//                             className="pl-4 pr-8 py-2 flex items-center cursor-pointer data-[state=checked]:bg-blue-100"
//                           >
//                             <Select.ItemText>{r.roleName}</Select.ItemText>
//                           </Select.Item>
//                         ))}
//                       </Select.Viewport>
//                     </Select.Content>
//                   </Select.Portal>
//                 </Select.Root>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {}
//       <Card>
//         <CardHeader>
//           <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
//             <Users className="w-5 h-5" />
//             Project Allocation History
//             {selectedProjectId && (
//               <span className="text-sm font-normal text-gray-600">
//                 - {currentProject?.projectName || currentProject?.name}
//               </span>
//             )}
//           </h3>
//         </CardHeader>
//         <CardContent>
//           {Array.isArray(filteredAllocationHistory) &&
//           filteredAllocationHistory.length === 0 ? (
//             <div className="text-center py-8 text-gray-500">
//               <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
//               <p>No users found matching the selected criteria.</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {Array.isArray(filteredAllocationHistory) &&
//                 filteredAllocationHistory.map((user, userIdx) => {
//                   const isExpanded = expandedUser === user.userId;
//                   return (
//                     <Card
//                       key={user.userId + "-" + userIdx}
//                       className="border border-gray-200"
//                     >
//                       <CardContent className="p-0">
//                         {}
//                         {user &&
//                           Array.isArray(user.allocations) &&
//                           user.allocations.length > 0 && (
//                             <div
//                               key={user.userId + "-" + user.allocations[0].id}
//                               className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
//                               onClick={() =>
//                                 setExpandedUser(isExpanded ? null : user.userId)
//                               }
//                             >
//                               <div className="flex items-center justify-between">
//                                 <div className="flex items-center gap-4">
//                                   <div className="flex items-center gap-2">
//                                     {isExpanded ? (
//                                       <ChevronUp className="w-4 h-4 text-gray-400" />
//                                     ) : (
//                                       <ChevronDown className="w-4 h-4 text-gray-400" />
//                                     )}
//                                     <User className="w-5 h-5 text-blue-500" />
//                                   </div>
//                                   <div>
//                                     <h4 className="font-semibold text-gray-900">
//                                       {user.allocations[0].firstName}{" "}
//                                       {user.allocations[0].lastName}
//                                     </h4>
//                                   </div>
//                                 </div>
//                               </div>
//                               <div>
//                                 <div className="flex items-center gap-4">
//                                   <div className="text-right">
//                                     <p className="text-sm font-medium text-gray-900">
//                                       {user.allocations[0].roleName}
//                                     </p>
//                                     <p className="text-xs text-gray-600">
//                                       {user.allocations[0].percentage}%
//                                       allocated
//                                     </p>
//                                     <p className="text-xs text-gray-500">
//                                       {user.allocations[0].startDate &&
//                                       user.allocations[0].endDate
//                                         ? `${new Date(user.allocations[0].startDate).toLocaleDateString()} to ${new Date(user.allocations[0].endDate).toLocaleDateString()}`
//                                         : "No period set"}
//                                     </p>
//                                   </div>
//                                   <Badge
//                                     className={getStatusColor(
//                                       user.allocations[0].status,
//                                     )}
//                                   >
//                                     {user.allocations[0].status === true
//                                       ? "Allocated"
//                                       : user.allocations[0].status === false
//                                         ? "Deallocated"
//                                         : ""}
//                                   </Badge>
//                                 </div>
//                               </div>
//                             </div>
//                           )}

//                         {}
//                         {isExpanded && (
//                           <div className="border-t border-gray-200 bg-gray-50">
//                             <div className="p-4">
//                               <h5 className="font-semibold text-gray-900 mb-3">
//                                 Allocation History
//                               </h5>
//                               {(user.allocations &&
//                                 user.allocations.length > 0) ||
//                               (user.deallocations &&
//                                 user.deallocations.length > 0) ? (
//                                 <div className="space-y-3">
//                                   {[
//                                     ...(user.allocations || []),
//                                     ...(user.deallocations || []),
//                                   ]
//                                     .sort(
//                                       (a, b) =>
//                                         new Date(a.startDate).getTime() -
//                                         new Date(b.startDate).getTime(),
//                                     )
//                                     .map((record, idx) => (
//                                       <div
//                                         key={
//                                           user.userId +
//                                           "-" +
//                                           record.id +
//                                           "-" +
//                                           idx
//                                         }
//                                         className="bg-white p-3 rounded-lg border"
//                                       >
//                                         <div className="flex items-center justify-between mb-2">
//                                           <div className="flex items-center gap-2">
//                                             <Badge
//                                               className={getStatusColor(
//                                                 record.status,
//                                               )}
//                                             >
//                                               {record.status === true
//                                                 ? "Allocated"
//                                                 : record.status === false
//                                                   ? "Deallocated"
//                                                   : ""}
//                                             </Badge>
//                                           </div>
//                                           <span className="text-sm font-medium">
//                                             {record.roleName || ""}
//                                           </span>
//                                         </div>
//                                         <div className="space-y-2">
//                                           <div className="text-sm">
//                                             <p>
//                                               <span className="font-medium">
//                                                 User:
//                                               </span>{" "}
//                                               {record.firstName}{" "}
//                                               {record.lastName}
//                                             </p>
//                                             <p>
//                                               <span className="font-medium">
//                                                 Email:
//                                               </span>{" "}
//                                               {record.email}
//                                             </p>
//                                             <p>
//                                               <span className="font-medium">
//                                                 Role:
//                                               </span>{" "}
//                                               {record.roleName}
//                                             </p>
//                                             <p>
//                                               <span className="font-medium">
//                                                 Percentage:
//                                               </span>{" "}
//                                               {record.percentage}%
//                                             </p>
//                                             <p>
//                                               <span className="font-medium">
//                                                 Period:
//                                               </span>{" "}
//                                               {formatDateTime(record.startDate)}{" "}
//                                               to{" "}
//                                               {formatDateTime(record.endDate)}
//                                             </p>
//                                           </div>
//                                         </div>
//                                       </div>
//                                     ))}
//                                 </div>
//                               ) : (
//                                 <p className="text-gray-500 text-sm">
//                                   No allocation history available.
//                                 </p>
//                               )}
//                             </div>
//                           </div>
//                         )}
//                       </CardContent>
//                     </Card>
//                   );
//                 })}
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {}
//     </div>
//   );
// };

// export default ProjectAllocationHistory;
