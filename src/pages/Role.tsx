import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { ChevronLeft, Plus, Edit2, Trash2, UserCog } from "lucide-react";
import { Toast } from "../components/ui/Toast";
import { getAllRoles } from "../api/role/viewrole";
import { createRoles } from "../api/role/createrole";
import { updateRole } from "../api/role/updaterole";
import { deleterole } from "../api/role/deleterole";
import { usePermission } from "../context/PermissionContext";
import { ROLE_TYPES } from "../enums/RoleType";
import { OrbitProgress } from "react-loading-indicators";
interface Role {
  id: number;
  name: string;
  type: string;
}

const Role: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({ name: "", type: "" });

  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({ isOpen: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ isOpen: true, message, type });

  const getErrorMessage = (error: any, fallback: string): string => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.statusMessage ||
      fallback
    );
  };

  const { can } = usePermission();

  const fetchRoles = async (page: number, pageSize: number) => {
  try {
    setLoading(true);

    const res = await getAllRoles(page-1, pageSize);

    console.log("ROLE GET RESPONSE:", res);
    console.log("ROLE CONTENT:", res.content);

    setTotalPages(res.totalPages);
    setRoles(
      res.content.map((item) => ({
        id: item.roleId,
        name: item.roleName,
        type: item.roleType,
      })),
    );

    
    
  } catch (error) {
    console.error("FETCH ROLES ERROR:", error);
    showToast("Failed to fetch roles", "error");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchRoles(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const resetForm = () => setFormData({ name: "", type: "" });

  const validateForm = () => {
    if (!formData.name.trim())
      return { isValid: false, message: "Role Name cannot be empty." };
    if (!/^[A-Za-z ]+$/.test(formData.name.trim()))
      return {
        isValid: false,
        message: "Role Name can only contain alphabets and spaces.",
      };
    if (!formData.type)
      return { isValid: false, message: "Please select a Role Type." };
    return { isValid: true, message: "" };
  };

  const handleCreate = async () => {
  try {
    await createRoles({
      roleName: formData.name.trim(),
      roleType: formData.type,
    });

    showToast("Role created successfully!", "success");

    setIsCreateModalOpen(false);
    resetForm();

    await fetchRoles(currentPage, pageSize);
    

  } catch (error: any) {
  console.error("CREATE ROLE ERROR:", error);

  if (error?.response?.status === 409) {
  showToast(
    getErrorMessage(error, "Role Name already exists"),
    "error"
  );
} else {
  showToast(
    getErrorMessage(error, "Failed to create role"),
    "error"
  );
}
}
};

  const handleEdit = async () => {
    if (!editingRole) return;

    const nameUnchanged = 
      formData.name.trim() === editingRole.name.trim();

    const typeUnchanged = 
      formData.type === editingRole.type;

    if (nameUnchanged && typeUnchanged) {
      showToast("No changes were made to the role", "error");
      return;
    }
    const v = validateForm();

    if (!v.isValid) {
      showToast(v.message, "error");
      return;
    }

    const exists = roles.some(
      (r) =>
        r.name.trim().toLowerCase() === 
          formData.name.trim().toLowerCase() &&
        r.id !== editingRole.id,
    );

    if (exists) {
      showToast("Role already exists", "error");
      return;
    }

    try {
      await updateRole(editingRole.id, {
        roleName: formData.name.trim(),
        roleType: formData.type,
      });

      showToast("Role updated successfully!", "success");

      setIsEditModalOpen(false);
      setEditingRole(null);
      resetForm();

       await fetchRoles(currentPage, pageSize);

    } catch (error) {
      showToast(getErrorMessage(error, "Failed to update role"), "error");
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    try {
      await deleterole(deletingRole.id);
      showToast("Role deleted successfully!", "success");
      setIsDeleteModalOpen(false);
      setDeletingRole(null);
      
      setRoles((prevRoles) =>
      prevRoles.filter((role) => role.id !== deletingRole.id)
    );

    if (roles.length === 1 && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }

    } catch (error) {
      setIsDeleteModalOpen(false);
      setDeletingRole(null);
      showToast(getErrorMessage(error, "Failed to delete role"), "error");
    }
  };

  const openEditModal = (role: Role) => {
setEditingRole(role);
    setFormData({ name: role.name, type: role.type });
    setIsEditModalOpen(true);
  };
  const openDeleteModal = (role: Role) => {
    setDeletingRole(role);
    setIsDeleteModalOpen(true);
  };

  const renderFormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role Name
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter role name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role Type
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select Role Type --</option>
          {ROLE_TYPES.map((rt) => (
            <option key={rt.value} value={rt.value}>
              {rt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8">
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
      <div className="mb-6 flex justify-end">
        <Button
          variant="secondary"
          onClick={() => navigate("/configurations")}
          className="flex items-center"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back
        </Button>
      </div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <UserCog className="w-8 h-8 text-blue-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
        </div>
        {can.role.create && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Create Role
          </Button>
        )}
      </div>

      {}
      <div className="overflow-x-auto rounded-lg shadow mb-8 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20 min-h-[200px]">
            <OrbitProgress
              variant="dotted"
              color="#3B82F6"
              size="medium"
              text="Loading ..."
              textColor="#6b7280"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-base">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>

                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                {(can.role.edit || can.role.delete) && (
                  <th className="px-5 py-3 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-3 text-center text-gray-500"
                  >
                    No roles found.
                  </td>
                </tr>
              )}
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className="px-5 py-3 whitespace-nowrap font-semibold text-gray-900">
                    {role.name}
                  </td>
                  {}
                  <td className="px-5 py-3 whitespace-nowrap text-gray-600 text-sm">
                    {ROLE_TYPES.find((rt) => rt.value === role.type)?.label ??
                      role.type}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-center">
                    {can.role.edit && (
                      <button
                        onClick={() => openEditModal(role)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded mr-2"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    )}
                    {can.role.delete && (
                      <button
                        onClick={() => openDeleteModal(role)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4">
            <button
              className="px-3 py-1 rounded border bg-gray-100 text-gray-700 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-3 py-1 rounded border ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded border bg-gray-100 text-gray-700 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Role"
        size="sm"
      >
        <div className="space-y-4">
          {renderFormFields()}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || !formData.type}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRole(null);
          resetForm();
        }}
        title="Edit Role"
        size="sm"
      >
        <div className="space-y-4">
          {renderFormFields()}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingRole(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formData.name || !formData.type}
            >
              Update
            </Button>
          </div>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingRole(null);
        }}
        title="Delete Role"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the role "{deletingRole?.name}"?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingRole(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Role;
