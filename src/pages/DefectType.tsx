import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { ChevronLeft, Plus, Edit2, Trash2, Bug } from "lucide-react";
import { Toast } from "../components/ui/Toast";
import {
  createDefectType,
  deleteDefectType,
  getDefectTypes,
  updateDefectType,
} from "../api/defectType";
import { usePermission } from "../context/PermissionContext";
import { OrbitProgress } from "react-loading-indicators";

interface DefectType {
  id: number;
  name: string;
}

const DefectType: React.FC = () => {
  const navigate = useNavigate();
  const [defectTypes, setDefectTypes] = useState<DefectType[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingDefectType, setEditingDefectType] = useState<DefectType | null>(
    null,
  );
  const [deletingDefectType, setDeletingDefectType] =
    useState<DefectType | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [nextId, setNextId] = useState(1);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({ isOpen: false, message: "", type: "success" });
  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ isOpen: true, message, type });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const { can } = usePermission();
const normalizeName = (name: string) =>
  name.trim().replace(/\s+/g, " ");


 const validateForm = () => {
  const normalizedName = normalizeName(formData.name);

  if (!normalizedName) {
    return {
      isValid: false,
      message: "Defect Type cannot be empty.",
    };
  }

  if (normalizedName.length > 100) {
    return {
      isValid: false,
      message: "Defect Type cannot exceed 100 characters.",
    };
  }

  if (!/^[A-Za-z ]+$/.test(normalizedName)) {
    return {
      isValid: false,
      message: "Defect Type can only contain alphabets and spaces.",
    };
  }

  return { isValid: true, message: "" };
};

  useEffect(() => {
    setToast({ isOpen: false, message: "", type: "success" });
    setCurrentPage(1);
  }, []);
const fetchDefectTypes = async (page: number, pageSize: number) => {
    try {
      setLoading(true);
      const res = await getDefectTypes(page, pageSize);
      setTotalPages(res.data.totalPages);
      setDefectTypes(
        res.data.content.map((item) => ({
          id: item.defectTypeId,
          name: item.defectTypeName,
        })),
      );
    } catch (error: any) {
      setLoading(false);
      const errorMessage =
        error.response?.data?.data[0]?.message ||
        "Failed to fetch Defect Types";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefectTypes(currentPage - 1, pageSize);
    setToast({ isOpen: false, message: "", type: "success" });
  }, [currentPage]);

  const resetForm = () => setFormData({ name: "" });

  const handleCreate = async () => {
    const v = validateForm();
    if (!v.isValid) {
      showToast(v.message, "error");
      return;
    }

    try {
      const response = await createDefectType({
        // defectTypeName: formData.name.trim(),
        defectTypeName: normalizeName(formData.name)
      });
      showToast("Defect Type created successfully!", "success");
      setIsCreateModalOpen(false);
      resetForm();
      await fetchDefectTypes(0, pageSize);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.data[0]?.message ||
        "Failed to create Defect Type";
      showToast(errorMessage, "error");
    }
  };

  const handleEdit = async () => {
if (!editingDefectType) {
return;
    }
    if ( normalizeName(formData.name) ===
  normalizeName(editingDefectType.name)) {
      showToast("No changes were made to the Defect Type", "error");
      return;
    }
    const v = validateForm();
    if (!v.isValid) {
      showToast(v.message, "error");
      return;
    }
    const exists = defectTypes.some(
      (r) =>
        r.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
        r.id !== editingDefectType.id,
    );
    if (exists) {
      showToast("Defect Type already exists", "error");
      return;
    }
    try {
await updateDefectType(editingDefectType.id, {
        // defectTypeName: formData.name.trim(),
        defectTypeName: normalizeName(formData.name)
      });
      setDefectTypes((prev) =>
        prev.map((dt) =>
          dt.id === editingDefectType.id
            ? { ...dt, name: normalizeName(formData.name), }
            : dt,
        ),
      );
      showToast("Defect Type updated successfully!", "success");
      setIsEditModalOpen(false);
      setEditingDefectType(null);
      resetForm();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.data[0]?.message ||
        "Failed to update Defect Type";
      showToast(errorMessage, "error");
    }
  };

  const handleDelete = async () => {
    if (!deletingDefectType) return;
    try {
      await deleteDefectType(deletingDefectType.id);
      showToast("Defect Type deleted successfully!", "success");
      setIsDeleteModalOpen(false);
      setDeletingDefectType(null);
      await fetchDefectTypes(0, pageSize);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.data[0]?.message ||
        "Failed to delete Defect Type";
      showToast(errorMessage, "error");
    }
  };

  const openEditModal = (defectType: DefectType) => {
    setEditingDefectType(defectType);
    setFormData({ name: defectType.name });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (defectType: DefectType) => {
    setDeletingDefectType(defectType);
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
          <Bug className="w-8 h-8 text-blue-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Defect Type Management
          </h1>
        </div>
        {can.defectType.create && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Create Defect Type
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
                  Defect Type
                </th>
                {(can.defectType.edit || can.defectType.delete) && (
                  <th className="px-5 py-3 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {defectTypes.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-5 py-3 text-center text-gray-500"
                  >
                    No defect types found.
                  </td>
                </tr>
              ) : (
                defectTypes.map((defectType) => (
                  <tr key={defectType.id}>
                    <td className="px-5 py-3 whitespace-nowrap font-semibold text-gray-900 text-base">
                      {defectType.name}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-center">
                      {can.defectType.edit && (
                        <button
                          onClick={() => openEditModal(defectType)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded mr-2"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      )}
                      {can.defectType.delete && (
                        <button
                          onClick={() => openDeleteModal(defectType)}
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
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Defect Type"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Defect Type Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter defect type name"
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
            {can.defectType.create && (
              <Button onClick={handleCreate} disabled={!formData.name}>
                Create
              </Button>
            )}
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDefectType(null);
          resetForm();
        }}
        title="Edit Defect Type"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Defect Type Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter defect type name"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingDefectType(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name}>
              Update
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingDefectType(null);
        }}
        title="Delete Defect Type"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the defect type "
            {deletingDefectType?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingDefectType(null);
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

export default DefectType;
