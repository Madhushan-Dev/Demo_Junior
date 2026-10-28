import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { ChevronLeft, Plus, Edit2, Trash2, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Toast } from "../components/ui/Toast";
import {
  createReleaseType,
  deleteReleaseType,
  getAllReleaseTypes,
  updateReleaseType,
} from "../api/Releasetype.ts";
import { usePermission } from "../context/PermissionContext.tsx";
import { OrbitProgress } from "react-loading-indicators";

interface ReleaseTypeModel {
  id: number;
  name: string;
}

const ReleaseType: React.FC = () => {
  const navigate = useNavigate();

  const [releaseTypes, setReleaseTypes] = useState<ReleaseTypeModel[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingReleaseType, setEditingReleaseType] =
    useState<ReleaseTypeModel | null>(null);
  const [deletingReleaseType, setDeletingReleaseType] =
    useState<ReleaseTypeModel | null>(null);
  const [formData, setFormData] = useState({ releaseTypeName: "" });

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({ isOpen: false, message: "", type: "success" });
  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ isOpen: true, message, type });

  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 5;
  const [totalPages, setTotalPage] = useState<number>(0);

  const { can } = usePermission();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToast({ isOpen: false, message: "", type: "success" });
    handleGetAll();
  }, [currentPage]);

   const resetForm = () => setFormData({ releaseTypeName: "" });

  const validateForm = () => {
    const value = formData.releaseTypeName.trim();
    if (!value)
      return { isValid: false, message: "Release Type Name cannot be empty." };
    if (!/^[A-Za-z][A-Za-z ]*$/.test(value))
      return {
        isValid: false,
        message:
          "Release Type Name must start with a letter and can only contain alphabets and spaces.",
      };
    return { isValid: true, message: "" };
  };

    const handleCreate = async () => {
    const v = validateForm();
    if (!v.isValid) {
      showToast(v.message, "error");
      return;
    }

    const exists = releaseTypes.some(
      (rt) =>
        rt.name.trim().toLowerCase() ===
        formData.releaseTypeName.trim().toLowerCase(),
    );
    if (exists) {
      setIsCreateModalOpen(false);
      resetForm();
      showToast("Release Type Name already exists.", "error");
      return;
    }
    try {
      await createReleaseType(formData);
      await handleGetAll();
      setIsCreateModalOpen(false);
      resetForm();
      showToast("Release type created successfully!", "success");
    } catch (error: any) {
      showToast(error.message || "An error occurred", "error");
      return;
    }
  };

  const handleGetAll = async () => {
    try {
      setLoading(true);
      const response = await getAllReleaseTypes(currentPage, pageSize);
      const rawList = response.data?.content || [];
      const mappedList = rawList.map((item: any) => ({
        id: item.id,
        name: item.name || item.releaseTypeName || "",
      }));
      setReleaseTypes(mappedList);
      setTotalPage(
        Math.ceil(
          (response.data?.totalElements || mappedList.length) / pageSize,
        ) || 1,
      );
    } catch (error) {
      setLoading(false);
} finally {
      setLoading(false);
    }
  };

         const handleEdit = async () => {
    if (!editingReleaseType) return;

    const v = validateForm();
    if (!v.isValid) {
      showToast(v.message, "error");
      return;
    }

       const trimmedName = formData.releaseTypeName.trim();
    if (trimmedName === editingReleaseType.name.trim()) {
      setIsEditModalOpen(false);
      setEditingReleaseType(null);
      resetForm();
      showToast("No changes made to update.", "error");
      return;
    }
    

    try {
      await updateReleaseType(editingReleaseType.id, {
        releaseTypeName: formData.releaseTypeName,
      });

      await handleGetAll();

      setIsEditModalOpen(false);
      setEditingReleaseType(null);
      resetForm();

      showToast("Release type updated successfully!", "success");
    } catch (error: any) {
      showToast(error.message || "Error updating release type", "error");
    }
  };

  const handleDelete = async () => {
    if (!deletingReleaseType) return;
    try {
      const response = await deleteReleaseType(deletingReleaseType.id);
      setReleaseTypes((prev) =>
        prev.filter((rt) => rt.id !== deletingReleaseType.id),
      );
      showToast(response.statusMessage);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Failed to Delete Employee";
      showToast(errorMsg, "error");
    }

    setIsDeleteModalOpen(false);
  };

  const openEditModal = (releaseType: ReleaseTypeModel) => {
    setEditingReleaseType(releaseType);
    setFormData({ releaseTypeName: releaseType.name });
    setIsEditModalOpen(true);
  };
  const openDeleteModal = (releaseType: ReleaseTypeModel) => {
    setDeletingReleaseType(releaseType);
    setIsDeleteModalOpen(true);
  };

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
          <Rocket className="w-8 h-8 text-blue-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Release Type Management
          </h1>
        </div>
        {can.releaseType.create && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Create Release Type
          </Button>
        )}
      </div>
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
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Release Type
                </th>
                {(can.releaseType.edit || can.releaseType.delete) && (
                  <th className="px-5 py-3 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {releaseTypes.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-5 py-3 text-center text-gray-500"
                  >
                    No release types found.
                  </td>
                </tr>
              ) : (
                releaseTypes.map((releaseType) => (
                  <tr key={releaseType.id}>
                    <td className="px-5 py-3 whitespace-nowrap font-semibold text-gray-900 text-base">
                      {releaseType.name}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-center">
                      {can.releaseType.edit && (
                        <button
                          onClick={() => openEditModal(releaseType)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded mr-2"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      )}
                      {can.releaseType.delete && (
                        <button
                          onClick={() => openDeleteModal(releaseType)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4">
            <button
              className="px-3 py-1 rounded border bg-gray-100 text-gray-700 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-3 py-1 rounded border ${currentPage === i ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
                onClick={() => setCurrentPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded border bg-gray-100 text-gray-700 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </button>
          </div>
        )}
      </div>
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Release Type"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Release Type Name
            </label>
            <Input
              value={formData.releaseTypeName}
              onChange={(e) =>
                setFormData({ ...formData, releaseTypeName: e.target.value })
              }
              placeholder="Enter release type name"
            />
          </div>
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
            <Button onClick={handleCreate} disabled={!formData.releaseTypeName}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingReleaseType(null);
          resetForm();
        }}
        title="Edit Release Type"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Release Type Name
            </label>
            <Input
              value={formData.releaseTypeName}
              onChange={(e) =>
                setFormData({ ...formData, releaseTypeName: e.target.value })
              }
              placeholder="Enter release type name"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingReleaseType(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.releaseTypeName}>
              Update
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingReleaseType(null);
        }}
        title="Delete Release Type"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the release type "
            {deletingReleaseType?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingReleaseType(null);
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

export default ReleaseType;
