import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { STATUS_TYPES } from "../enums/StatusType";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import { ChevronLeft, Plus, Edit2, Trash2, ListPlus } from "lucide-react";

import { Toast } from "../components/ui/Toast";
import { HexColorPicker } from "react-colorful";
import {
  createDefectStatus,
  CreateDefectStatusRequest,
  DefectStatus,
  deleteDefectStatus,
  getAllDefectStatuses,
  updateDefectStatus,
} from "../api/defectStatus";
import { usePermission } from "../context/PermissionContext";
import { OrbitProgress } from "react-loading-indicators";

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

const StatusType: React.FC = () => {
  const navigate = useNavigate();

  const [colorError, setColorError] = useState("");
  const [statusTypes, setStatusTypes] = useState<DefectStatus[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<DefectStatus | null>(null);
  const [deletingStatus, setDeletingStatus] = useState<DefectStatus | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    color: "#000000",
    type: "",
  });
  const [showColorPickerCreate, setShowColorPickerCreate] = useState(false);
  const [showColorPickerEdit, setShowColorPickerEdit] = useState(false);

  const { can } = usePermission();
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ isOpen: true, message, type });
  };

  const pageSize = 5;

  useEffect(() => {
    if (isCreateModalOpen || isEditModalOpen) {
      const isDuplicate = statusTypes.some(
        (s) =>
          s.colorCode.toLowerCase() === formData.color.toLowerCase() &&
          (!editingStatus || s.statusTypeId !== editingStatus.statusTypeId),
      );
      if (isDuplicate) {
        setColorError(
          "This color is already in use. Please choose a different color.",
        );
      } else {
        setColorError("");
      }
    } else {
      setColorError("");
    }
  }, [
    formData.color,
    statusTypes,
    isCreateModalOpen,
    isEditModalOpen,
    editingStatus,
  ]);

  const getAllStatus = async (page: number = 0) => {
    try {
      setLoading(true);

      const response = await getAllDefectStatuses(page, pageSize);
      setTotalPages(response.totalPages);
      setStatusTypes(response.content);
    } catch (error) {
      setLoading(false);
} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllStatus(currentPage - 1);
  }, [currentPage]);
  const resetForm = () => {
    setFormData({ name: "", color: "#000000", type: "" });
  };

  const validateForm = () => {
    if (formData.name.trim() === "") {
      return { isValid: false, message: "Status Name cannot be empty." };
    }

    const normalizedColor = normalizeColor(formData.color);
    if (!/^#[0-9A-Fa-f]{6}$/.test(normalizedColor)) {
      return {
        isValid: false,
        message: "Please enter a valid color code (e.g., #FF0000).",
      };
    }
    if (!formData.type) {
      return { isValid: false, message: "Please select a Status Type." };
    }

    return { isValid: true, message: "" };
  };

  const handleCreate = async () => {
    try {
      const validation = validateForm();
      if (!validation.isValid) {
        showToast(validation.message, "error");
        return;
      }

      const normalizedColor = normalizeColor(formData.color);

      const newStatus: CreateDefectStatusRequest = {
        statusName: formData.name,
        statusType: formData.type,
        colorCode: normalizedColor,
      };

      const response = await createDefectStatus(newStatus);

      await getAllStatus(currentPage - 1);

      showToast(response.statusMessage || "Created successfully", "success");
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.data?.[0]?.message ||
        error.response?.data?.statusMessage ||
        "Failed to create Status Type";

      showToast(errorMsg, "error");
    }
  };

  const handleEdit = async () => {
if (!editingStatus) return;
if (
      formData.name.trim() === editingStatus.statusName.trim() &&
      formData.color.toLowerCase() === editingStatus.colorCode.toLowerCase() &&
      formData.type === editingStatus.statusType
    ) {
      showToast("No changes were made to the status type", "error");
      return;
    }

    const validation = validateForm();
    if (!validation.isValid) {
      showToast(validation.message, "error");
      return;
    }

    const normalizedColor = normalizeColor(formData.color);

    try {
      const response = await updateDefectStatus(editingStatus.statusTypeId, {
        statusName: formData.name,
        statusType: formData.type,
        colorCode: normalizedColor,
      });

      await getAllStatus(currentPage - 1);
      setIsEditModalOpen(false);
      setEditingStatus(null);
      resetForm();

      showToast("Updated successfully", "success");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.data?.[0]?.message ||
        error.response?.data?.statusMessage ||
        "Failed to update Status Type";
      showToast(errorMsg, "error");
    }
  };

  const handleDelete = async () => {

    if (!deletingStatus) return;

    try {
      const response = await deleteDefectStatus(deletingStatus.statusTypeId);

      await getAllStatus(currentPage - 1);

      showToast(response.statusMessage || "Deleted successfully", "success");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.data?.[0]?.message ||
        error.response?.data?.statusMessage ||
        "Failed to delete Status Type";

      showToast(errorMsg, "error");
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingStatus(null);
    }
  };

  const openEditModal = (status: DefectStatus) => {
    setEditingStatus(status);
    setFormData({
      name: status.statusName,
      color: normalizeColor(status.colorCode),
      type: status.statusType,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (status: DefectStatus) => {
    setDeletingStatus(status);
    setIsDeleteModalOpen(true);
  };

  const handleColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith("#"))
      value = "#" + value.replace(/[^0-9A-Fa-f]/gi, "");
    value = "#" + value.slice(1).replace(/[^0-9A-Fa-f]/gi, "");
    value = value.slice(0, 7);
    setFormData({ ...formData, color: value });
  };

  const handleStatusNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setFormData({ ...formData, name: value });
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-6 flex justify-end">
        <Button
          variant="secondary"
          onClick={() => navigate("/configurations/status")}
          className="flex items-center"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back
        </Button>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <ListPlus className="w-8 h-8 text-blue-700 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Status Type Management
          </h1>
        </div>
        {can.statusType.create && (
          <Button
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Status
          </Button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
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
            <TableHeader>
              <TableRow>
                <TableCell header className="w-[40%]">
                  Name
                </TableCell>
                <TableCell header className="w-[40%]">
                  Status Type
                </TableCell>
                <TableCell header className="w-[40%]">
                  Colour
                </TableCell>
                {(can.statusType.edit || can.statusType.delete) && (
                  <TableCell header className="text-right">
                    Action
                  </TableCell>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {statusTypes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-4">
                    No status types found.
                  </td>
                </tr>
              ) : (
                statusTypes.map((status) => (
                  <TableRow key={status.statusTypeId}>
                    <TableCell className="font-medium">
                      {status.statusName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span>{status.statusType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300 mr-3"
                          style={{ backgroundColor: status.colorCode }}
                        />
                        <span>{status.colorCode}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {can.statusType.edit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(status)}
                          className="mr-2"
                        >
                          <Edit2 className="w-4 h-4 text-blue-500" />
                        </Button>
                      )}
                      {can.statusType.delete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(status)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
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

      {}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
          setShowColorPickerCreate(false);
        }}
        title="Create Status Type"
      >
        <div className="space-y-4">
          <Input
            label="Status Name"
            value={formData.name}
            onChange={handleStatusNameInput}
            placeholder="e.g., IN PROGRESS"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Status Type --</option>
              {STATUS_TYPES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
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
                  className={`flex-1 ${colorError ? "border-red-500 focus:ring-red-500" : ""}`}
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
                    onChange={(color) =>
                      setFormData({ ...formData, color: color })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
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
            <Button onClick={handleCreate} disabled={!!colorError}>
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
          resetForm();
          setShowColorPickerEdit(false);
        }}
        title="Edit Status Type"
      >
        <div className="space-y-4">
          <Input
            label="Status Name"
            value={formData.name}
            onChange={handleStatusNameInput}
            placeholder="e.g., IN PROGRESS"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Status Type --</option>
              {STATUS_TYPES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
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
                  className={`flex-1 ${colorError ? "border-red-500 focus:ring-red-500" : ""}`}
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
                    onChange={(color) =>
                      setFormData({ ...formData, color: color })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                resetForm();
                setShowColorPickerEdit(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Status Type"
      >
        <div>
          <p>
            Are you sure you want to delete the status "
            <strong>{deletingStatus?.statusName}</strong>"?
          </p>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
      {}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
};

export default StatusType;

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const err = error as {
      response?: {
        data?: {
          message?: string;
          statusMessage?: string;
          error?: string;
        };
      };
      message?: string;
    };

    return (
      err.response?.data?.message ||
      err.response?.data?.statusMessage ||
      err.response?.data?.error ||
      err.message ||
      fallback
    );
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}
