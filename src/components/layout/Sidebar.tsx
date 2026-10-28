import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Bug,
  FileText,
  Rocket,
  GitBranch,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { usePermission } from "../../context/PermissionContext";

export const Sidebar: React.FC = () => {
  const { can } = usePermission();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: "Employees",
      href: "/employees",
      icon: Users,
      show: can.employee.view,
    },
    { name: "Bench", href: "/bench", icon: UserCheck, show: can.bench.view },
    {
      name: "Configurations",
      href: "/configurations",
      icon: Settings,
      show: !!(
        can.designation.view ||
        can.role.view ||
        can.defectType.view ||
        can.permission.view ||
        can.emailConfig.view ||
        can.pointSetup.view ||
        can.roleEmailRecipient.view ||
        can.employeeEmailRecipient.view ||
        can.releaseType.view ||
        can.severity.view ||
        can.priority.view ||
        can.statusType.view ||
        can.workflow.view
      ),
    },
  ];
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedProjectId, setSelectedProjectId } = useApp();

  React.useEffect(() => {
    if (location.pathname.startsWith("/projects/") && selectedProjectId) {
      setOpen(true);
    }
  }, [location.pathname, selectedProjectId]);

  const handleDashboardClick = (e: React.MouseEvent) => {
    if (selectedProjectId) {
      e.preventDefault();
setSelectedProjectId(null);
navigate("/dashboard");
    }
  };

  const handleProjectsClick = () => {
    setSelectedProjectId(null);
    navigate("/projects");
  };

  return (
    <aside
      className="fixed left-0 top-16 w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] shadow-sm z-40 overflow-y-
auto"
    >
      <nav className="mt-8">
        <div className="space-y-1 px-4">
          {navigation
            .filter((item) => item.show)
            .map((item) => (
              <div key={item.name}>
                <NavLink
                  to={item.href}
                  onClick={
                    item.name === "Dashboard" ? handleDashboardClick : undefined
                  }
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                    }`
                  }
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </NavLink>
                {}
                {false && item.name === "Bench" && item.sub && (
                  <div
                    className={`pl-10 mt-1 space-y-1 ${location.pathname === "/bench" || location.pathname === "/bench-allocate" ? "" : "hidden"}`}
                  >
                    {item.sub.map((subItem) => (
                      <NavLink
                        key={subItem.name}
                        to={subItem.href}
                        className={({ isActive }) =>
                          `group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 w-full overflow-hidden text-ellipsis whitespace-nowrap ${
                            isActive
                              ? "bg-blue-100 text-blue-800"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          }`
                        }
                      >
                        {subItem.icon && (
                          <subItem.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                        )}
                        {subItem.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}

          {}
          {can.project.view && (
            <div className="relative">
              <button
                className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  location.pathname.startsWith("/projects")
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                }`}
                onClick={handleProjectsClick}
                aria-expanded={open}
                aria-controls="project-dropdown"
                type="button"
              >
                <FolderOpen className="mr-3 h-5 w-5 flex-shrink-0" />
                Projects
                {selectedProjectId &&
                  (open ? (
                    <ChevronUp className="ml-auto w-4 h-4" />
                  ) : (
                    <ChevronDown className="ml-auto w-4 h-4" />
                  ))}
              </button>
              {}
              {selectedProjectId && open && (
                <div
                  id="project-dropdown"
                  className="pl-7 mt-3 space-y-1 w-full"
                >
                  {can.project.view && (
                    <NavLink
                      to={`/projects/${selectedProjectId}/project-management`}
                      className={({ isActive }) =>
                        `group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 w-full overflow-hidden text-ellipsis whitespace-nowrap ${
                          isActive
                            ? "bg-blue-100 text-blue-800"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`
                      }
                    >
                      <FolderOpen className="mr-2 h-4 w-4 flex-shrink-0" />
                      Project Management
                    </NavLink>
                  )}
                  {can.testCase.view && (
                    <NavLink
                      to={`/projects/${selectedProjectId}/test-cases`}
                      className={({ isActive }) =>
                        `group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 w-full overflow-hidden text-ellipsis whitespace-nowrap ${
                          isActive
                            ? "bg-blue-100 text-blue-800"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`
                      }
                    >
                      <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                      Test Cases
                    </NavLink>
                  )}
                  {can.release.view && (
                    <NavLink
                      to={`/projects/${selectedProjectId}/releases`}
                      className={({ isActive }) =>
                        `group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 w-full overflow-hidden text-ellipsis whitespace-nowrap ${
                          isActive
                            ? "bg-blue-100 text-blue-800"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`
                      }
                    >
                      <Rocket className="mr-2 h-4 w-4 flex-shrink-0" />
                      Releases
                    </NavLink>
                  )}
                  {can.defect.view && (
                    <NavLink
                      to={`/projects/${selectedProjectId}/defects`}
                      className={({ isActive }) =>
                        `group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 w-full overflow-hidden text-ellipsis whitespace-nowrap ${
                          isActive
                            ? "bg-blue-100 text-blue-800"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`
                      }
                    >
                      <Bug className="mr-2 h-4 w-4 flex-shrink-0" />
                      Defects
                    </NavLink>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};
