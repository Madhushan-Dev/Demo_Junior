import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Award, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import {
  filterEmployees
} from "../services/employeeService";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Toast } from "../components/ui/Toast";
import { getAllUsersSimple } from "../api/users/getallusers";
import { createUser } from "../api/users/createUser";
import { deleteUser } from "../api/users/deleteUser";
import { getDesignations } from "../api/designation/designation";
import { updateUser, updateUserStatus } from "../api/users/updateuser";
import { usePermission } from "../context/PermissionContext";
import { useAuth } from "../context/AuthContext";

interface LocalDesignation {
  designationId: number;
  designationName: string;
}

interface LocalEmployee {
  empId: number;

  userId: number;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  whatsappNumber: string;
  name: string;
  designationId: number;
  designationName?: string;
  joinDate: string;
  isActive: boolean;
}
const NAME_PATTERN = /^[A-Za-z.]+$/;
export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<LocalEmployee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<LocalEmployee | null>(
    null,
  );
  const [viewingEmployee, setViewingEmployee] = useState<LocalEmployee | null>(
    null,
  );
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    whatsappNumber: "",
    designationId: "",
    joinDate: new Date().toISOString().split("T")[0],
  });

  const [statusModal, setStatusModal] = useState<{
    id: string;
    currentStatus: boolean;
    message: string;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { can } = usePermission();

  const [searchTerm, setSearchTerm] = useState("");
  const [isActiveFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [nameFilter, setDesignationFilter] = useState("");
  //const [allEmployees, setAllEmployees] = useState<LocalEmployee[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();

  const [names, setDesignations] = useState<LocalDesignation[]>([]);

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });
  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ isOpen: true, message, type });

  /*
  const filteredEmployees = allEmployees.filter((emp) => {
    const matchesSearch =
      !searchTerm.trim() ||
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.whatsappNumber || "").includes(searchTerm) ||
      `EMP${String(emp.empId).padStart(4, "0")}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      !isActiveFilter || String(emp.isActive) === isActiveFilter;
    const matchesGender = !genderFilter || emp.gender === genderFilter;
    const matchesDesignation =
      !nameFilter || emp.designationName === nameFilter;

    return (
      matchesSearch && matchesStatus && matchesGender && matchesDesignation
    );
  });

  */
 const filteredEmployees = employees;

 const handleFilter = async () => {
 try {
   const response = await filterEmployees(
      searchTerm,
      genderFilter,
      isActiveFilter,
      nameFilter
   );
   setEmployees(response.data);
 }
 catch(error){
   console.log(error);
 }
};


  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + rowsPerPage,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages > 0 ? totalPages : 1);
    }
  }, [totalPages, currentPage]);

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      gender: "",
      email: "",
      whatsappNumber: "",
      designationId: "",
      joinDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

const phone = formData.whatsappNumber;

if (phone.length === 0) {
  showToast("WhatsApp number is required", "error");
  return;
}

// First check spaces / non-numeric characters
if (/\s/.test(phone)) {
  showToast(
    "WhatsApp number should not contain spaces. Please enter 10 digits without spaces.",
    "error",
  );
  return;
}

if (!/^\d+$/.test(phone)) {
  showToast(
    "WhatsApp number should contain numbers only.",
    "error",
  );
  return;
}

// Then check exact digit count
if (phone.length !== 10) {
  showToast(
    `WhatsApp number must contain exactly 10 digits. You entered ${phone.length} digits.`,
    "error",
  );
  return;
}

const email = formData.email.trim();
if (email.length === 0) {
  showToast("Email is required", "error");
  return;
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  showToast(
    "Please enter a valid email address (e.g. example@gmail.com)",
    "error",
  );
  return;
}

const isDuplicateEmail = employees.some(
  (emp) =>
    emp.email.toLowerCase() === email.toLowerCase() &&
    (!editingEmployee || emp.empId !== editingEmployee.empId)
);
if (isDuplicateEmail) {
  showToast(
    "This email address is already used by another employee",
    "error",
  );
  return;
}

    if (savingEmployee) return;

    if (
      !NAME_PATTERN.test(formData.firstName) ||
      !NAME_PATTERN.test(formData.lastName)
    ) {
      showToast(
        "Names can only contain letters and '.' (e.g. S.H.Hasan)",
        "error",
      );
      return;
    }

    setSavingEmployee(true);
    try {
      if (editingEmployee) {
        const updatePayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          whatsappNumber: formData.whatsappNumber,
          gender: formData.gender,
          joinDate: formData.joinDate,
          designationId: Number(formData.designationId),
        };
        const response = await updateUser(
          Number(editingEmployee.empId),
          updatePayload,
        );
        await getAllEmployees();
        showToast(response.statusMessage);
      } else {
        const apiPayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender,
          email: formData.email,
          whatsappNumber: formData.whatsappNumber,
          designationId: Number(formData.designationId),
          joinDate: formData.joinDate,
        };
        const response = await createUser(apiPayload);
        await getAllEmployees();
        showToast(response.statusMessage);
      }
      setEditingEmployee(null);
      resetForm();
      setIsModalOpen(false);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.statusMessage || "Failed to save Employee";
      showToast(errorMsg, "error");
    } finally {
      setSavingEmployee(false);
    }
  };

  const handleEdit = (employee: LocalEmployee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      gender: employee.gender,
      email: employee.email,
      whatsappNumber: employee.whatsappNumber,
      designationId: String(employee.designationId),
      joinDate: employee.joinDate ? employee.joinDate.split("T")[0] : "",
    });
    setIsModalOpen(true);
  };

  const getAllEmployees = async () => {
    try {
      const response = await getAllUsersSimple(0, 1000);
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.content)
          ? response.data.content
          : [];

        const sortedList = [...list].sort((a, b) => a.empId - b.empId);

      
      setEmployees(sortedList);
    } catch (error) {
}
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await getAllEmployees();
    } catch (error) {
} finally {
      setRefreshing(false);
    }
  };

  const getAllDesignations = async () => {
    const response = await getDesignations(0, 100);
    const uniqueData = response.data.content.filter(
      (value: LocalDesignation, index: number, self: LocalDesignation[]) =>
        index ===
        self.findIndex((t) => t.designationName === value.designationName),
    );
    setDesignations(uniqueData);
  };
//--------------------------------------------------------------------------

useEffect(() => {

    getAllEmployees();

}, []);useEffect(()=>{

 handleFilter();

},[
 searchTerm,
 genderFilter,
 isActiveFilter,
 nameFilter
]);
//-------------------------------------------------------------------------
  useEffect(() => {
    getAllDesignations();
  }, []);

  const handleView = (employee: LocalEmployee) => {
    setViewingEmployee(employee);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await deleteUser(Number(deleteId));
      await getAllEmployees();
      showToast(response.statusMessage || "Employee Deleted Successfully");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.statusMessage ||
        "Employee Already Linked - Cannot Delete";
      showToast(errorMsg, "error");
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusChange = (
  empId: string,
  employeeUserId: number,
  currentStatus: boolean,
) => {
  if (String(user?.userId) === String(employeeUserId)) {
    showToast("You cannot change your own status", "error");
    return;
  }
  setStatusModal({
    id: empId,
    currentStatus,
    message: currentStatus
      ? "Do you want to change status to Inactive?"
      : "Do you want to change status to Active?",
  });
};

 const confirmStatusChange = async () => {
  if (!statusModal || statusUpdating) return;
  setStatusUpdating(true);
  const newStatus = !statusModal.currentStatus;
  try {
    const response = await updateUserStatus(
      Number(statusModal.id),
      newStatus,
    );
    await getAllEmployees();
    showToast(response.statusMessage || "Status Updated", "success");
    setStatusModal(null);
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.statusMessage || "Failed to Change Status";
    showToast(errorMsg, "error");
    setStatusModal(null);
  } finally {
    setStatusUpdating(false);
  }
};

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (deleteId) confirmDelete();
      if (statusModal) confirmStatusChange();
    }
    if (e.key === "Escape") {
      setDeleteId(null);
      setStatusModal(null);
    }
  };

  

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "firstName" || field === "lastName") {
      const stringValue = typeof value === "string" ? value : "";
      const filtered = stringValue.replace(/[^A-Za-z.]/g, "");
      const formatted =
        filtered.charAt(0).toUpperCase() + filtered.slice(1).toLowerCase();
      setFormData((prev) => ({ ...prev, [field]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const isFormChanged = () => {
    if (!editingEmployee) return true;

    return (
      formData.firstName !== editingEmployee.firstName ||
      formData.lastName !== editingEmployee.lastName ||
      formData.gender !== editingEmployee.gender ||
      formData.email !== editingEmployee.email ||
      formData.whatsappNumber !== editingEmployee.whatsappNumber ||
      Number(formData.designationId) !==
        Number(editingEmployee.designationId) ||
      formData.joinDate !==
        (editingEmployee.joinDate ? editingEmployee.joinDate.split("T")[0] : "")
    );
  };

  const formatEmployeeId = (id: string | number) => {
    const num = typeof id === "string" ? parseInt(id, 10) : id;
    if (isNaN(num)) return String(id);
    return `EMP${num.toString().padStart(4, "0")}`;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="error">Inactive</Badge>
    );
  };

  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  const uniqueDesignations = names;

  const clearFilters = () => {
    setStatusFilter("");
    setGenderFilter("");
    setDesignationFilter("");
    setCurrentPage(1);
  };

  return (
    <div
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Employee Management
            </h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 border border-gray-300 px-2 py-1 rounded-lg bg-white hover:text-black transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "..." : ""}
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            Manage your team members and their information
          </p>
        </div>
        {can.employee.create && (
          <Button
            onClick={() => {
              resetForm();
              setEditingEmployee(null);
              setIsModalOpen(true);
            }}
            icon={Plus}
            className="shadow-lg hover:shadow-xl transition-shadow duration-200"
          >
            Add Employee
          </Button>
        )}
      </div>

      {}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 mt-4">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            /*
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            */
            onChange={(e)=>{
            setSearchTerm(e.target.value);

}}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full pr-8"
          />
          {searchTerm.trim() && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={isActiveFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 min-w-[120px]"
          >
            <option value="">All Statuses</option>
            <option value="true">
 Active
</option>

<option value="false">
 Inactive
</option>
          </select>
          <select
            value={genderFilter}
            /*
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setCurrentPage(1);
            }}

            */
            onChange={(e)=>{
 setGenderFilter(e.target.value);

}}
            className="border border-gray-300 rounded-lg px-3 py-2 min-w-[120px]"
          >
            <option value="">
 All Genders
</option>

<option value="Male">
 Male
</option>

<option value="female">
 Female
</option>
          </select>
          <select
            value={nameFilter}
            onChange={(e) => {
              setDesignationFilter(e.target.value);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 min-w-[140px]"
          >
            <option value="">All Designations</option>
            {uniqueDesignations.map((d) => (
              <option key={d.designationId} value={d.designationName}>
                {d.designationName}
              </option>
            ))}
          </select>
          <button
            onClick={clearFilters}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-700 transition-all duration-200 hover:bg-white-100 hover:text-black hover:shadow-md active:scale-95"
          >
            Clear
          </button>
        </div>
      </div>

      {}
      <Card className="shadow-lg">
        <CardHeader>
          <h3 className="text-xl font-semibold text-gray-900">
            Employee Directory
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {paginatedEmployees.length > 0 ? (
                <table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableCell header className="whitespace-nowrap">
                        Employee ID
                      </TableCell>
                      <TableCell header className="whitespace-nowrap">
                        First Name
                      </TableCell>
                      <TableCell header className="whitespace-nowrap">
                        Last Name
                      </TableCell>
                      <TableCell header className="whitespace-nowrap">
                        Gender
                      </TableCell>
                      <TableCell header className="whitespace-nowrap">
                        Designation
                      </TableCell>
                      <TableCell header className="whitespace-nowrap">
                        Whatsup Number
                      </TableCell>
                      <TableCell header className="whitespace-nowrap">
                        Email ID
                      </TableCell>
                      <TableCell header className="whitespace-nowrap">
                        Join Date
                      </TableCell>
                      <TableCell header className="whitespace-nowrap">
                        Status
                      </TableCell>
                      {(can.employee.edit || can.employee.delete) && (
                        <TableCell header className="whitespace-nowrap">
                          Actions
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmployees.map((emp) => (
                      <TableRow key={emp.empId}>
                        <TableCell className="font-mono text-sm">
                          {formatEmployeeId(emp.empId)}
                        </TableCell>
                        <TableCell>{emp.firstName}</TableCell>
                        <TableCell>{emp.lastName}</TableCell>
                        <TableCell>{emp.gender || "-"}</TableCell>
                        <TableCell>{emp.designationName || "-"}</TableCell>
                        <TableCell>{emp.whatsappNumber || "-"}</TableCell>
                        <TableCell>{emp.email || "-"}</TableCell>
                        <TableCell className="text-sm">
                          {emp.joinDate
                            ? new Date(emp.joinDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <button
                            disabled={
                              !can.employee.statusUpdate || statusUpdating
                            }
                            data-modal-target="popup-modal"
                            data-modal-toggle="popup-modal"
                            onClick={() =>
  handleStatusChange(
    emp.empId.toString(),
    emp.userId,
    emp.isActive,
  )
}
                          >
                            {getStatusBadge(emp.isActive)}
                          </button>
                        </TableCell>
                        {(can.employee.edit || can.employee.delete) && (
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {can.employee.edit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(emp)}
                                  className="p-2 hover:bg-yellow-50 text-yellow-600"
                                  title="Edit Employee"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              {can.employee.delete && (
                                <Button
                                  data-modal-target="popup-modal"
                                  data-modal-toggle="popup-modal"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete(emp.empId.toString())
                                  }
                                  className="p-2 hover:bg-red-50 text-red-600"
                                  title="Delete Employee"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm.trim() ||
                    isActiveFilter ||
                    genderFilter ||
                    nameFilter
                      ? "No employees found"
                      : "No employees yet"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm.trim() ||
                    isActiveFilter ||
                    genderFilter ||
                    nameFilter
                      ? "Try adjusting your filter criteria"
                      : "Get started by adding your first employee"}
                  </p>
                  {!searchTerm.trim() &&
                    !isActiveFilter &&
                    !genderFilter &&
                    !nameFilter && (
                      <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
                        Add Employee
                      </Button>
                    )}
                </div>
              )}
            </div>
            {}
            <div
              className="sticky bottom-0 left-0 right-0 w-full bg-white border-t z-50"
              style={{ boxShadow: "0 -2px 8px rgba(0,0,0,0.04)" }}
            >
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 whitespace-nowrap">
                    Rows per page:
                  </span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-700 ml-2">
                    Total: {filteredEmployees.length} Employees
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="px-2 py-1 rounded border bg-gray-100 text-gray-700 disabled:opacity-50 text-sm"
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page =
                      Math.max(1, Math.min(currentPage - 2, totalPages - 4)) +
                      i;
                    return page <= totalPages ? (
                      <button
                        key={page}
                        className={`w-8 h-8 rounded text-sm font-medium ${currentPage === page ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ) : null;
                  })}
                  <button
                    className="px-2 py-1 rounded border bg-gray-100 text-gray-700 disabled:opacity-50 text-sm"
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    &gt;
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 whitespace-nowrap">
                    Go to
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v >= 1 && v <= totalPages) {
                        handlePageChange(v);
                      }
                    }}
                    className="w-12 border rounded px-1 py-1 text-center text-sm"
                  />
                  <span className="text-sm text-gray-700 whitespace-nowrap">
                    / {totalPages}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
          resetForm();
        }}
        title={editingEmployee ? "Edit Employee" : "Add New Employee"}
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              placeholder="Enter first name"
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              placeholder="Enter last name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation
              </label>
              <select
                value={formData.designationId}
                onChange={(e) =>
                  setFormData({ ...formData, designationId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="" disabled>
                  Select designation
                </option>
                {names.map((d) => (
                  <option key={d.designationId} value={d.designationId}>
                    {d.designationName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email ID"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter Email ID"
              required
            />
            <Input
              label="Whatsup Number"
              value={formData.whatsappNumber}
              onChange={(e) =>
                handleInputChange("whatsappNumber", e.target.value)
              }
              placeholder="Enter Whatsup number"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
           <Input
  label="Join date"
  type="date"
  max={new Date().toISOString().split("T")[0]}
  min="2025-01-01"
  value={formData.joinDate}
  onChange={(e) => handleInputChange("joinDate", e.target.value)}
  required
/>
          </div>
          <div className="flex justify-start space-x-3 pt-2">
            <Button
              type="submit"
              disabled={
                savingEmployee || (!!editingEmployee && !isFormChanged())
              }
            >
              {savingEmployee
                ? editingEmployee
                  ? "Updating..."
                  : "Saving..."
                : editingEmployee
                  ? "Update Employee"
                  : "Save Employee"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={savingEmployee}
              onClick={resetForm}
            >
              Clear
            </Button>
          </div>
        </form>
      </Modal>

      {}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingEmployee(null);
        }}
        title="Employee Details"
        size="lg"
      >
        {viewingEmployee && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Basic Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Employee ID:</span>{" "}
                      {formatEmployeeId(viewingEmployee.empId)}
                    </p>
                    <p>
                      <span className="font-medium">First Name:</span>{" "}
                      {viewingEmployee.firstName}
                    </p>
                    <p>
                      <span className="font-medium">Last Name:</span>{" "}
                      {viewingEmployee.lastName}
                    </p>
                    <p>
                      <span className="font-medium">Gender:</span>{" "}
                      {viewingEmployee.gender}
                    </p>
                    <p>
                      <span className="font-medium">Designation:</span>{" "}
                      {viewingEmployee.designationName}
                    </p>
                    <p>
                      <span className="font-medium">Whatsup Number:</span>{" "}
                      {viewingEmployee.whatsappNumber}
                    </p>
                    <p>
                      <span className="font-medium">Email ID:</span>{" "}
                      {viewingEmployee.email}
                    </p>
                    <p>
                      <span className="font-medium">Join Date:</span>{" "}
                      {viewingEmployee.joinDate
                        ? new Date(
                            viewingEmployee.joinDate,
                          ).toLocaleDateString()
                        : "-"}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {getStatusBadge(viewingEmployee.isActive)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="mb-4 text-center">
              Are you sure you want to delete employee{" "}
              {formatEmployeeId(deleteId)}?
            </h3>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteId(null)}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                autoFocus
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40">
          <div className="relative p-4 w-full max-w-md">
            <div className="relative bg-white border rounded-lg shadow-sm p-4 md:p-6">
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => setStatusModal(null)}
                className="absolute top-3 right-2.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm w-9 h-9 inline-flex justify-center items-center"
              >
                ✕
              </button>
              <div className="p-4 md:p-5 text-center">
                <div className="mx-auto mb-4 text-gray-400 w-12 h-12 text-4xl">
                  {statusModal.currentStatus ? "❌" : "✅"}
                </div>
                <h3 className="mb-6 text-gray-700">{statusModal.message}</h3>
                <div className="flex items-center space-x-4 justify-center">
                  <button
                    autoFocus
                    type="button"
                    disabled={statusUpdating}
                    onClick={confirmStatusChange}
                    className={`text-white font-medium rounded-lg text-sm px-4 py-2.5 ${
                      statusModal.currentStatus
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    } ${statusUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {statusUpdating ? "Updating..." : "Yes, I'm sure"}
                  </button>
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => setStatusModal(null)}
                    className="text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium rounded-lg text-sm px-4 py-2.5"
                  >
                    No, cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
};
