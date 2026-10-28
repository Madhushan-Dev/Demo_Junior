import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Table, TableBody, TableCell, TableRow } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { ChevronLeft, Plus, Edit2, Trash2, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Toast } from "../components/ui/Toast";
import { HexColorPicker } from "react-colorful";
import {
  getAllPriorities,
  createPriority,
  updatePriority,
  deletePriority,
} from "../api/priority";
import { usePermission } from "../context/PermissionContext";
import { OrbitProgress } from "react-loading-indicators";

interface Priority {
  priorityId: number;
  priorityName: string;
  colorCode: string;
}

const normalizeColor = (color: string): string => {
  if (!color) return "#000000";

  const cleanColor = color.replace(/[^0-9A-Fa-f]/g, "");

  switch (cleanColor.length) {
    case 1:
      return `#${cleanColor.repeat(6)}`;

    case 2:
      return `#${cleanColor}${cleanColor}${cleanColor}`;

    case 3:
      return `#${cleanColor[0]}${cleanColor[0]}${cleanColor[1]}${cleanColor[1]}${cleanColor[2]}${cleanColor[2]}`;

    case 4:
      return `#${cleanColor}${cleanColor[0]}${cleanColor[1]}`;

    case 5:
      return `#${cleanColor}${cleanColor[0]}`;

    default:
      return `#${cleanColor.substring(0, 6)}`;
  }
};

const Priority: React.FC = () => {
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [nextId, setNextId] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({ isOpen: false, message: "", type: "success" });
  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ isOpen: true, message, type });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null);
  const [deletingPriority, setDeletingPriority] = useState<Priority | null>(
    null,
  );
  const [formData, setFormData] = useState({ name: "", color: "#000000" });
  const [showColorPickerCreate, setShowColorPickerCreate] = useState(false);
  const [showColorPickerEdit, setShowColorPickerEdit] = useState(false);
  const [colorError, setColorError] = useState("");
  const [loading, setLoading] = useState(false);
  const { can } = usePermission();

  const fetchPriorities = async (page: number, size: number) => {
    try {
      setLoading(true);
      const data = await getAllPriorities(page, size);
      setTotalPages(data.data.totalPages || 0);
      setPriorities(data.data.content || []);
    } catch (error) {
      setLoading(false);
      showToast("Failed to load designations.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriorities(currentPage - 1, pageSize);
setToast({ isOpen: false, message: "", type: "success" });
  }, [currentPage]);

  useEffect(() => {
    if (isCreateModalOpen || isEditModalOpen) {
      const isDuplicate = priorities.some(
        (p) =>
          p.colorCode.toLowerCase() === formData.color.toLowerCase() &&
          (!editingPriority || p.priorityId !== editingPriority.priorityId),
      );
      setColorError(
        isDuplicate
          ? "This color is already in use. Please choose a different color."
          : "",
      );
    } else {
      setColorError("");
    }
  }, [
    formData.color,
    priorities,
    isCreateModalOpen,
    isEditModalOpen,
    editingPriority,
  ]);

  useEffect(() => {
    setToast({ isOpen: false, message: "", type: "success" });
    setCurrentPage(1);
  }, []);

  const resetForm = () => setFormData({ name: "", color: "#000000" });

  const handleColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith("#"))
      value = "#" + value.replace(/[^0-9A-Fa-f]/gi, "");
    value = "#" + value.slice(1).replace(/[^0-9A-Fa-f]/gi, "");
    value = value.slice(0, 7);
    setFormData({ ...formData, color: value });
  };

  const validateName = (name: string) => /^[A-Za-z ]+$/.test(name.trim());

  const handleCreate = async () => {
    if (colorError) {
      setIsCreateModalOpen(false);
      resetForm();

      showToast(
        "This color is already in use. Please choose a different color.",
        "error",
      );
      return;
    }

    if (formData.name && !validateName(formData.name)) {
      setIsCreateModalOpen(false);
      resetForm();

      showToast(
        "Priority name can only contain alphabets and spaces.",
        "error",
      );
      return;
    }

    try {
      const normalizedColor = normalizeColor(formData.color);

      const result = await createPriority({
        priorityName: formData.name,
        colorCode: normalizedColor,
      });

      await fetchPriorities(currentPage - 1, pageSize);

      setIsCreateModalOpen(false);
      resetForm();

      showToast("Priority created successfully!", "success");
    } catch (error: any) {


      const errorMsg =
        error?.response?.data?.data?.[0]?.message ||
        error?.response?.data?.message ||
        "Failed to create priority";

      showToast(errorMsg, "error");
    }
  };

  const handleEdit = async () => {
    if (!editingPriority) return;

  const editingPriorityId = editingPriority.priorityId;
  const normalizedColor = normalizeColor(formData.color);

  // Reject empty or spaces-only name
  if (!formData.name || formData.name.trim() === "") {
    showToast(
      "Priority name cannot be empty or contain only spaces.",
      "error",
    );
    return;
  }

    if (
      formData.name.trim().toLowerCase() ===
        editingPriority.priorityName.trim().toLowerCase() &&
      normalizedColor.trim().toLowerCase() ===
        editingPriority.colorCode.trim().toLowerCase()
    ) {
      showToast("No changes were made to the priority", "error");
      return;
    }

    if (formData.name.trim() && !validateName(formData.name)) {
      showToast(
        "Priority name can only contain alphabets and spaces.",
        "error",
      );
      return;
    }

    const nameExists = priorities.some(
      (p) =>
        p.priorityName.trim().toLowerCase() ===
          formData.name.trim().toLowerCase() &&
        p.priorityId !== editingPriorityId,
    );

    if (nameExists) {
      showToast("Priority Name already exists.", "error");
      return;
    }

    const colorExists = priorities.some(
      (p) =>
        p.colorCode.trim().toLowerCase() ===
          normalizedColor.trim().toLowerCase() &&
        p.priorityId !== editingPriorityId,
    );

    if (colorExists) {
      showToast(
        "This color is already in use. Please choose a different color.",
        "error",
      );
      return;
    }

    try {
      const result = await updatePriority(editingPriorityId, {
        priorityName: formData.name.trim(),
        colorCode: normalizedColor,
      });

      await fetchPriorities(currentPage - 1, pageSize);

      setIsEditModalOpen(false);
      setEditingPriority(null);
      resetForm();

      const successMsg =
        "Priority " + (result.statusMessage || "updated successfully!");

      showToast(successMsg, "success");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.statusMessage ||
        "Failed to Update priority";

      showToast(errorMsg, "error");
    }
  };

  const handleDelete = async () => {
    
    if (!deletingPriority) return;
    try {
      const result = await deletePriority(deletingPriority.priorityId);

      await fetchPriorities(currentPage - 1, pageSize);
      setIsDeleteModalOpen(false);
      setDeletingPriority(null);
      const successMsg =
        "Priority " + result.statusMessage || "Priority deleted successfully!";
      showToast(successMsg, "success");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||error.response?.data?.data?.[0]?.message ;
      showToast(errorMsg, "error");
    }
  };

  const openEditModal = (priority: Priority) => {
    setEditingPriority(priority);
    setFormData({ name: priority.priorityName, color: priority.colorCode });
    setIsEditModalOpen(true);
  };
  const openDeleteModal = (priority: Priority) => {
    setDeletingPriority(priority);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
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
          <Flag className="w-8 h-8 text-blue-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Priority Management
          </h1>
        </div>
        {can.priority.create && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Create Priority
          </Button>
        )}
      </div>
      <Card>
        <div className="flex flex-row items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Priority Levels
          </h2>
        </div>
        <CardContent>
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
            <Table>
              <thead className="bg-gray-50">
                <TableRow>
                  <TableCell header>Name</TableCell>
                  <TableCell header>Color</TableCell>
                  {(can.priority.edit || can.priority.delete) && (
                    <TableCell header>Actions</TableCell>
                  )}
                </TableRow>
              </thead>
              <TableBody>
                {priorities.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-500 py-4">
                      No priorities found.
                    </td>
                  </tr>
                ) : (
                  priorities.map((priority) => (
                    <TableRow key={priority.priorityId}>
                      <TableCell className="font-medium">
                        {priority.priorityName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: priority.colorCode }}
                          />
                          <span className="text-sm text-gray-600">
                            {priority.colorCode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {can.priority.edit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(priority)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          {can.priority.delete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteModal(priority)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
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
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
          setShowColorPickerCreate(false);
        }}
        title="Create New Priority"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter priority name"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex items-center gap-3 w-full">
                <Input
                  value={formData.color}
                  onChange={handleColorInput}
                  placeholder="#000000"
                  className={`flex-1 ${colorError ? "border-red-500" : ""}`}
                  maxLength={7}
                />
                <div
                  className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer"
                  style={{ backgroundColor: formData.color }}
                  onClick={() => setShowColorPickerCreate((v) => !v)}
                  aria-label="Pick color"
                />
              </div>
              {colorError && (
                <div className="text-red-600 text-sm w-full mt-1">
                  {colorError}
                </div>
              )}
              {showColorPickerCreate && (
                <div className="z-50 mt-2">
                  <HexColorPicker
                    color={formData.color}
                    onChange={(color) => setFormData({ ...formData, color })}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
                setShowColorPickerCreate(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || !!colorError}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPriority(null);
          resetForm();
          setShowColorPickerEdit(false);
        }}
        title="Edit Priority"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter priority name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex items-center gap-3 w-full">
                <Input
                  value={formData.color}
                  onChange={handleColorInput}
                  placeholder="#000000"
                  className={`flex-1 ${colorError ? "border-red-500" : ""}`}
                  maxLength={7}
                />
                <div
                  className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer"
                  style={{ backgroundColor: formData.color }}
                  onClick={() => setShowColorPickerEdit((v) => !v)}
                  aria-label="Pick color"
                />
              </div>
              {colorError && (
                <div className="text-red-600 text-sm w-full mt-1">
                  {colorError}
                </div>
              )}
              {showColorPickerEdit && (
                <div className="z-50 mt-2">
                  <HexColorPicker
                    color={formData.color}
                    onChange={(color) => setFormData({ ...formData, color })}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingPriority(null);
                resetForm();
                setShowColorPickerEdit(false);
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
          setDeletingPriority(null);
        }}
        title="Delete Priority"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the priority "
            {deletingPriority?.priorityName}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingPriority(null);
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
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
};

export default Priority;
