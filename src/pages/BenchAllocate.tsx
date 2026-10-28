import React, { useState, useMemo, useEffect, useRef } from "react";
import { extractErrorMessage } from "../lib/errorUtils";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  User,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
  Calendar,
  Briefcase,
  Percent,
} from "lucide-react";

import { Modal } from "../components/ui/Modal";

import { Button } from "../components/ui/Button";

import { Input } from "../components/ui/Input";

import { Badge } from "../components/ui/Badge";

import { DonutChart } from "../components/ui/DonutChart";

import { useApp } from "../context/AppContext";

import { EmployeeDetailsCard } from "../components/ui/EmployeeDetailsCard";

import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "../components/ui/Card";

import {
  getBenchList,
  getEmployeeDetails,
  getEmployeeProjectHistory,
  getBenchAvailability,
} from "../api/bench/bench";

import type { BenchSearchParams } from "../api/bench/filterbench";
// import { ENDPOINTS } from "../utils/endpoints";
import type { getBench } from "../api/bench/bench";

import { Employee } from "../types/index";

import {
  postProjectAllocations,
  getProjectAllocationsById,
  updateProjectAllocation,
  deleteProjectAllocation,
  filterProjectAllocations,
  getMaxAvailablePercentage,
  getViewAllocations,
} from "../api/bench/projectAllocation";

import { getAllProjects } from "../api/projectget";

import { Project } from "../types";

import { ProjectSelector } from "../components/ui/ProjectSelector";

import { getAllRoles } from "../api/role/viewrole";

import { Toast } from "../components/ui/Toast";

import { SearchableMultiSelect } from "../components/ui/SearchableMultiSelect";

import { SearchableSelect } from "../components/ui/SearchableSelect";


import {
  getDesignations,
  DesignationGetResponse,
} from "../api/designation/designation";
import { usePermission } from "../context/PermissionContext";

function AllocationPopover({
  employee,
  anchorRef,
  onClose,
  isLoading,
}: {
  employee: any;
  anchorRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
  isLoading?: boolean;
}) {
  React.useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, [anchorRef, onClose]);

  const availablePeriods = Array.isArray(employee?.availablePeriods)
    ? employee.availablePeriods
    : [];

  if (!employee) return null;

  const employeeDetails = employee.employeeDetails;
  let style: React.CSSProperties = { display: "none" };

  if (anchorRef.current) {
    const rect = anchorRef.current.getBoundingClientRect();

    style = {
      position: "absolute",

      left: rect.left + window.scrollX,

      top: rect.bottom + window.scrollY + 4,

      zIndex: 1000,

      minWidth: 320,

      background: "white",

      borderRadius: "0.5rem",

      boxShadow: "0 4px 24px 0 rgba(0,0,0,0.12)",

      border: "1px solid #e5e7eb",
    };
  } else {
    style = {
      position: "absolute",

      left: 0,

      top: 40,

      zIndex: 1000,

      minWidth: 320,

      background: "white",

      borderRadius: "0.5rem",

      boxShadow: "0 4px 24px 0 rgba(0,0,0,0.12)",

      border: "1px solid #e5e7eb",
    };
  }

  return (
    <div style={style}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-lg">
            {employee.firstName} {employee.lastName}
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-xl font-bold p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="Close popup"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>

            <span className="ml-2 text-gray-500">Loading allocations...</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-semibold">Project</th>

                <th className="text-left py-2 px-3 font-semibold">Period</th>

                <th className="text-left py-2 px-3 font-semibold">
                  Allocated %
                </th>
              </tr>
            </thead>

            <tbody>
              {availablePeriods.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-400 py-2">
                    No allocations found
                  </td>
                </tr>
              ) : (
                availablePeriods.map((period: any, idx: number) => (
                  <tr
                    key={`${period.project || ""}-${period.period || ""}-${idx}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="py-1 px-3">{period.project}</td>

                    <td className="py-1 px-3">
                      {(() => {
                        const val = period.period;
                        if (!val) return "Not Allocated";
                        if (
                          typeof val === "string" &&
                          (val.toLowerCase() === "immediate" ||
                            val.toLowerCase().includes("not allocated") ||
                            val.toLowerCase().includes("no project"))
                        ) {
                          return val;
                        }
                        const d = new Date(val);
                        if (!isNaN(d.getTime())) {
                          return d.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          });
                        }
                        return val;
                      })()}
                    </td>


                    <td className="py-1 px-3">{period.percentage}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function BenchAllocate() {
  const {
    selectedProjectId: contextProjectId,
    setSelectedProjectId: setContextProjectId,
    updateEmployee,
  } = useApp();

  const navigate = useNavigate();
  const { can } = usePermission();

  const [projects, setProjects] = useState<Project[]>([]);

  const [projectsLoading, setProjectsLoading] = useState(false);

  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    contextProjectId || null,
  );

  const [employee, setEmployees] = useState<Employee[]>([]);

  const [benchFilter, setBenchFilter] = useState("");

  const [designationFilter, setDesignationFilter] = useState<string[]>([]);

  const [availabilityFilter, setAvailabilityFilter] = useState<number[]>([]);

  const [fromDateFilter, setFromDateFilter] = useState("");

  const [toDateFilter, setToDateFilter] = useState("");

  const [isSearching, setIsSearching] = useState(false);

  const [isProjectFiltering, setIsProjectFiltering] = useState(false);

  const [selectedBench, setSelectedBench] = useState<string[]>([]);

  // Keep the selected employee records separate from the page currently shown.
  // The bench list is server-paginated, so `employee` only contains one page.
  const [selectedBenchEmployees, setSelectedBenchEmployees] = useState<
    Record<string, Employee>
  >({});

  const [selectedProjectUsers, setSelectedProjectUsers] = useState<string[]>(
    [],
  );

  const [allocationModal, setAllocationModal] = useState<{
    open: boolean;
    employee: any[];
  }>({ open: false, employee: [] });

  const [deallocationFilter, setDeallocationFilter] = useState("");

  const [deallocationRoleFilter, setDeallocationRoleFilter] = useState<
    string[]
  >([]);
  const [deallocationAvailabilityFilter, setDeallocationAvailabilityFilter] =
    useState<string>("");

  const [projectAllocations, setProjectAllocations] = useState<{
    [projectId: string]: any[];
  }>({});

  const [hoveredEmployee, setHoveredEmployee] = useState<any | null>(null);

  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [viewInfoEmployee, setViewInfoEmployee] = useState<any | null>(null);

  const [isLoadingEmployeeDetails, setIsLoadingEmployeeDetails] = useState<{
    [employeeId: string]: boolean;
  }>({});

  const [isAllocating, setIsAllocating] = useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const [roles, setRoles] = useState<{ roleId: number; roleName: string }[]>([]);

  const [rolesLoading, setRolesLoading] = useState(false);
  const [deallocationConfirmModal, setDeallocationConfirmModal] =
    useState(false);

  const [isDeallocating, setIsDeallocating] = useState(false);

  const [allocationConfirmModal, setAllocationConfirmModal] = useState(false);

  const [allocationSuccessModal, setAllocationSuccessModal] = useState(false);

  const [alertModal, setAlertModal] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });

  const [dateValidationErrors, setDateValidationErrors] = useState<{
    [employeeId: string]: { startDate?: string; endDate?: string };
  }>({});

  const [designations, setDesignations] = useState<
    { designationId: number; designationName: string }[]
  >([]);

  const [designationsLoading, setDesignationsLoading] = useState(false);

  const [toast, setToast] = useState<{
    isOpen: boolean;

    message: string;

    type: "success" | "error";
  }>({
    isOpen: false,

    message: "",

    type: "success",
  });

  const [maxAvailabilityMap, setMaxAvailabilityMap] = useState<{
    [employeeId: string]: number;
  }>({});

  const [isLoadingMaxAvailability, setIsLoadingMaxAvailability] = useState<{
    [employeeId: string]: boolean;
  }>({});

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ isOpen: true, message, type });
  };

  function isDateMatched(
    availabilityPeriod: string,
    fromDate: string,
    toDate: string,
  ) {
    if (!fromDate && !toDate) return true;
    if (!availabilityPeriod) return false;

    const availableDate = new Date(availabilityPeriod);
    if (isNaN(availableDate.getTime())) return false;

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (from && availableDate < from) return false;
    if (to && availableDate > to) return false;

    return true;
  }

  const [benchCurrentPage, setBenchCurrentPage] = useState(1);
  const benchPageSize = 5;

  const [allocatedCurrentPage, setAllocatedCurrentPage] = useState(1);
  const allocatedPageSize = 5;

  const [expandedBenchUserId, setExpandedBenchUserId] = useState<string | null>(
    null,
  );

  const [openAllocationUserId, setOpenAllocationUserId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (contextProjectId && contextProjectId !== selectedProjectId) {
      setSelectedProjectId(contextProjectId);
    }
  }, [contextProjectId, selectedProjectId]);

  useEffect(() => {
    setProjectsLoading(true);

    getAllProjects()
      .then((data: any) => {
        let projectsArray = Array.isArray(data)
          ? data
          : data && Array.isArray(data.data)
            ? data.data
            : [];

        setProjects(projectsArray);

        setProjectsError(null);

        if (!selectedProjectId && projectsArray.length > 0) {
          const firstActiveProject = projectsArray.find(
            (p: Project) => p.status === "active",
          );

          if (firstActiveProject) {
            setSelectedProjectId(firstActiveProject.id);
          }
        }
      })

      .catch((err) => {
        setProjectsError(err.message);
      })

      .finally(() => setProjectsLoading(false));
  }, []);



  const getBenchFilters = (searchParams: BenchSearchParams = {}) => {
    const filters: any = { ...searchParams };
    if (designationFilter.length > 0) filters.designation = designationFilter[0];
    if (availabilityFilter.length > 0) filters.minAvailable = availabilityFilter[0];
    if (fromDateFilter) filters.startDate = fromDateFilter;
    if (toDateFilter) filters.endDate = toDateFilter;

    if (!filters.name && searchParams.firstName) {
      filters.name = searchParams.firstName;
    }

    return filters;
  };

  const mapBenchEmployee = (item: any): Employee => {
    const fullName = (item.employeeName || "").trim();
    const [firstName, ...rest] = fullName.split(/\s+/);

    return {
      id: String(item.empId ?? item.id ?? ""),
      firstName: firstName || "",
      lastName: rest.join(" ") || "",
      email: item.email || "",
      phone: item.contactNo || item.phoneNo || "",
      designation: item.designationName || "",
      availability:
        typeof item.availablePercentage === "number" ? item.availablePercentage : 0,
      availabilityPeriod: item.availablePeriod || "",
      status: "active",
    };
  };

  const fetchBenchEmployees = async (
    searchParams: BenchSearchParams = {},
  ) => {
    setIsSearching(true);
    try {
      const filters = getBenchFilters(searchParams);

      const response = await getBenchAvailability(0, 1000, filters);

      const pageData = response?.data ?? response;
      const benchData: any[] = Array.isArray(pageData?.content)
        ? pageData.content
        : Array.isArray(pageData)
          ? pageData
          : [];

      const mappedEmployees = benchData.map(mapBenchEmployee);

      setEmployees(mappedEmployees);
      return mappedEmployees;
    } catch (error) {
      setEmployees([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const refreshBenchEmployeesAfterMutation = async () => {
    await fetchBenchEmployees();
  };

  const handleBenchPageChange = (newPage: number) => {
    setBenchCurrentPage(newPage);
  };

  useEffect(() => {
    fetchBenchEmployees();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const fetchAllocations = async () => {
        try {
          const response = await getProjectAllocationsById(selectedProjectId);
          let allocations = [];
          if (response?.data?.data && Array.isArray(response.data.data)) {
            allocations = response.data.data;
          } else if (response?.data && Array.isArray(response.data)) {
            allocations = response.data;
          } else if (Array.isArray(response)) {
            allocations = response;
          } else if (
            response?.data?.content &&
            Array.isArray(response.data.content)
          ) {
            allocations = response.data.content;
          }
          const mappedAllocations = allocations.map((alloc: any) => ({
            id: alloc.benchAllocationId ?? alloc.benchId ?? alloc.id,
            employeeId: alloc.empId ?? alloc.employeeId ?? alloc.employee?.empId ?? alloc.employee?.id ?? alloc.userId,
            userId: alloc.empId ?? alloc.userId ?? alloc.employee?.empId ?? alloc.employee?.id,
            userFullName:
              alloc.userFullName ||
              (alloc.firstName
                ? `${alloc.firstName} ${alloc.lastName}`
                : alloc.employee?.firstName
                  ? `${alloc.employee.firstName} ${alloc.employee.lastName}`
                  : "Unknown"),
            firstName: alloc.firstName || alloc.employee?.firstName || "",
            lastName: alloc.lastName || alloc.employee?.lastName || "",
            roleName: alloc.roleName || alloc.roleType || alloc.role?.roleName || alloc.role?.name || "",
            allocationPercentage:
              alloc.allocationPercent ??
              alloc.allocationPercentage ??
              alloc.allocatedPercentage ??
              alloc.availability ??
              0,
            startDate: alloc.startDate,
            endDate: alloc.endDate,
            roleId: alloc.roleId || alloc.role?.roleId || alloc.role?.id,
          }));

          setProjectAllocations((prev) => ({
            ...prev,
            [selectedProjectId]: mappedAllocations,
          }));
        } catch (error) {
          setProjectAllocations((prev) => ({
            ...prev,
            [selectedProjectId]: [],
          }));
        }
      };

      fetchAllocations();
    }
  }, [selectedProjectId]);



  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const response = await getAllRoles();
      let rolesArray = [];

      if (
        response?.data?.data?.content &&
        Array.isArray(response.data.data.content)
      ) {
        rolesArray = response.data.data.content;
      } else if (
        response?.data?.content &&
        Array.isArray(response.data.content)
      ) {
        rolesArray = response.data.content;
      } else if (response?.content && Array.isArray(response.content)) {
        rolesArray = response.content;
      } else if (Array.isArray(response)) {
        rolesArray = response;
      }

      const formattedRoles = rolesArray.map((role: any) => ({
        roleId: Number(role.id ?? role.roleId),
        roleName: role.roleName ?? role.name ?? "",
        name: role.roleName ?? role.name ?? "",
      }));

      setRoles(formattedRoles);
    } catch (error) {
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    setDesignationsLoading(true);

    getDesignations()
      .then((response: any) => {
        const designationsArray = Array.isArray(response.data?.content)
          ? response.data.content
          : [];

        setDesignations(designationsArray);
      })
      .catch((error) => {
        setDesignations([]);
      })
      .finally(() => setDesignationsLoading(false));
  }, []);

  const debouncedNameSearch = useMemo(() => {
    let timeoutId: number;
    return (searchTerm: string) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setBenchFilter(searchTerm);
        setBenchCurrentPage(1);
      }, 100);
    };
  }, []);

  const debouncedAvailabilitySearch = useMemo(() => {
    let timeoutId: number;

    return (availability: string) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        const availabilityNumber = parseInt(availability.trim());
        if (!isNaN(availabilityNumber)) {
          setAvailabilityFilter([availabilityNumber]);
        } else {
          setAvailabilityFilter([]);
        }
        setBenchCurrentPage(1);
      }, 100);
    };
  }, []);

  const debouncedDateSearch = useMemo(() => {
    let timeoutId: number;

    return (fromDate: string, toDate: string) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        setFromDateFilter(fromDate.trim());
        setToDateFilter(toDate.trim());
        setBenchCurrentPage(1);
      }, 30);
    };
  }, []);

  const debouncedProjectNameSearch = useMemo(() => {
    let timeoutId: number;

    return (searchTerm: string) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        if (searchTerm.trim()) {
          setIsProjectFiltering(true);
          setDeallocationFilter(searchTerm.trim());
        } else {
          setDeallocationFilter("");
        }

        setIsProjectFiltering(false);
      }, 30);
    };
  }, []);

  const debouncedProjectRoleSearch = useMemo(() => {
    let timeoutId: number;

    return (roles: string[]) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        if (roles.length > 0) {
          setIsProjectFiltering(true);
          setDeallocationRoleFilter(roles);
        } else {
          setDeallocationRoleFilter([]);
        }

        setIsProjectFiltering(false);
      }, 100);
    };
  }, []);

  const debouncedProjectAvailabilitySearch = useMemo(() => {
    let timeoutId: number;

    return (availability: string) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        if (
          availability.trim() &&
          availability !== "All Availability" &&
          availability !== ""
        ) {
          setIsProjectFiltering(true);
          setDeallocationAvailabilityFilter(availability.trim());
        } else {
          setDeallocationAvailabilityFilter("");
        }

        setIsProjectFiltering(false);
      }, 100);
    };
  }, []);

  const handleAvailabilityChange = (value: string) => {
    const availability = value ? parseInt(value) : 0;

    setAvailabilityFilter(value ? [availability] : []);
    setBenchCurrentPage(1);
  };

  const handleBenchFilterChange = (value: string) => {
    setBenchFilter(value);
    setBenchCurrentPage(1);
  };

  const handleFromDateChange = (value: string) => {
    setFromDateFilter(value);
    setBenchCurrentPage(1);
  };

  const handleToDateChange = (value: string) => {
    setToDateFilter(value);
    setBenchCurrentPage(1);
  };

  const getAllocationAvailabilityValue = (emp: any) => {
    const value = Number(
      emp?.allocationAvailability ??
      emp?.availability ??
      emp?.allocationPercentage ??
      0,
    );

    return Number.isFinite(value) ? value : 0;
  };

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);

    setContextProjectId?.(id);
  };

  const handleBenchSelect = (selectedEmployee: Employee) => {
    const id = selectedEmployee.id;
    setSelectedBench((sel) => {
      const newSel = sel.includes(id)
        ? sel.filter((i) => i !== id)
        : [...sel, id];

      if (newSel.length > 0) setSelectedProjectUsers([]);

      return newSel;
    });
    setSelectedBenchEmployees((selected) => {
      if (selected[id]) {
        const { [id]: _removed, ...remaining } = selected;
        return remaining;
      }

      return { ...selected, [id]: selectedEmployee };
    });
  };

  const handleProjectUserSelect = (id: string) => {
    setSelectedProjectUsers((sel) => {
      const newSel = sel.includes(id)
        ? sel.filter((i) => i !== id)
        : [...sel, id];

      if (newSel.length > 0) {
        setSelectedBench([]);
        setSelectedBenchEmployees({});
      }

      return newSel;
    });
  };

  const availableProjects = useMemo(
    () => projects.filter((p) => p.status === "active"),
    [projects],
  );

  const currentProject = useMemo(() => {
    const project = projects.find(
      (p) => String(p.id) === String(selectedProjectId),
    );

    if (project) {
    }

    return project;
  }, [selectedProjectId, projects]);

  const benchEmployees = useMemo(() => {
    return employee
      .filter((e) => e.availability > 0)
      .map((e) => ({ ...e, availability: e.availability }));
  }, [employee]);

  const filteredBench = useMemo(() => {
    let filtered = benchEmployees;

    if (benchFilter.trim()) {
      const filter = benchFilter.trim().toLowerCase();
      filtered = filtered.filter((e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(filter),
      );
    }

    if (designationFilter.length > 0) {
      filtered = filtered.filter(
        (e) => designationFilter.includes(e.designation) && e.availability > 0,
      );
    }

    if (availabilityFilter.length > 0) {
      filtered = filtered.filter(
        (e) => e.availability >= availabilityFilter[0],
      );
    }

    if (fromDateFilter || toDateFilter) {
      filtered = filtered.filter((e) =>
        isDateMatched(e.availabilityPeriod, fromDateFilter, toDateFilter),
      );
    }

    return filtered.sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
      ),
    );
  }, [
    benchEmployees,
    benchFilter,
    designationFilter,
    availabilityFilter,
    fromDateFilter,
    toDateFilter,
  ]);

  // const allocatedEmployees = useMemo(
  //   () =>
  //     selectedProjectId
  //       ? (projectAllocations[selectedProjectId] || []).filter(
  //           (emp: any) => emp.roleId !== 2,
  //         )
  //       : [],
  //   [projectAllocations, selectedProjectId],
  // );
  const allocatedEmployees = useMemo(
    () =>
      selectedProjectId
        ? (projectAllocations[selectedProjectId] || [])
        : [],
    [projectAllocations, selectedProjectId],
  );

  const projectRoleOptions = useMemo(() => {
    const uniqueRoles = new Set<string>();

    allocatedEmployees.forEach((emp: any) => {
      if (emp.roleName) {
        uniqueRoles.add(emp.roleName);
      }
    });

    return Array.from(uniqueRoles)
      .sort()
      .map((role) => ({
        value: role,
        label: role,
      }));
  }, [allocatedEmployees]);

  const filteredAllocatedEmployees = useMemo(() => {
    const search = deallocationFilter.trim().toLowerCase();

    const filtered = allocatedEmployees.filter((emp: any) => {
      const name = emp.userFullName?.toLowerCase() || "";
      const role = emp.roleName?.toLowerCase() || "";

      const matchesSearch =
        !search || name.includes(search) || role.includes(search);

      const matchesRole =
        deallocationRoleFilter.length === 0 ||
        deallocationRoleFilter.includes(emp.roleName);

      let matchesAvailability = true;

      const allocatedPercent = Number(emp.allocationPercentage || 0);

      if (deallocationAvailabilityFilter === "100") {
        matchesAvailability = allocatedPercent === 100;
      } else if (deallocationAvailabilityFilter === "75") {
        matchesAvailability = allocatedPercent >= 75;
      } else if (deallocationAvailabilityFilter === "50") {
        matchesAvailability = allocatedPercent >= 50;
      } else if (deallocationAvailabilityFilter === "below50") {
        matchesAvailability = allocatedPercent < 50;
      }

      return matchesSearch && matchesRole && matchesAvailability;
    });

    return filtered.sort((a: any, b: any) =>
      (a.userFullName || "").localeCompare(b.userFullName || ""),
    );
  }, [
    allocatedEmployees,
    deallocationFilter,
    deallocationRoleFilter,
    deallocationAvailabilityFilter,
  ]);

  const benchTotalPages = Math.ceil(filteredBench.length / benchPageSize);

  const paginatedBenchEmployees = filteredBench.slice(
    (benchCurrentPage - 1) * benchPageSize,
    benchCurrentPage * benchPageSize,
  );

  const allocatedTotalPages = Math.ceil(
    filteredAllocatedEmployees.length / allocatedPageSize,
  );

  const paginatedAllocatedEmployees = filteredAllocatedEmployees.slice(
    (allocatedCurrentPage - 1) * allocatedPageSize,
    allocatedCurrentPage * allocatedPageSize,
  );

  useEffect(() => {
    const maxPage = Math.max(1, benchTotalPages);
    if (benchCurrentPage > maxPage) {
      setBenchCurrentPage(maxPage);
    }
  }, [benchTotalPages, benchCurrentPage]);

  useEffect(() => {
    setBenchCurrentPage(1);
  }, [
    benchFilter,
    designationFilter,
    availabilityFilter,
    fromDateFilter,
    toDateFilter,
  ]);

  useEffect(() => {
    setAllocatedCurrentPage(1);
  }, [
    deallocationFilter,
    deallocationRoleFilter,
    deallocationAvailabilityFilter,
  ]);

  const handleAllocate = () => {
    const toAllocate = Object.values(selectedBenchEmployees);

    if (toAllocate.length === 0) {
      showToast("Please select employee to allocate", "error");

      return;
    }

    setAllocationModal({ open: true, employee: toAllocate });
  };

  const handleConfirmAllocation = async (updatedEmployees: any[]) => {
    if (!selectedProjectId) {
      showToast("Please select a project first", "error");
      return;
    }

    const validationErrors: string[] = [];

    for (const emp of updatedEmployees) {
      const name = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || "Employee";

      if (!emp.roleId || Number(emp.roleId) <= 0) {
        validationErrors.push(`${name}: please select a role`);
      }

      if (!emp.allocationStartDate || !emp.allocationEndDate) {
        validationErrors.push(`${name}: start and end date are required`);
      } else {
        const isValid = validateAllocationDates(
          String(emp.id ?? emp.employeeId ?? emp.userId ?? emp.empId ?? ""),
          emp.allocationStartDate,
          emp.allocationEndDate,
        );

        if (!isValid) {
          validationErrors.push(`${name}: invalid date range`);
        }
      }

      const availabilityValue = Number(
        emp.allocationAvailability ?? emp.availability ?? 0,
      );

      if (
        !Number.isFinite(availabilityValue) ||
        availabilityValue <= 0 ||
        availabilityValue > 100
      ) {
        validationErrors.push(`${name}: availability must be between 1 and 100`);
      }
    }

    if (validationErrors.length > 0) {
      showToast(validationErrors.join(" | "), "error");
      return;
    }

    setIsAllocating(true);

    try {
      const allocationErrors: string[] = [];
      const allocatedEmployeeIds: string[] = [];

      for (const emp of updatedEmployees) {
        const employeeId = Number(
          emp.employeeId ?? emp.userId ?? emp.empId ?? emp.id ?? 0,
        );

        if (!employeeId || employeeId <= 0) {
          
          allocationErrors.push(`${emp.firstName ?? "Employee"}: employee id not found`);
          continue;
        }

        const roleId = Number(emp.roleId);
        const availabilityValue = Number(
          emp.allocationAvailability ?? emp.availability ?? 0,
        );

        const payload = {
          empId: employeeId,
          projectId: Number(selectedProjectId),
          roleId,
          availability: availabilityValue,
          startDate: emp.allocationStartDate,
          endDate: emp.allocationEndDate,
        };

        try {
          if (emp.allocationId) {
            await updateProjectAllocation(emp.allocationId, payload);
          } else {
            await postProjectAllocations(payload);
          }
          allocatedEmployeeIds.push(String(employeeId));
        } catch (error: any) {
          console.error("Allocation error:", error?.response?.data || error);

         const responseData = error?.response?.data;

const backendError =
  responseData?.data?.[0]?.message ||
  responseData?.data?.[0]?.errorMessage ||
  responseData?.message ||
  responseData?.statusMessage ||
  responseData?.error ||
  responseData?.errors;

const errorMessage = Array.isArray(backendError)
  ? backendError
      .map((item) => item?.message || item?.errorMessage || item)
      .join(", ")
  : backendError || extractErrorMessage(error);
          allocationErrors.push(
            `${emp.firstName ?? "Employee"}: ${errorMessage}`,
          );
        }
      }

      if (allocationErrors.length > 0) {
        // Some requests may have succeeded before another one failed. Refresh
        // the available list and remove only those successful selections.
        if (allocatedEmployeeIds.length > 0) {
          const allocatedIds = new Set(allocatedEmployeeIds);
          await refreshBenchEmployeesAfterMutation();
          setSelectedBench((selected) =>
            selected.filter((id) => !allocatedIds.has(id)),
          );
          setSelectedBenchEmployees((selected) => {
            const remaining: Record<string, Employee> = {};
            Object.entries(selected).forEach(([id, selectedEmployee]) => {
              if (!allocatedIds.has(id)) remaining[id] = selectedEmployee;
            });
            return remaining;
          });
        }
        showToast(`Failed: ${allocationErrors.join(", ")}`, "error");
      } else {
        setAllocationSuccessModal(true);
        await refreshBenchEmployeesAfterMutation();
        await refreshProjectAllocations();
        setSelectedBench([]);
        setSelectedBenchEmployees({});
        setAllocationModal({ open: false, employee: [] });
      }
    } catch (error: any) {
      console.error("Allocation refresh error:", error);

      
      showToast(
        error?.response?.data?.message ||
        error?.response?.data?.statusMessage ||
        error?.message ||
        "Failed to allocate employee",
        "error",
      );
    } finally {
      setIsAllocating(false);
    }
  };

  ///////////////////


  // ---- validate every row before sending anything ----




  const refreshProjectAllocations = async () => {
    if (!selectedProjectId) return;

    try {
      const response = await getProjectAllocationsById(selectedProjectId);
      let allocations = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        allocations = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        allocations = response.data;
      } else if (Array.isArray(response)) {
        allocations = response;
      } else if (
        response?.data?.content &&
        Array.isArray(response.data.content)
      ) {
        allocations = response.data.content;
      }
      const mappedAllocations = allocations.map((alloc: any) => ({
        id: alloc.benchAllocationId ?? alloc.id,
        employeeId: alloc.employeeId ?? alloc.employee?.id ?? alloc.userId,
        userId: alloc.userId ?? alloc.employee?.id,
        userFullName:
          alloc.userFullName ||
          (alloc.firstName ? `${alloc.firstName} ${alloc.lastName}` : ""),
        firstName: alloc.firstName || "",
        lastName: alloc.lastName || "",
        roleName: alloc.roleName || alloc.role?.roleName || "",
        allocationPercentage:
          alloc.allocationPercent ??
          alloc.allocationPercentage ??
          alloc.allocatedPercentage ??
          alloc.availability ??
          0,
        startDate: alloc.startDate,
        endDate: alloc.endDate,
        //employeeId: alloc.employeeId || alloc.employee?.id,
        roleId: alloc.roleId || alloc.role?.id,
        //userId: alloc.userId || alloc.employee?.id,
      }));
      setProjectAllocations((prev) => ({
        ...prev,
        [selectedProjectId]: mappedAllocations,
      }));
    } catch (error) {

    }
  };



  const handleDeallocate = async () => {
    if (!selectedProjectId || selectedProjectUsers.length === 0) return;

    setDeallocationConfirmModal(true);
  };

  const confirmDeallocate = async () => {
    if (!selectedProjectId || selectedProjectUsers.length === 0) return;
    setIsDeallocating(true);
    try {
      for (const allocationId of selectedProjectUsers) {
        await deleteProjectAllocation(allocationId);
      }

      const allocationsData =
        await getProjectAllocationsById(selectedProjectId);
      setProjectAllocations((prev) => ({
        ...prev,
        [selectedProjectId]: allocationsData.data || [],
      }));
      await refreshProjectAllocations();
      await refreshBenchEmployeesAfterMutation();
      setSelectedProjectUsers([]);
      showToast("Deallocation successful!", "success");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.data?.[0]?.errorMessage ||
        error.response?.data?.statusMessage ||
        error.response?.data?.message ||
        error.message;
      showToast(`Failed to deallocate: ${errorMsg}`, "error");
    } finally {
      setDeallocationConfirmModal(false);
      setIsDeallocating(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest(".z-50")) {
        setOpenAllocationUserId(null);
      }
    }

    if (openAllocationUserId) {
      document.addEventListener("mousedown", handleClickOutside);

      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openAllocationUserId]);

  useEffect(() => {
    if (allocationModal.open && allocationModal.employee.length > 0) {
      setMaxAvailabilityMap({});
      setIsLoadingMaxAvailability({});
      setIsLoadingViewAllocation({});
      setIsLoadingEmployeeDetails({});
      fetchRoles(); // FIX: re-fetch roles every time the modal opens so newly created roles show up   //////////////////////

      setAllocationModal((modal) => ({
        ...modal,
        employee: modal.employee.map((e) => ({
          ...e,
          allocationAvailability: getAllocationAvailabilityValue(e),
        })),
      }));
    }
  }, [allocationModal.open, allocationModal.employee.length]);

  ///////
  const [popoverEmployee, setPopoverEmployee] = useState<any | null>(null);

  const [viewAllocationData, setViewAllocationData] = useState<any | null>(
    null,
  );

  const [isLoadingViewAllocation, setIsLoadingViewAllocation] = useState<{
    [employeeId: string]: boolean;
  }>({});

  const popoverAnchor = useRef<HTMLButtonElement>(null);






  const handleViewAllocation = async (employee: any) => {
    const employeeId = employee.id;

    setIsLoadingViewAllocation((prev) => ({
      ...prev,
      [employeeId]: true,
    }));

    try {
      //Hasan change this 1625 to 1638 Release 7
      //const response = await getViewAllocations(employeeId);
      //setViewAllocationData(response.data);
      //setPopoverEmployee(employee);

      const response = await getViewAllocations(employeeId);
      const data = response.data;
      const mappedData = {
        availablePeriods: [
          {
            project: data.currentProjects || "No Project",
            period: data.availablePeriod || "Not Allocated",
            percentage: data.totalAllocatedPercentage ?? 0,
          },
        ],
      };
      console.log("MAPPED DATA:", mappedData);
      setViewAllocationData(mappedData);
      setPopoverEmployee(employee);

    } catch (error: any) {
      showToast(
        `Failed to fetch allocation history: ${error?.response?.data?.message ||
        error?.message ||
        "Unknown error"
        }`,
        "error",
      );
    } finally {
      setIsLoadingViewAllocation((prev) => ({
        ...prev,
        [employeeId]: false,
      }));
    }
  };

  const handleViewInfo = async (employee: any) => {
    const employeeId = employee.id;

    setIsLoadingEmployeeDetails((prev) => ({ ...prev, [employeeId]: true }));

    try {
      const response = await getEmployeeDetails(employee.id);
      setViewInfoEmployee({
        ...(response || {}),
        id: employeeId,
        availability: employee.availability,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      showToast(`Failed to fetch employee details: ${errorMessage}`, "error");
    }
    finally {
      setIsLoadingEmployeeDetails((prev) => ({ ...prev, [employeeId]: false }));
    }
  };







  const handleProjectNameFilterChange = (value: string) => {
    setDeallocationFilter(value);
    setAllocatedCurrentPage(1);
  };

  const handleProjectRoleFilterChange = (values: string[]) => {
    setDeallocationRoleFilter(values);
    setAllocatedCurrentPage(1);
  };

  const handleProjectAvailabilityFilterChange = (value: string) => {
    setDeallocationAvailabilityFilter(value);
    setAllocatedCurrentPage(1);
  };

  const validateAllocationDates = (
    employeeId: string,
    startDate: string,
    endDate: string,
  ) => {
    const errors: { startDate?: string; endDate?: string } = {};

    if (!currentProject) return errors;

    const projectStartDate = currentProject.startDate
      ? new Date(currentProject.startDate)
      : null;

    const projectEndDate = currentProject.endDate
      ? new Date(currentProject.endDate)
      : null;

    if (startDate) {
      const allocationStartDate = new Date(startDate);

      if (projectStartDate && allocationStartDate < projectStartDate) {
        errors.startDate = `Start date must be within project date range (${projectStartDate.toLocaleDateString()} to ${projectEndDate?.toLocaleDateString() || "No end date"})`;
      }
    }

    if (endDate) {
      const allocationEndDate = new Date(endDate);

      if (projectEndDate && allocationEndDate > projectEndDate) {
        errors.endDate = `End date must be within project date range (${projectStartDate?.toLocaleDateString() || "No start date"} to ${projectEndDate.toLocaleDateString()})`;
      }
    }

    if (startDate && endDate) {
      const allocationStartDate = new Date(startDate);

      const allocationEndDate = new Date(endDate);

      if (allocationStartDate >= allocationEndDate) {
        errors.endDate = "End date must be after start date";
      }
    }

    setDateValidationErrors((prev) => ({
      ...prev,

      [employeeId]: errors,
    }));

    return Object.keys(errors).length === 0;
  };

  const fetchMaxAvailability = async (
    employeeId: string,
    startDate: string,
    endDate: string,
  ) => {
    if (!startDate || !endDate) {
      setMaxAvailabilityMap((prev) => ({ ...prev, [employeeId]: 0 }));

      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return;
    }

    setIsLoadingMaxAvailability((prev) => ({ ...prev, [employeeId]: true }));

    try {
      const response = await getMaxAvailablePercentage(
        employeeId,
        startDate,
        endDate,
      );
      let maxPercentage = 0;

      if (response.data && typeof response.data === "number") {
        maxPercentage = response.data;
      } else if (response.data?.maxAvailablePercentage) {
        maxPercentage = response.data.maxAvailablePercentage;
      } else if (response.maxAvailablePercentage) {
        maxPercentage = response.maxAvailablePercentage;
      } else if (response.data?.data) {
        maxPercentage = response.data.data;
      }
      setMaxAvailabilityMap((prev) => ({
        ...prev,
        [employeeId]: maxPercentage,
      }));
    } catch (error) {
      const targetEmp = employee.find((emp) => emp.id === employeeId);

      const fallbackAvailability = targetEmp?.availability || 0;

      setMaxAvailabilityMap((prev) => ({
        ...prev,
        [employeeId]: fallbackAvailability,
      }));
    }
    finally {
      setIsLoadingMaxAvailability((prev) => ({ ...prev, [employeeId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] p-6 flex flex-col">
      { }

      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Bench Allocation</h1>

          {currentProject ? (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg">
                <Briefcase className="w-4 h-4 text-blue-600" />

                <span className="text-sm font-medium text-blue-800">
                  Selected Project:
                </span>

                <span className="text-sm font-semibold text-blue-900">
                  {(currentProject as any)?.projectName ||
                    currentProject?.name ||
                    "Unknown Project"}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-lg">
                <Calendar className="w-4 h-4 text-green-600" />

                <span className="text-sm font-medium text-green-800">
                  Period:
                </span>

                <span className="text-sm font-semibold text-green-900">
                  {currentProject.startDate
                    ? new Date(currentProject.startDate).toLocaleDateString()
                    : "Not set"}{" "}
                  -{" "}
                  {currentProject.endDate
                    ? new Date(currentProject.endDate).toLocaleDateString()
                    : "Not set"}
                </span>
              </div>

              { }
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2 bg-yellow-50 px-3 py-1 rounded-lg">
              <Briefcase className="w-4 h-4 text-yellow-600" />

              <span className="text-sm font-medium text-yellow-800">
                Please select a project to start allocation
              </span>
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          onClick={() => navigate("/bench")}
          className="flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      { }

      <ProjectSelector
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelect={handleProjectSelect}
        className="mb-4"
      />

      { }

      <div className="flex flex-1 gap-6 relative">
        { }

        <div className="bg-white rounded-lg p-4 flex flex-col shadow-[0_4px_24px_0_rgba(0,0,0,0.08)] w-[calc(50%-24px)] mr-6 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2 bg-[#e3f0fa] rounded-xl px-6 py-3 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]">
            <div className="font-semibold text-lg flex items-center gap-2">
              <Users className="w-5 h-5" /> Employee Bench
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                className="bg-[#2563EB] rounded-xl shadow-[4px_4px_12px_#e0e0e0,-4px_-4px_12px_#ffffff] px-6 py-2 font-semibold text-white transition hover:bg-[#1d4ed8] hover:shadow-[2px_2px_6px_#e0e0e0,-2px_-2px_6px_#ffffff]"
                onClick={() => {
                  const employeesById: Record<string, Employee> = {};
                  filteredBench.forEach((benchEmployee) => {
                    if (benchEmployee.id) {
                      employeesById[benchEmployee.id] = benchEmployee;
                    }
                  });

                  setSelectedBench(Object.keys(employeesById));
                  setSelectedBenchEmployees(employeesById);
                  setSelectedProjectUsers([]);
                }}
              >
                Select All
              </Button>

              <Button
                variant="primary"
                className="bg-[#2563EB] rounded-xl shadow-[4px_4px_12px_#e0e0e0,-4px_-4px_12px_#ffffff] px-6 py-2 font-semibold text-white transition hover:bg-[#1d4ed8] hover:shadow-[2px_2px_6px_#e0e0e0,-2px_-2px_6px_#ffffff]"
                onClick={() => {
                  setSelectedBench([]);
                  setSelectedBenchEmployees({});
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          { }

          <div className="mb-2 px-4 py-1 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">
              {isSearching && (
                <span className="text-blue-600">Searching employee...</span>
              )}

              {!isSearching &&
                (benchFilter ||
                  designationFilter.length > 0 ||
                  availabilityFilter.length > 0 ||
                  fromDateFilter ||
                  toDateFilter) && (
                  <span className="text-green-600">
                    {designationFilter.length > 0 && (
                      <span className="ml-1">
                        ({designationFilter.length} designation
                        {designationFilter.length > 1 ? "s" : ""} selected)
                      </span>
                    )}
                  </span>
                )}

              {!isSearching &&
                !benchFilter &&
                designationFilter.length === 0 &&
                availabilityFilter.length === 0 &&
                !fromDateFilter &&
                !toDateFilter && (
                  <span className="text-gray-600">Showing all employee</span>
                )}

              {filteredBench.length > 0 && (
                <span className="ml-2">({filteredBench.length} results)</span>
              )}
            </div>
          </div>

          { }

          <div className="mb-4 space-y-3">
            { }

            <div className="relative">
              <Input
                placeholder="Search by name..."
                value={benchFilter}
                onChange={(e) => handleBenchFilterChange(e.target.value)}
                className="w-full mb-2"
              />

              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              { }
              <div className="w-40 relative">
                <SearchableSelect
                  options={designations.map((d) => {
                    const designationName =
                      d.designationName ?? d.name ?? "";
                    return {
                      value: designationName,
                      label: designationName,
                    };
                  })}
                  value={designationFilter[0] || ""}
                  onChange={(value) => {
                    const next = value ? [value] : [];
                    setDesignationFilter(next);
                    setBenchCurrentPage(1);
                  }}
                  placeholder={
                    designationsLoading
                      ? "Loading designations..."
                      : designations.length === 0
                        ? "No designations available"
                        : "Designations"
                  }
                  className="w-40"
                  disabled={designationsLoading || designations.length === 0}
                />
                {designationsLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {!designationsLoading && designations.length === 0 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <button
                      onClick={() => {
                        setDesignationsLoading(true);
                        getDesignations()
                          .then((response: DesignationGetResponse) => {
                            const designationsArray = response.data || [];
                            setDesignations(designationsArray);
                          })
                          .catch((error) => {
                            setDesignations([]);
                          })
                          .finally(() => setDesignationsLoading(false));
                      }}
                      className="text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-50"
                      title="Retry loading designations"
                    >
                      🔄
                    </button>
                  </div>
                )}
              </div>
              { }
              <Input
                type="date"
                value={fromDateFilter}
                onChange={(e) => handleFromDateChange(e.target.value)}
                placeholder="From Date"
                className="w-40"
                title="Select start date for availability period"
              />
              <Input
                type="date"
                value={toDateFilter}
                onChange={(e) => handleToDateChange(e.target.value)}
                placeholder="To Date"
                className="w-40"
                title="Select end date for availability period"
              />
              { }
              <select
                value={
                  availabilityFilter[0] ? String(availabilityFilter[0]) : ""
                }
                onChange={(e) => handleAvailabilityChange(e.target.value)}
                className="w-40 border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="">All Availability</option>
                <option value={100}>100% Available</option>
                <option value={75}>75% and above</option>
                <option value={50}>50% and above</option>
                <option value={20}>20% and above</option>
              </select>
            </div>

            { }

            <Button
              variant="secondary"
              onClick={() => {
                setBenchFilter("");
                setDesignationFilter([]);
                setAvailabilityFilter([]);
                setFromDateFilter("");
                setToDateFilter("");
                setBenchCurrentPage(1);
              }}
              className="px-2 py-1 text-sm min-w-[80px]"
            >
              Clear Filters
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isSearching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>

                <p className="text-gray-500">Searching employee...</p>
              </div>
            ) : paginatedBenchEmployees.length > 0 ? (
              (paginatedBenchEmployees as any[]).map((emp: any) => {
                const userId = emp.id || String(Math.random());

                return (
                  <div
                    key={userId}
                    className={`flex flex-col gap-1 p-2 rounded cursor-pointer border transition-all duration-150 ${selectedBench.includes(userId) ? "border-2 border-blue-500 bg-[#f6fff8]" : "border border-transparent"} hover:bg-[#f6fff8] ${selectedProjectUsers.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => {
                      if (selectedProjectUsers.length === 0)
                        handleBenchSelect(emp);
                    }}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("employeeId", userId);
                    }}
                    style={{ position: "relative" }}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <DonutChart
                        percentage={emp.availability}
                        size={40}
                        strokeWidth={4}
                        color={
                          emp.availability >= 80
                            ? "#16a34a"
                            : emp.availability >= 60
                              ? "#eab308"
                              : "#dc2626"
                        }
                      />

                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate pr-24">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-gray-500 text-sm leading-tight truncate pr-24">
                          {emp.designation}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        className="ml-2 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPopoverEmployee(null);
                          handleViewAllocation(emp);
                        }}
                        // onClick={(e) => {
                        //   e.stopPropagation();

                        //   if (
                        //     popoverEmployee &&
                        //     popoverEmployee.id === userId
                        //   ) {
                        //     setPopoverEmployee(null);

                        //     setViewAllocationData(null);
                        //   } else {
                        //     handleViewAllocation(emp);
                        //   }
                        // }}
                        title="View allocation"
                        //Hasan change for Release 7
                        disabled={isLoadingViewAllocation[userId] || false}
                      //disabled={isLoadingEmployeeDetails[userId] || false}
                      >
                        {isLoadingViewAllocation[userId]
                          ? "Loading..."
                          : "View allocation"}
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        className="ml-2 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();

                          setPopoverEmployee(null);

                          handleViewInfo(emp);
                        }}
                        title="View Info"
                        disabled={isLoadingEmployeeDetails[userId] || false}
                      >
                        {isLoadingEmployeeDetails[userId]
                          ? "Loading..."
                          : "View Info"}
                      </Button>
                    </div>

                    {popoverEmployee && popoverEmployee.id === userId && (
                      <AllocationPopover
                        employee={{
                          ...popoverEmployee,
                          availablePeriods:
                            viewAllocationData?.availablePeriods || [],
                        }}
                        anchorRef={popoverAnchor}
                        onClose={() => {
                          setPopoverEmployee(null);
                          setViewAllocationData(null);
                        }}
                        isLoading={isLoadingViewAllocation[userId] || false}
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {benchFilter.trim() ||
                    designationFilter.length > 0 ||
                    availabilityFilter.length > 0
                    ? "No user found"
                    : "No employee found"}
                </p>
              </div>
            )}
          </div>

          { }

          {benchTotalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4">
              <button
                className="px-3 py-1 rounded border bg-gray-100 text-gray-700 disabled:opacity-50"
                onClick={() =>
                  handleBenchPageChange(Math.max(1, benchCurrentPage - 1))
                }
                disabled={benchCurrentPage === 1}
              >
                Prev
              </button>

              {(() => {
                const windowSize = 5;
                let start = 1;
                let end = Math.min(benchTotalPages, windowSize);
                if (benchCurrentPage > windowSize) {
                  end = benchCurrentPage;
                  start = Math.max(1, end - windowSize + 1);
                }
                const buttons: JSX.Element[] = [];
                for (let p = start; p <= end; p++) {
                  buttons.push(
                    <button
                      key={p}
                      className={`px-3 py-1 rounded border ${benchCurrentPage === p ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
                      onClick={() => handleBenchPageChange(p)}
                    >
                      {p}
                    </button>,
                  );
                }
                return buttons;
              })()}

              <button
                className="px-3 py-1 rounded border bg-gray-100 text-gray-700 disabled:opacity-50"
                onClick={() =>
                  handleBenchPageChange(
                    Math.min(benchTotalPages, benchCurrentPage + 1),
                  )
                }
                disabled={benchCurrentPage === benchTotalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>

        { }

        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-4 z-10">
          <Button
            className="bg-[#2563EB] text-white rounded-full p-3 shadow-lg"
            disabled={
              selectedBench.length === 0 ||
              selectedProjectUsers.length > 0 ||
              !can.projectAllocation.assign
            }
            onClick={handleAllocate}
          >
            <ArrowRight className="w-6 h-6" />
          </Button>

          <Button
            className="bg-[#2563EB] text-white rounded-full p-3 shadow-lg"
            disabled={
              selectedProjectUsers.length === 0 ||
              selectedBench.length > 0 ||
              !can.projectAllocation.deallocate
            }
            onClick={handleDeallocate}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </div>

        { }

        <div className="bg-white rounded-lg p-4 flex flex-col shadow-[0_4px_24px_0_rgba(0,0,0,0.08)] w-[calc(50%-24px)] ml-6 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2 bg-[#e3f0fa] rounded-xl px-6 py-3 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] min-w-0">
            <User className="w-5 h-5 mr-2" />

            <span className="font-semibold text-lg text-blue-900 truncate min-w-0">
              {currentProject
                ? `Project: ${(currentProject as any)?.projectName || currentProject.name}`
                : "Project Allocations"}
            </span>

            <div className="flex gap-2 shrink-0">
              <Button
                variant="primary"
                className="mr-2"
                onClick={() =>
                  setSelectedProjectUsers(
                    filteredAllocatedEmployees
                      .map((e) => e.id)
                      .filter((id) => Number.isFinite(id) && id > 0)
                      .map(String),
                  )

                }
                disabled={!currentProject}
              >
                Select All
              </Button>
              <Button
                variant="primary"
                onClick={() => setSelectedProjectUsers([])}
                disabled={!currentProject}
              >
                Clear
              </Button>
            </div>
          </div>

          { }

          {currentProject ? (
            <div className="bg-blue-25 border-b border-blue-100 px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />

                  <span className="text-sm font-medium text-blue-800">
                    Project Period:
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-blue-700 mt-1">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Start:</span>

                    <span>
                      {currentProject.startDate
                        ? new Date(
                          currentProject.startDate,
                        ).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="font-medium">End:</span>

                    <span>
                      {currentProject.endDate
                        ? new Date(currentProject.endDate).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-25 border-b border-yellow-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-yellow-600" />

                <span className="text-sm font-medium text-yellow-800">
                  No project selected
                </span>
              </div>
            </div>
          )}

          { }

          <div className="px-4 py-2 bg-gray-50 border-b">
            <div className="text-sm text-gray-600">
              {isProjectFiltering && (
                <span className="text-blue-600">
                  Filtering allocated employee...
                </span>
              )}

              {!isProjectFiltering &&
                (deallocationFilter ||
                  deallocationRoleFilter ||
                  deallocationAvailabilityFilter) && (
                  <span className="text-green-600">Users</span>
                )}

              {!isProjectFiltering &&
                !deallocationFilter &&
                !deallocationRoleFilter &&
                !deallocationAvailabilityFilter && (
                  <span className="text-gray-600">
                    Showing all allocated employee
                  </span>
                )}

              {filteredAllocatedEmployees.length > 0 && (
                <span className="ml-2">
                  ({filteredAllocatedEmployees.length} results)
                </span>
              )}
            </div>
          </div>

          { }

          <div className="mb-4 space-y-3 px-4 py-2">
            <div className="relative">
              <Input
                placeholder="Search allocated employee..."
                value={deallocationFilter}
                onChange={(e) => handleProjectNameFilterChange(e.target.value)}
                className="w-full"
              />

              {isProjectFiltering && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex-1 relative">
                <SearchableMultiSelect
                  options={projectRoleOptions}
                  selectedValues={deallocationRoleFilter}
                  onChange={handleProjectRoleFilterChange}
                  placeholder={
                    projectRoleOptions.length === 0
                      ? "No roles allocated"
                      : "All Roles"
                  }
                  className="w-full"
                  disabled={projectRoleOptions.length === 0}
                />
                {rolesLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {!rolesLoading && roles.length === 0 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <button
                      onClick={() => {
                        setRolesLoading(true);
                        getAllRoles()
                          .then((response) => {
                            const rolesArray = Array.isArray(response.data)
                              ? response.data
                              : response.data?.data || [];
                            setRoles(rolesArray);
                          })
                          .catch((error) => {
                            setRoles([]);
                          })
                          .finally(() => setRolesLoading(false));
                      }}
                      className="text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-50"
                      title="Retry loading roles"
                    >
                      🔄
                    </button>
                  </div>
                )}
              </div>
              <select
                value={deallocationAvailabilityFilter}
                onChange={(e) =>
                  handleProjectAvailabilityFilterChange(e.target.value)
                }
                className="flex-1 border border-[#D1D5DB] rounded px-2 py-2 text-sm h-10"
              >
                <option value="">Allocated % </option>
                <option value="100">100% Allocated</option>
                <option value="75">75% & Above Allocated</option>
                <option value="50">50% & Above Allocated</option>
                <option value="below50">Below 50% Allocated</option>
              </select>
            </div>

            <Button
              variant="secondary"
              onClick={() => {
                setDeallocationFilter("");

                setDeallocationRoleFilter([]);
                setDeallocationAvailabilityFilter("");
              }}
              className="px-2 py-1 text-sm min-w-[80px]"
            >
              Clear Project Filters
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {paginatedAllocatedEmployees.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                {allocatedEmployees.length === 0
                  ? "No allocations yet"
                  : "No employee match your search"}
              </div>
            ) : (
              <>
                <table className="w-full text-center table-fixed">
                  <thead>
                    <tr className="border-b border-[#D1D5DB]">
                      <th className="py-2 px-4 text-center whitespace-nowrap min-w-[120px]">
                        Name
                      </th>
                      <th className="text-center px-4 whitespace-nowrap min-w-[100px]">
                        Role
                      </th>
                      <th className="text-center px-4 whitespace-nowrap min-w-[130px]">
                        Allocated %
                      </th>
                      <th className="text-center px-4 whitespace-nowrap min-w-[110px]">
                        Start Date
                      </th>
                      <th className="text-center px-4 whitespace-nowrap min-w-[110px]">
                        End Date
                      </th>
                      {can.projectAllocation.extend && (
                        <th className="text-center px-4 whitespace-nowrap"></th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAllocatedEmployees.map((emp: any) => (
                      <tr
                        key={emp.id}
                        className={`border-b hover:bg-[#f6fff8] cursor-pointer transition-all duration-150
    ${selectedProjectUsers.includes(emp.id) ? "border-2 border-blue-500 bg-[#f6fff8]" : "border border-[#D1D5DB]"}
    ${selectedBench.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => {
                          if (selectedBench.length === 0)
                            handleProjectUserSelect(emp.id);
                        }}
                      >
                        <td>
                          <span className="inline-block max-w-[200px] truncate align-middle">
                            {emp.userFullName}
                          </span>
                        </td>
                        <td>{emp.roleName}</td>
                        <td>{emp.allocationPercentage}%</td>
                        <td>
                          {emp.startDate ? emp.startDate.split("T")[0] : "-"}
                        </td>
                        <td>{emp.endDate ? emp.endDate.split("T")[0] : "-"}</td>

                        {can.projectAllocation.extend && (
                          <td>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();

                                const mappedEmp = {
                                  id: emp.employeeId ?? emp.userId ?? emp.id,
                                  //id: emp.id,
                                  allocationId: emp.id,
                                  employeeId: emp.employeeId ?? emp.userId ?? emp.id,
                                  empId: emp.employeeId ?? emp.userId ?? emp.id,
                                  firstName:
                                    emp.userFullName?.split(" ")[0] ||
                                    emp.firstName ||
                                    "",
                                  lastName:
                                    emp.userFullName
                                      ?.split(" ")
                                      .slice(1)
                                      .join(" ") ||
                                    emp.lastName ||
                                    "",
                                  designation: emp.designation || "",
                                  roleId:
                                    emp.roleId ||
                                    roles.find(
                                      (r) => r.roleName === emp.roleName,
                                    )?.id ||
                                    "",
                                  roleName: emp.roleName || "",
                                  allocationAvailability:
                                    emp.allocationPercentage ??
                                    emp.availability ??
                                    0,
                                  availability:
                                    emp.availability ??
                                    emp.allocationPercentage ??
                                    0,
                                  allocationStartDate: emp.startDate
                                    ? emp.startDate.split("T")[0]
                                    : "",
                                  allocationEndDate: emp.endDate
                                    ? emp.endDate.split("T")[0]
                                    : "",
                                };
                                setAllocationModal({
                                  open: true,
                                  employee: [mappedEmp],
                                });
                              }}
                              title="Edit"
                            >
                              Edit
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                { }

                {allocatedTotalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 py-4">
                    <button
                      className="px-3 py-1 rounded border bg-gray-100 text-gray-700 disabled:opacity-50"
                      onClick={() =>
                        setAllocatedCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={allocatedCurrentPage === 1}
                    >
                      Previous
                    </button>

                    {Array.from(
                      { length: allocatedTotalPages },
                      (_, i) => i + 1,
                    ).map((p) => (
                      <button
                        key={p}
                        className={`px-3 py-1 rounded border ${allocatedCurrentPage === p
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700"
                          }`}
                        onClick={() => setAllocatedCurrentPage(p)}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      className="px-3 py-1 rounded border bg-gray-100 text-gray-700 disabled:opacity-50"
                      onClick={() =>
                        setAllocatedCurrentPage((p) =>
                          Math.min(allocatedTotalPages, p + 1),
                        )
                      }
                      disabled={allocatedCurrentPage === allocatedTotalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      { }

      {allocationModal.open && (
        <Modal
          isOpen={allocationModal.open}
          onClose={() => {
            setAllocationModal({ open: false, employee: [] });

            setMaxAvailabilityMap({});

            setIsLoadingMaxAvailability({});

            setIsLoadingViewAllocation({});

            setIsLoadingEmployeeDetails({});

            setDateValidationErrors({});
          }}
          title="Allocation Preview"
          size="2xl"
        >
          <div className="flex flex-col gap-6 p-6 min-w-[900px]">
            { }

            {currentProject && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 text-xl font-serif">
                      {(currentProject as any)?.projectName ||
                        currentProject.name ||
                        "Unknown Project"}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-blue-700 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />

                        <span>
                          Start Date:{" "}
                          {currentProject.startDate
                            ? new Date(
                              currentProject.startDate,
                            ).toLocaleDateString()
                            : "Not set"}{" "}
                          - End Date:{" "}
                          {currentProject.endDate
                            ? new Date(
                              currentProject.endDate,
                            ).toLocaleDateString()
                            : "Not set"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {allocationModal.employee.map((emp, index) => (
              <div
                key={emp.id}
                className="bg-white border border-gray-200 rounded-lg flex items-center gap-8 p-6 w-full relative"
              >
                { }

                {allocationModal.employee.length > 1 && (
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl font-bold"
                    onClick={() => {
                      setAllocationModal((modal) => ({
                        ...modal,

                        employee: modal.employee.filter(
                          (e, i) => i !== index,
                        ),
                      }));

                      setMaxAvailabilityMap((prev) => {
                        const newMap = { ...prev };

                        delete newMap[emp.id];

                        return newMap;
                      });

                      setIsLoadingMaxAvailability((prev) => {
                        const newMap = { ...prev };

                        delete newMap[emp.id];

                        return newMap;
                      });
                    }}
                    title="Remove"
                    type="button"
                  >
                    ×
                  </button>
                )}

                { }

                <div className="flex flex-col min-w-[180px]">
                  <span className="font-semibold">
                    {emp.firstName} {emp.lastName}
                  </span>

                  <span className="text-gray-500 text-sm leading-tight">
                    {emp.designation}
                  </span>
                </div>

                { }

                <div className="flex flex-col min-w-[140px]">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={emp.roleId != null ? String(emp.roleId) : ""}
                    onChange={(e) => {
                      const selectedRoleId = Number(e.target.value);
                      const selectedRole = roles.find(
                        (r) => Number(r.roleId) === selectedRoleId,
                      );

                      setAllocationModal((modal) => ({
                        ...modal,
                        employee: modal.employee.map((employee, i) =>
                          i === index
                            ? {
                              ...employee,
                              roleId: selectedRoleId,
                              roleName:
                                selectedRole?.roleName ??
                                selectedRole?.name ??
                                "",
                            }
                            : employee,
                        ),
                      }));
                    }}
                    className="border border-[#D1D5DB] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ minWidth: 120 }}
                  >
                    <option value="">Select Role</option>

                    {roles
                      // .filter((role) => Number(role.roleId) !== 1 && Number(role.roleId) !== 2)
                      .map((role) => (
                        <option key={Number(role.roleId)} value={Number(role.roleId)}>
                          {role.roleName || role.name || "Unnamed Role"}
                        </option>
                      ))}
                  </select>

                </div>

                { }

                <div className="flex flex-col min-w-[150px]">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    min={currentProject?.startDate?.split("T")[0] || new Date().toISOString().split("T")[0]}
                    max={currentProject?.endDate?.split("T")[0]}
                    value={emp.allocationStartDate || ""}
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      setAllocationModal((modal) => ({
                        ...modal,
                        employee: modal.employee.map((employee, i) =>
                          i === index ? { ...employee, allocationStartDate: newStartDate } : employee,
                        ),
                      }));
                      validateAllocationDates(emp.id, newStartDate, emp.allocationEndDate || "");
                      if (newStartDate && emp.allocationEndDate) {
                        fetchMaxAvailability(emp.id, newStartDate, emp.allocationEndDate);
                      }
                    }}
                    className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${dateValidationErrors[emp.id]?.startDate ? "border-red-500" : "border-[#D1D5DB]"
                      }`}
                    style={{ minWidth: 120 }}
                  />
                  {/* <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    max={new Date().toISOString().split("T")[0]}
                    value={
                      (emp.allocationStartDate = new Date()
                        .toISOString()
                        .split("T")[0])
                    }
                    onChange={(e) => {
                      const newStartDate = e.target.value;

                      setAllocationModal((modal) => ({
                        ...modal,

                        employee: modal.employee.map((employee, i) =>
                          i === index
                            ? { ...employee, allocationStartDate: newStartDate }
                            : employee,
                        ),
                      }));

                      validateAllocationDates(
                        emp.id,
                        newStartDate,
                        emp.allocationEndDate || "",
                      );

                      if (newStartDate && emp.allocationEndDate) {
                        fetchMaxAvailability(
                          emp.id,
                          newStartDate,
                          emp.allocationEndDate,
                        );
                      }
                    }}
                    className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      dateValidationErrors[emp.id]?.startDate
                        ? "border-red-500"
                        : "border-[#D1D5DB]"
                    }`}
                    style={{ minWidth: 120 }}
                  /> */}


                  {dateValidationErrors[emp.id]?.startDate && (
                    <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="12"
                          fill="#dc2626"
                          fillOpacity="0.15"
                        />

                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill="#dc2626"
                          fillOpacity="0.10"
                        />

                        <path
                          d="M12 7v5"
                          stroke="#dc2626"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />

                        <circle cx="12" cy="16" r="1.2" fill="#dc2626" />
                      </svg>

                      <span>{dateValidationErrors[emp.id].startDate}</span>
                    </div>
                  )}
                </div>

                { }

                <div className="flex flex-col min-w-[150px] relative">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={emp.allocationEndDate || ""}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      const newEndDate = e.target.value;

                      setAllocationModal((modal) => ({
                        ...modal,

                        employee: modal.employee.map((employee, i) =>
                          i === index
                            ? { ...employee, allocationEndDate: newEndDate }
                            : employee,
                        ),
                      }));

                      validateAllocationDates(
                        emp.id,
                        emp.allocationStartDate || "",
                        newEndDate,
                      );

                      if (emp.allocationStartDate && newEndDate) {
                        fetchMaxAvailability(
                          emp.id,
                          emp.allocationStartDate,
                          newEndDate,
                        );
                      }
                    }}
                    className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${dateValidationErrors[emp.id]?.endDate
                      ? "border-red-500"
                      : "border-[#D1D5DB]"
                      }`}
                    style={{ minWidth: 120 }}
                  />

                  {dateValidationErrors[emp.id]?.endDate && (
                    <div className="flex items-center gap-1 text-red-600 text-xs mt-1 absolute left-0 top-full z-10 bg-white">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="12"
                          fill="#dc2626"
                          fillOpacity="0.15"
                        />

                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill="#dc2626"
                          fillOpacity="0.10"
                        />

                        <path
                          d="M12 7v5"
                          stroke="#dc2626"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />

                        <circle cx="12" cy="16" r="1.2" fill="#dc2626" />
                      </svg>

                      <span>{dateValidationErrors[emp.id].endDate}</span>
                    </div>
                  )}
                </div>

                { }

                <div className="flex flex-col min-w-[120px]">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Availability
                  </label>

                  <div className="flex items-center">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={getAllocationAvailabilityValue(emp)}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;

                        setAllocationModal((modal) => ({
                          ...modal,

                          employee: modal.employee.map((employee, i) =>
                            i === index
                              ? { ...employee, allocationAvailability: value }
                              : employee,
                          ),
                        }));
                      }}
                      className="w-16 border border-[#D1D5DB] rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />

                    { }
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
                onClick={() => {
                  setAllocationModal({ open: false, employee: [] });

                  setMaxAvailabilityMap({});

                  setIsLoadingMaxAvailability({});

                  setIsLoadingViewAllocation({});

                  setIsLoadingEmployeeDetails({});

                  setDateValidationErrors({});
                }}
              >
                Cancel
              </button>



              <button
                className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
                onClick={() =>
                  handleConfirmAllocation(allocationModal.employee)
                }
                disabled={isAllocating}
              >
                {isAllocating ? "Allocating..." : "Confirm"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      { }

      {viewInfoEmployee && (
        <Modal
          isOpen={!!viewInfoEmployee}
          onClose={() => setViewInfoEmployee(null)}
          title="Employee Details"
          size="full"
        >
          {viewInfoEmployee && isLoadingEmployeeDetails[viewInfoEmployee.id] ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>

              <p className="text-gray-500">Loading employee details...</p>
            </div>
          ) : (
            <EmployeeDetailsCard
              employee={viewInfoEmployee}
              selectedProjectId={selectedProjectId}
              onClose={() => setViewInfoEmployee(null)}
            />
          )}
        </Modal>
      )}

      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
      />

      { }

      <Modal
        isOpen={deallocationConfirmModal}
        onClose={() => setDeallocationConfirmModal(false)}
        title="Confirm Deallocation"
        size="md"
      >
        <div className="p-6 flex flex-col gap-6">
          <div className="text-lg font-semibold text-gray-800">
            Are you sure you want to deallocate the selected user(s) from this
            project?
          </div>

          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
              onClick={() => setDeallocationConfirmModal(false)}
            >
              Cancel
            </button>

            <button
              className="px-4 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700"
              onClick={confirmDeallocate}
              disabled={isDeallocating}
            >
              {isDeallocating ? "Deallocating..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>

      { }

      <Modal
        isOpen={allocationSuccessModal}
        onClose={() => setAllocationSuccessModal(false)}
        title="Allocation Successful"
        size="md"
      >
        <div className="p-3 flex flex-col gap-3">
          <div className="text-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>

            <div className="text-lg font-bold text-gray-800 mb-2">
              Allocation Successful!
            </div>

            <div className="text-md text-gray-800">
              The selected employee have been successfully allocated to the
              project.
            </div>
          </div>

          <div className="flex justify-center">
            <button
              className="px-6 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 text-md"
              onClick={() => setAllocationSuccessModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );

}

// export default b;

// function getErrorMessage(error: unknown, fallback: string): string {
//   if (typeof error === "object" && error !== null) {
//     const err = error as {
//       response?: {
//         data?: {
//           message?: string;
//           statusMessage?: string;
//           error?: string;
//         };
//       };
//       message?: string;
//     };

//     return (
//       err.response?.data?.message ||
//       err.response?.data?.statusMessage ||
//       err.response?.data?.error ||
//       err.message ||
//       fallback
//     );
//   }

//   if (typeof error === "string" && error.trim()) {
//     return error;
//   }

//   return fallback;

// }
