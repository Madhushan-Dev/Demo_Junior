import React, { useState, useEffect } from "react";

import {
  Plus,
  FolderOpen,
  Calendar,
  User,
  Edit2,
  Trash2,
  Smartphone,
  FileText,
  ShoppingCart,
  HeartPulse,
  GraduationCap,
  Users,
  Cpu,
  Plane,
  Dumbbell,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { Toast } from "../components/ui/Toast";
import {
  createProject,
  deleteProject,
  getAllProjects,
  updateProject,
} from "../api/projectget";
import { getAllDesignations } from "../api/designation/designation";
import { usePermission } from "../context/PermissionContext";
import {
  getAvailableManagers,
  getAvailableManagersForUpdate,
  AvailableManager,
} from "../api/projectget";
import { OrbitProgress } from "react-loading-indicators";

interface LocalProject {
  id: number;
  name: string;
  prefix: string;
  projectType: string;
  status: "Active" | "On Hold" | "Completed";
  startDate: string;
  endDate: string;
  projectManagerName: string;
  managerId?: string;
  clientName: string;
  clientCountry: string;
  clientState: string;
  clientEmail: string;
  clientPhone: string;
  address: string;
  description: string;
  projectManagerDesignationId?: number;
  managerAllocation?: number;
  projectId: number;
}

interface ProjectFormData {
  name: string;
  prefix: string;
  projectType: string;
  status: string;
  startDate: string;
  endDate: string;
  designationId: string;
  projectManagerId: string;
  projectManagerName: string;
  clientName: string;
  clientCountry: string;
  clientState: string;
  clientEmail: string;
  clientPhone: string;
  address: string;
  description: string;
  managerAllocation?: string;
}

const cardStyles = [
  {
    border: "border-t-4 border-blue-400",
    iconBg: "bg-gradient-to-br from-blue-400 to-blue-600",
    iconColor: "text-white",
  },
  {
    border: "border-t-4 border-green-400",
    iconBg: "bg-gradient-to-br from-green-400 to-green-600",
    iconColor: "text-white",
  },
  {
    border: "border-t-4 border-purple-400",
    iconBg: "bg-gradient-to-br from-purple-400 to-purple-600",
    iconColor: "text-white",
  },
  {
    border: "border-t-4 border-pink-400",
    iconBg: "bg-gradient-to-br from-pink-400 to-pink-600",
    iconColor: "text-white",
  },
  {
    border: "border-t-4 border-yellow-400",
    iconBg: "bg-gradient-to-br from-yellow-400 to-yellow-600",
    iconColor: "text-white",
  },
  {
    border: "border-t-4 border-orange-400",
    iconBg: "bg-gradient-to-br from-orange-400 to-orange-600",
    iconColor: "text-white",
  },
  {
    border: "border-t-4 border-cyan-400",
    iconBg: "bg-gradient-to-br from-cyan-400 to-cyan-600",
    iconColor: "text-white",
  },
  {
    border: "border-t-4 border-indigo-400",
    iconBg: "bg-gradient-to-br from-indigo-400 to-indigo-600",
    iconColor: "text-white",
  },
];

const projectIcons = [
  Smartphone,
  FileText,
  ShoppingCart,
  HeartPulse,
  GraduationCap,
  Users,
  Cpu,
  Plane,
  Dumbbell,
];

const locationNamePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

const getNextDate = (date: string): string => {
  if (!date) return "";

  const [year, month, day] = date.split("-").map(Number);
  const nextDate = new Date(year, month - 1, day + 1);

  return `${nextDate.getFullYear()}-${String(
    nextDate.getMonth() + 1,
  ).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;
};


const projectNamePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

const normalizeProjectName = (value: string): string =>
  value.replace(/\s+/g, "").toLowerCase();

const emptyForm = (): ProjectFormData => ({
  name: "",
  prefix: "",
  projectType: "",
  status: "ACTIVE",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  designationId: "",
  projectManagerId: "",
  projectManagerName: "",
  clientName: "",
  clientCountry: "",
  clientState: "",
  clientEmail: "",
  clientPhone: "",
  address: "",
  description: "",
});

export const Projects: React.FC = () => {
  const { setSelectedProjectId: setGlobalProjectId } = useApp();
  const {
    projects: userProjects,
    isAdmin,
    isLoading: permissionLoading,
    can,
  } = usePermission();
  const navigate = useNavigate();
  const [designations, setDesignations] = useState<any[]>([]);
  const [users, setUsers] = useState<AvailableManager[]>([]);
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<LocalProject | null>(
    null,
  );
  const [deleteConfirmProject, setDeleteConfirmProject] =
    useState<LocalProject | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>(emptyForm());
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "Active" | "On Hold" | "Completed"
  >("ALL");
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });

  const [showAllocationPopup, setShowAllocationPopup] = useState(false);
  const [allocatingManagerName, setAllocatingManagerName] =
    useState<string>("");
  const [allocatingManagerDesignation, setAllocatingManagerDesignation] =
    useState<string>("");
  const [allocatingManagerId, setAllocatingManagerId] = useState<string>("");
  const [allocationPercentage, setAllocationPercentage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [selectedManagerAvailability, setSelectedManagerAvailability] =
    useState(100);
  const [currentPmAllocation, setCurrentPmAllocation] = useState<number>(0);
  const [isUpdatingAllocation, setIsUpdatingAllocation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const loadDesignations = async () => {
    const response = await getAllDesignations();
    const designationList =
      response?.data?.content || response?.data?.data || response?.data || [];
    setDesignations(Array.isArray(designationList) ? designationList : []);
  };

  const handleDesignationChange = async (value: string) => {
    handleInputChange("designationId", value);
    handleInputChange("projectManagerId", "");
    setUsers([]);
    if (value) {
      try {
        let managers: AvailableManager[];
        if (editingProject) {
          managers = await getAvailableManagersForUpdate(
            Number(value),
            Number(editingProject.id),
          );
        } else {
          managers = await getAvailableManagers(Number(value));
        }
        setUsers(managers);
      } catch (err) {
setUsers([]);
      }
    }
  };

  const handleProjectManagerSelect = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const managerId = e.target.value;
    handleInputChange("projectManagerId", managerId);
    handleInputChange("managerAllocation", "");

    if (managerId) {
      const selectedUser = users.find((u) => String(u.empId) === managerId);
      if (selectedUser) {
        const managerName = `${selectedUser.firstName} ${selectedUser.lastName}`;
        const isSameAsCurrentPm = editingProject
          ? String(selectedUser.empId) === String(editingProject.managerId)
          : false;

        setAllocatingManagerId(managerId);
        setAllocatingManagerName(managerName);
        setAllocatingManagerDesignation(selectedUser.designationName || "");
     setSelectedManagerAvailability(selectedUser.availabilityPercent);
setAllocationPercentage(selectedUser.availabilityPercent);

        if (isSameAsCurrentPm) {
          setIsUpdatingAllocation(true);
          setShowAllocationPopup(false);
          setCurrentPmAllocation(editingProject?.managerAllocation ?? 0);
        } else {
          setIsUpdatingAllocation(false);
          setCurrentPmAllocation(0);
          setAllocationPercentage(selectedUser.availabilityPercent);
          setShowAllocationPopup(true);
        }
      }
    } else {
      setIsUpdatingAllocation(false);
      setCurrentPmAllocation(0);
      setAllocatingManagerId("");
    }
  };

  const handleAllocateManager = async () => {
    if (allocationPercentage === 0 || !allocatingManagerId) return;

    setIsAllocating(true);
    try {
      const isSamePm = editingProject
        ? String(allocatingManagerId) === String(editingProject.managerId)
        : false;

      if (isSamePm) {
        setCurrentPmAllocation(allocationPercentage);
        setIsUpdatingAllocation(true);
      } else {
        handleInputChange("managerAllocation", String(allocationPercentage));
        setCurrentPmAllocation(allocationPercentage);

        setIsUpdatingAllocation(true);
      }
      setShowAllocationPopup(false);
    } finally {
      setIsAllocating(false);
    }
  };

  const handleCancelAllocation = () => {
    const isSamePm = editingProject
      ? String(allocatingManagerId) === String(editingProject.managerId)
      : false;

    setShowAllocationPopup(false);

    if (isSamePm) {
      setIsUpdatingAllocation(true);
      setAllocationPercentage(0);
    } else {
      handleInputChange("projectManagerId", "");
      setAllocatingManagerId("");
      setAllocatingManagerName("");
      setAllocatingManagerDesignation("");
      setAllocationPercentage(0);

      if (editingProject) {
        setIsUpdatingAllocation(true);
      }
    }
  };

  const handlePercentageChange = (value: number) => {
    const clampedValue = Math.max(
      1,
      Math.min(selectedManagerAvailability, value),
    );
    setAllocationPercentage(clampedValue);
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updatePercentageFromMouse(e);
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      updatePercentageFromMouse(e);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const updatePercentageFromMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.round((x / rect.width) * 100);
    handlePercentageChange(percentage);
  };

  //-------------------------------------------------------------

const getAllProject = async () => {
  try {
    setLoading(true);

    const response = await getAllProjects(
      statusFilter,
      searchTerm
    );

    const mappedProjects: LocalProject[] = response.map((project: any) => ({
  id: Number(project.id ?? project.projectId),
  projectId: Number(project.projectId ?? project.id),

  name: project.projectName || "",
  prefix: project.prefix || "",
  projectType: project.projectType || "",
  description: project.projectDescription || "",
  status: project.status || "",
  startDate: project.startDate || "",
  endDate: project.endDate || "",

  projectManagerName:
    project.projectManagerName ||
    project.projectManager?.name ||
    `${project.projectManager?.firstName || ""} ${
      project.projectManager?.lastName || ""
    }`.trim(),

  managerId: project.projectManagerId
    ? String(project.projectManagerId)
    : project.projectManager?.empId
      ? String(project.projectManager.empId)
      : "",

  projectManagerDesignationId: Number(
    project.projectManagerDesignationId ??
      project.designationId ??
      project.projectManager?.designationId ??
      0,
  ),
managerAllocation: Number(
  project.managerAllocation ??
    project.projectManagerAllocation ??
    project.allocationPercentage ??
    project.projectManager?.allocationPercentage ??
    0,
),

  clientName: project.clientDetails?.clientName || "",
  clientCountry: project.clientDetails?.country || "",
  clientState: project.clientDetails?.state || "",
  clientEmail: project.clientDetails?.email || "",
  clientPhone: project.clientDetails?.phoneNumber || "",
  address: project.clientDetails?.address || "",
}));

    if (isAdmin) {
      setProjects(mappedProjects);
    } else {
      const userProjectIds = userProjects.map((p) => p.projectId);

      const filteredProjects = mappedProjects.filter((project) =>
        userProjectIds.includes(Number(project.id))
      );

      setProjects(filteredProjects);
    }

  } catch (error) {
    console.error("Error fetching projects:", error);
  } finally {
    setLoading(false);
  }
};

  //-----------------------------------------------------
useEffect(() => {
  if (!permissionLoading) {
    getAllProject();
  }
}, [
  permissionLoading,
  isAdmin,
  userProjects,
  statusFilter,
  searchTerm,
]);

//-----------------------------------------------------------

  useEffect(() => {
    loadDesignations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectManagerId) {
      setToast({
        isOpen: true,
        message: "Please select a project manager",
        type: "error",
      });
      return;
    }

    const trimmedProjectName = formData.name.trim();

    if (!trimmedProjectName) {
      setToast({
        isOpen: true,
        message: "Project name is required",
        type: "error",
      });
      return;
    }

    const projectNameAlreadyExists = projects.some(
      (project) =>
        project.id !== editingProject?.id &&
        normalizeProjectName(project.name) ===
          normalizeProjectName(trimmedProjectName),
    );

    if (projectNameAlreadyExists) {
      setToast({
        isOpen: true,
        message: "Project name already exists.",
        type: "error",
      });
      return;
    }

    if (!formData.description.trim()) {
  setToast({
    isOpen: true,
    message: "Project description is required.",
    type: "error",
  });
  return;
}

    if (!/[A-Za-z]/.test(formData.description)) {
  setToast({
    isOpen: true,
    message: "Enter a valid description",
    type: "error",
  });
  return;
}

    if (
      formData.clientName &&
      !/^[A-Za-z ]+$/.test(formData.clientName.trim())
    ) {
      setToast({
        isOpen: true,
        message: "Client name must contain only letters and spaces!",
        type: "error",
      });
      return;
    }

    const country = formData.clientCountry.trim();
const state = formData.clientState.trim();

if (!locationNamePattern.test(country)) {
  setToast({
    isOpen: true,
    message: "Country must contain only letters and spaces.",
    type: "error",
  });
  return;
}

if (!locationNamePattern.test(state)) {
  setToast({
    isOpen: true,
    message: "State must contain only letters and spaces.",
    type: "error",
  });
  return;
}

    if (formData.clientPhone && !/^[0-9]+$/.test(formData.clientPhone.trim())) {
      setToast({
        isOpen: true,
        message: "Phone number must contain only digits!",
        type: "error",
      });
      return;
    }

    if (!formData.endDate) {
      setToast({
        isOpen: true,
        message: "End Date is required",
        type: "error",
      });
      return;
    }

// Rule 1: Start date and End date should not be same
if (formData.startDate === formData.endDate) {
  setToast({
    isOpen: true,
    message: "Start date and end date cannot be the same",
    type: "error",
  });
  return;
}

// Rule 2: When marking project as Completed, End Date must be today or earlier (not a future date)
const todayDate = new Date().toISOString().split("T")[0];

if (
  editingProject &&
  formData.status === "Completed" &&
  formData.endDate > todayDate
) {
  setToast({
    isOpen: true,
    message: "End Date must be today or earlier to mark the project as Completed",
    type: "error",
  });
  return;
}
    const allocationVal = formData.managerAllocation
      ? Number(formData.managerAllocation)
      : currentPmAllocation > 0
        ? currentPmAllocation
        : allocationPercentage > 0
          ? allocationPercentage
          : 100;

    const apiData = {
      projectName: trimmedProjectName,
      projectDescription: formData.description.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      designationId: Number(formData.designationId),
      projectManagerId: Number(formData.projectManagerId),
      managerAllocation: allocationVal,
      clientDetails: {
        clientName: formData.clientName.trim(),
        country: formData.clientCountry.trim(),
        state: formData.clientState.trim(),
        email: formData.clientEmail.trim(),
        phoneNumber: formData.clientPhone.trim(),
      },
    };

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (editingProject) {
        await updateProject(Number(editingProject.id), apiData);
        setToast({
          isOpen: true,
          message: "Project updated successfully!",
          type: "success",
        });
      } else {
        await createProject(apiData);
        setToast({
          isOpen: true,
          message: "Project created successfully!",
          type: "success",
        });
      }

      await getAllProject();
      resetForm();
    } catch (error: any) {
  const backendData = error?.response?.data;

  const errorMessage =
    backendData?.data?.[0]?.message ||
    backendData?.statusMessage ||
    backendData?.message ||
    error?.message ||
    "Failed to save project";

  setToast({ isOpen: true, message: errorMessage, type: "error" });
}finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (project: LocalProject) => {
    setEditingProject(project);
    setShowAllocationPopup(false);
    setAllocatingManagerId("");
    setAllocatingManagerName("");
    setAllocatingManagerDesignation("");
    setAllocationPercentage(0);

    setCurrentPmAllocation(project.managerAllocation ?? 0);

    setIsUpdatingAllocation(true);
    setAllocatingManagerName(project.projectManagerName || "");

    if (designations.length === 0) {
      await loadDesignations();
    }

    const desId = project.projectManagerDesignationId
      ? String(project.projectManagerDesignationId)
      : "";

    setFormData({
      name: project.name,
      prefix: project.prefix,
      projectType: project.projectType,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      designationId: desId,
      projectManagerId: project.managerId || "",
      projectManagerName: project.projectManagerName,
      clientName: project.clientName,
      clientCountry: project.clientCountry,
      clientState: project.clientState,
      clientEmail: project.clientEmail,
      clientPhone: project.clientPhone,
      address: project.address,
      description: project.description,
      managerAllocation: project.managerAllocation
        ? String(project.managerAllocation)
        : "",
    });
if (desId) {
  try {
    const managers = await getAvailableManagersForUpdate(
      Number(desId),
      Number(project.id),
    );

    const currentPm = managers.find(
      (manager) => String(manager.empId) === String(project.managerId),
    );

    if (currentPm) {
      const managerAvailability = Number(
        currentPm.availabilityPercent ?? 0,
      );

      setSelectedManagerAvailability(managerAvailability);

      // Show the existing allocation in the popup.
      setAllocationPercentage(
        Number(project.managerAllocation ?? managerAvailability),
      );

      setCurrentPmAllocation(
        Number(project.managerAllocation ?? managerAvailability),
      );

      setAllocatingManagerId(String(currentPm.empId));
      setAllocatingManagerName(
        `${currentPm.firstName} ${currentPm.lastName}`,
      );
      setAllocatingManagerDesignation(currentPm.designationName || "");
    }

    setUsers(managers);
  } catch (error) {
    console.error("Failed to load project manager availability:", error);
    setUsers([]);
  }
}

    setIsModalOpen(true);
  };

  const isFormChanged = (): boolean => {
    if (!editingProject) return true;

    const pmChanged =
      formData.projectManagerId !== String(editingProject.managerId || "");

    const allocationChanged = isUpdatingAllocation
      ? currentPmAllocation !== Number(editingProject.managerAllocation || 0)
      : Number(formData.managerAllocation || 0) !==
        Number(editingProject.managerAllocation || 0);

    return (
      formData.name !== editingProject.name ||
      formData.status !== editingProject.status ||
      formData.startDate !== editingProject.startDate ||
      formData.endDate !== editingProject.endDate ||
      formData.description !== editingProject.description ||
      formData.designationId !==
        String(editingProject.projectManagerDesignationId || "") ||
      pmChanged ||
      allocationChanged ||
      formData.clientName !== editingProject.clientName ||
      formData.clientEmail !== editingProject.clientEmail ||
      formData.clientPhone !== editingProject.clientPhone ||
      formData.clientState !== editingProject.clientState ||
      formData.clientCountry !== editingProject.clientCountry
    );
  };

  const handleDeleteClick = (project: LocalProject) => {
    setDeleteConfirmProject(project);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmProject) return;
    try {
      const response = await deleteProject(deleteConfirmProject.id);
if (
        response.status === "Success" ||
        response.statusCode === 200 ||
        response.statusCode === 204 ||
        response.success
      ) {
        await getAllProject();
        setToast({
          isOpen: true,
          message: response.statusMessage || "Project deleted successfully!",
          type: "success",
        });
        setShowDeleteConfirm(false);
        setDeleteConfirmProject(null);
      }
    } catch (error: any) {
let errorMessage =
        "Cannot delete project with allocated resources. Please remove all employees from this project first.";
      if (error.message) errorMessage = error.message;
      if (error.response?.data?.message)
        errorMessage = error.response.data.message;
      setToast({
        isOpen: true,
        message: errorMessage,
        type: "error",
      });

      setShowDeleteConfirm(false);
      setDeleteConfirmProject(null);
    }
  };
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmProject(null);
  };

  const resetForm = () => {
    setFormData(emptyForm());
    setEditingProject(null);
    setIsModalOpen(false);
    setShowAllocationPopup(false);
    setAllocatingManagerId("");
    setAllocatingManagerName("");
    setAllocatingManagerDesignation("");
    setAllocationPercentage(0);
    setCurrentPmAllocation(0);
    setIsUpdatingAllocation(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  //  -------------------------------------------------------------

  const displayedProjects = projects;

    //--------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Project Management
            </h1>
            <p className="text-gray-600">
              {isAdmin
                ? "Manage your projects and teams"
                : "View your assigned projects"}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 border border-gray-300 rounded-md px-3 py-2"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-40 border border-gray-300 rounded-md px-3 py-2 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStatusFilter("ALL");
                setSearchTerm("");
              }}
              className="px-2 py-1"
            >
              Clear
            </Button>

            {can.project.create && (
              <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
                Add Project
              </Button>
            )}
          </div>
        </div>

        {!loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProjects.map((project, index) => {

              const style = cardStyles[index % cardStyles.length];
              const Icon = projectIcons[index % projectIcons.length];
              const daysLeft = project.endDate
                ? Math.ceil(
                    (new Date(project.endDate).getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24),
                  )
                : 0;
              const statusBadge = (
                <span
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold shadow ${getStatusColor(project.status)}`}
                  style={{ zIndex: 2 }}
                >
                  {project.status}
                </span>
              );
              return (
                <Card
                  key={project.id}
                  className={`relative rounded-2xl shadow-md border border-gray-200 bg-white ${style.border} cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] hover:border-blue-300 hover:bg-blue-50`}
                 style={{ overflow: "hidden" }}
                  onClick={() => {
setGlobalProjectId(String(project?.id));
                    navigate(`/projects/${project?.id}/project-management`);
                  }}
                >
                  {statusBadge}
                  {
                    <>
                      {can.project.edit && (
                        <button
                          type="button"
                          className="absolute bottom-4 right-12 bg-white rounded-full p-1 shadow hover:bg-gray-100 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(project);
                          }}
                          title="Edit Project"
                        >
                          <Edit2 className="w-5 h-5 text-gray-500" />
                        </button>
                      )}
                      {can.project.delete && (
                        <button
                          type="button"
                          className="absolute bottom-4 right-4 bg-white rounded-full p-1 shadow hover:bg-red-100 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(project);
                          }}
                          title="Delete Project"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      )}
                    </>
                  }
                  <CardContent className="pt-7 pb-6 px-7">
                    <div className="flex items-center space-x-4 mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.iconBg}`}
                      >
                        <Icon className={`w-7 h-7 ${style.iconColor}`} />
                      </div>
                     <h3 className="min-w-0 flex-1 text-2xl font-bold text-gray-900 break-words whitespace-normal">
                      {project.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">Timeline:</span>
                      <span className="text-gray-900 font-semibold">
                        {project.startDate
                          ? new Date(project.startDate).toLocaleDateString()
                          : "Not set"}{" "}
                        -{" "}
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString()
                          : "Not set"}
                      </span>
                    </div>
                    {daysLeft > 0 && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Days Left:</span>
                        <span className="text-gray-900 font-semibold">
                          {daysLeft} days
                        </span>
                      </div>
                    )}
                    {project.projectManagerName && (
                      <div className="flex items-center space-x-2 text-gray-700 mt-2">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Project Manager:</span>
                        <span className="text-gray-900 font-semibold">
                          {project.projectManagerName}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex justify-center items-center py-20">
            <OrbitProgress
              variant="dotted"
              color="#3B82F6"
              size="medium"
              text=""
              textColor=""
            />
          </div>
        )}

        {}
        {!loading &&
          displayedProjects.length === 0 &&
          projects.length > 0 &&
          !permissionLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No projects found
                </h3>
                <p className="text-gray-500 mb-4">
                  {statusFilter !== "ALL" && searchTerm.trim()
                    ? `No "${statusFilter}" projects match "${searchTerm}".`
                    : statusFilter !== "ALL"
                      ? `No projects with "${statusFilter}" status found.`
                      : "No projects match your search."}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setSearchTerm("");
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

        {!loading && projects.length === 0 && !permissionLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isAdmin ? "No projects yet" : "No projects assigned"}
              </h3>
              <p className="text-gray-500 mb-4">
                {isAdmin
                  ? "Create your first project to get started"
                  : "You are not allocated to any projects yet"}
              </p>
              {can.project.create && (
                <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
                  Add Project
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {}
        <Modal
          isOpen={isModalOpen}
          onClose={resetForm}
          title={editingProject ? "Edit Project" : "Create Project Details"}
          size="xl"
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-300 rounded-xl p-6 md:p-8 space-y-6"
          >
            <div>
              <h2 className="font-semibold text-lg text-gray-800 mb-4">
                Project Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                 <Input
  value={formData.name}
  onChange={(e) => handleInputChange("name", e.target.value)}
  required
  maxLength={50}
  pattern="[A-Za-z]+( [A-Za-z]+)*"
  title="Project name must contain only letters and spaces and must not exceed 50 characters."
  className="w-full border border-gray-300 rounded-md px-3 py-2"
/>
                </div>
                {editingProject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>

                 <Input
  type="date"
  min={new Date().toISOString().split("T")[0]}
  value={formData.startDate}
  onChange={(e) =>
    handleInputChange("startDate", e.target.value)
  }
  required
  disabled={!!editingProject}
  className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
    editingProject ? "bg-gray-100 cursor-not-allowed" : ""
  }`}
/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                 <Input
  type="date"
  min={getNextDate(formData.startDate)}
  value={formData.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <select
                  value={formData.designationId}
                  onChange={(e) => handleDesignationChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select Designation</option>
                  {designations.map((designation) => (
                    <option
                      key={designation.designationId}
                      value={designation.designationId}
                    >
                      {designation.designationName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Manager
                </label>
                <select
                  value={formData.projectManagerId}
                  onChange={handleProjectManagerSelect}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                  disabled={!formData.designationId}
                >
                  {!formData.designationId ? (
                    <option value="">Select Designation First</option>
                  ) : users.length === 0 ? (
                    <option value="">No Users Found</option>
                  ) : (
                    <>
                      <option value="">Select User</option>
                      {users.map((user) => {
                        const isFullyAllocated = user.availabilityPercent === 0;
                        const isCurrentPm = editingProject && String(user.empId) === String(editingProject.managerId);
                        const disabled = isFullyAllocated && !isCurrentPm;
                        return (
                          <option key={user.empId} value={user.empId} disabled={disabled}>
                            {`${user.firstName} ${user.lastName}${isFullyAllocated && !isCurrentPm ? " (0% Available - Fully Allocated)" : ` (${user.availabilityPercent}% Available)`}`}
                          </option>
                        );
                      })}
                    </>
                  )}
                </select>
              </div>
            </div>

            {}
            {isUpdatingAllocation && formData.projectManagerId !== "" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Change allocation percentage of{" "}
                    <span className="font-semibold text-blue-700">
                      {allocatingManagerName}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentPm = users.find(
                      (u) => String(u.empId) === formData.projectManagerId,
                    );
                    if (currentPm) {
                      setAllocatingManagerName(
                        `${currentPm.firstName} ${currentPm.lastName}`,
                      );
                      setAllocatingManagerDesignation(
                        currentPm.designationName || "",
                      );
                      setAllocatingManagerId(String(currentPm.empId));
                      setSelectedManagerAvailability(
                        currentPm.availabilityPercent,
                      );

                      const existingAllocation = editingProject
                        ? (editingProject.managerAllocation ??
                          currentPm.availabilityPercent)
                        : formData.managerAllocation
                          ? Number(formData.managerAllocation)
                          : currentPm.availabilityPercent;
                      setAllocationPercentage(existingAllocation);
                    }
                    setShowAllocationPopup(true);
                  }}
                  className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Update
                </button>
              </div>
            )}

            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-lg text-gray-800 mb-4">
                Client Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Client Name"
                  value={formData.clientName}
                  onChange={(e) =>
                    handleInputChange("clientName", e.target.value)
                  }
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <Input
  label="Country"
  value={formData.clientCountry}
  onChange={(e) =>
    handleInputChange("clientCountry", e.target.value)
  }
  required
  pattern="[A-Za-z]+( [A-Za-z]+)*"
  title="Country must contain only letters and spaces."
  className="w-full border border-gray-300 rounded-md px-3 py-2"
/>
                <Input
  label="State"
  value={formData.clientState}
  onChange={(e) =>
    handleInputChange("clientState", e.target.value)
  }
  required
  pattern="[A-Za-z]+( [A-Za-z]+)*"
  title="State must contain only letters and spaces."
  className="w-full border border-gray-300 rounded-md px-3 py-2"
/>
                <Input
                  label="Email"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) =>
                    handleInputChange("clientEmail", e.target.value)
                  }
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <Input
                  label="Phone Number"
                  value={formData.clientPhone}
                  onChange={(e) =>
                    handleInputChange("clientPhone", e.target.value)
                  }
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 md:col-span-2"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
                className="bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md px-4 py-2"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isSubmitting || (editingProject && !isFormChanged())}
              >
                {isSubmitting
                  ? "Saving..."
                  : editingProject
                    ? "Update Project"
                    : "Save Project"}
              </Button>
            </div>
          </form>
        </Modal>

        {}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={cancelDelete}
          title="Delete Project"
          size="md"
        >
          <div className="p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Do you want to delete this project?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone. The project "
                {deleteConfirmProject?.name}" will be permanently deleted.
              </p>
              <div className="flex justify-center space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelDelete}
                  className="bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-md px-4 py-2"
                >
                  Delete Project
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {}
        <Modal
          isOpen={showAllocationPopup}
          onClose={handleCancelAllocation}
          title="Project Manager Allocation"
          size="md"
        >
          <div className="p-6 space-y-6">
            {}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 rounded-full p-2">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Selected Project Manager
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {allocatingManagerName}
                  </p>
                  {allocatingManagerDesignation && (
                    <p className="text-sm text-gray-600">
                      {allocatingManagerDesignation}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allocation Percentage
              </label>

              {}
              <div
                className="relative w-full h-3 bg-gray-200 rounded-full cursor-pointer"
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
              >
                {}
                <div
                  className="absolute top-0 left-0 h-full bg-gray-300 rounded-full"
                  style={{ width: `${selectedManagerAvailability}%` }}
                />
                {}
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-100"
                  style={{
                    width: `${(allocationPercentage / selectedManagerAvailability) * selectedManagerAvailability}%`,
                  }}
                />

                {}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md transition-all duration-100"
                  style={{ left: `calc(${allocationPercentage}% - 10px)` }}
                />
              </div>

              {}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">
                    Allocation:
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={selectedManagerAvailability}
                    value={allocationPercentage}
                    onChange={(e) =>
                      handlePercentageChange(Number(e.target.value))
                    }
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-sm font-medium text-gray-700">%</span>
                </div>
                <span className="text-sm text-gray-500">
                  Drag the slider or type a value
                </span>
              </div>

              {}
              <div className="flex items-center justify-between mt-2 mb-1">
                <span className="text-xs text-gray-500">
                  Available capacity:
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    selectedManagerAvailability === 100
                      ? "bg-green-100 text-green-700"
                      : selectedManagerAvailability >= 50
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedManagerAvailability}% available
                </span>
              </div>

              {}
              <div className="flex justify-between mt-3">
                {[10, 25, 50, 75, 100].map((value) => {
                  const isDisabled = value > selectedManagerAvailability;
                  const isSelected = allocationPercentage === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={isDisabled}
                      onClick={() =>
                        !isDisabled && handlePercentageChange(value)
                      }
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors relative ${
                        isDisabled
                          ? "bg-gray-100 text-gray-300 cursor-not-allowed line-through"
                          : isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      title={
                        isDisabled
                          ? `Exceeds availability (${selectedManagerAvailability}%)`
                          : `Set ${value}%`
                      }
                    >
                      {value}%
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400 mt-2 text-center">
                Max allocation: {selectedManagerAvailability}% (employee's
                current availability)
              </p>
            </div>{" "}
            {}
            {}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelAllocation}
                className="bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md px-4 py-2"
                disabled={isAllocating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAllocateManager}
                className={`rounded-md px-4 py-2 ${
                  allocationPercentage === 0 || isAllocating
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                disabled={allocationPercentage === 0 || isAllocating}
              >
                {isAllocating ? "Allocating..." : "Allocate"}
              </Button>
            </div>
            {allocationPercentage === 0 && (
              <p className="text-xs text-red-500 text-center">
                Please set an allocation percentage above 0%
              </p>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};
