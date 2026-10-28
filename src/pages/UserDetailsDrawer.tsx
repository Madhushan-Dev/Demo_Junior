import ENDPOINTS from "../utils/endpoints";

import React, { useState } from "react";
import { Button } from "../components/ui/Button";
import apiClient from "../lib/api";
import AuthService from "../services/authService";

import { FiEye, FiEyeOff } from "react-icons/fi";
import { Toast } from "../components/ui/Toast";

interface ChangePasswordSectionProps {
  userId?: string | number;
  email?: string;
}

const ChangePasswordSection: React.FC<ChangePasswordSectionProps> = ({
  userId,
  email,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setToast({
        isOpen: true,
        message: "All fields are required.",
        type: "error",
      });
      return;
    }
    if (newPassword.length < 6) {
      setToast({
        isOpen: true,
        message: "New password must be at least 6 characters long.",
        type: "error",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({
        isOpen: true,
        message: "Passwords do not match.",
        type: "error",
      });
      return;
    }
    if (oldPassword === newPassword) {
      setToast({
        isOpen: true,
        message: "New password must be different from the old password.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const currentUser = AuthService.getCurrentUser();
      const resolvedId =
        userId ||
        currentUser?.employeeId ||
        currentUser?.userId ||
        currentUser?.id;
      const resolvedEmail = email || currentUser?.email;

      const parsedEmpId =
        resolvedId != null
          ? typeof resolvedId === "number"
            ? resolvedId
            : parseInt(resolvedId, 10)
          : undefined;

      const response = await apiClient.post(ENDPOINTS.changePassword, {
        empId: isNaN(parsedEmpId as any) ? undefined : parsedEmpId,
        email: resolvedEmail,
        currentPassword: oldPassword,
        newPassword: newPassword,
      });

      if (
        response.data &&
        (response.data.status === "Success" ||
          response.data.statusCode === 200 ||
          response.status === 200)
      ) {
        setToast({
          isOpen: true,
          message:
            response.data.statusMessage || "Password changed successfully!",
          type: "success",
        });
        setShowForm(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setToast({
          isOpen: true,
          message:
            response.data?.statusMessage ||
            response.data?.message ||
            "Failed to change password",
          type: "error",
        });
      }
    } catch (error: any) {
      let errorMessage = "Error changing password. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.statusMessage) {
        errorMessage = error.response.data.statusMessage;
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.message ||
          "Invalid password or request. Please check your current password.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setToast({
        isOpen: true,
        message: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div>
      {!showForm ? (
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          Change Password
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showOldPassword ? "text" : "password"}
              className="w-full border rounded-lg px-3 py-2 pr-10"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setShowOldPassword(!showOldPassword)}
            >
              {showOldPassword ? <FiEye /> : <FiEyeOff />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              className="w-full border rounded-lg px-3 py-2 pr-10"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <FiEye /> : <FiEyeOff />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="w-full border rounded-lg px-3 py-2 pr-10"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FiEye /> : <FiEyeOff />}
            </button>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
            >
              {loading ? "Changing..." : "Submit"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={closeToast}
        duration={3000}
      />
    </div>
  );
};

interface UserDetailsDrawerProps {
  user?: {
    firstName?: string;
    lastName?: string;
    employeeName?: string;
    userId?: string | number;
    employeeId?: string | number;
    id?: string | number;
    username?: string;
    email?: string;
    role?: string;
    roles?: string[];
  };
  onClose: () => void;
}

const getEmailFromToken = (): string | null => {
  try {
    const rawToken =
      AuthService.getToken() ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("auth_token") ||
      sessionStorage.getItem("token");

    if (!rawToken) return null;
    const token = rawToken.startsWith("Bearer ")
      ? rawToken.slice(7).trim()
      : rawToken.trim();

    const parts = token.split(".");
    if (parts.length < 2) return null;

    let base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return (
      payload.email ||
      payload.sub ||
      payload.username ||
      payload.preferred_username ||
      null
    );
  } catch {
    return null;
  }
};

const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({
  user,
  onClose,
}) => {
  const currentUser = AuthService.getCurrentUser();
  const effectiveUser = {
    ...(currentUser || {}),
    ...(user || {}),
  };

  const displayName =
    effectiveUser?.firstName || effectiveUser?.lastName
      ? `${effectiveUser?.firstName || ""} ${effectiveUser?.lastName || ""}`.trim()
      : effectiveUser?.employeeName || effectiveUser?.username || "User";

  const initialLetters =
    effectiveUser?.firstName && effectiveUser?.lastName
      ? `${effectiveUser.firstName.charAt(0)}${effectiveUser.lastName.charAt(0)}`
      : (displayName || "U")
          .split(" ")
          .map((n: string) => n.charAt(0))
          .join("")
          .slice(0, 2)
          .toUpperCase();

  const roleDisplay =
    effectiveUser?.role ||
    (effectiveUser?.roles && effectiveUser.roles.length > 0
      ? effectiveUser.roles.join(", ")
      : "Employee");

  const resolvedUserId =
    effectiveUser?.employeeId || effectiveUser?.userId || effectiveUser?.id;

  const resolvedEmail =
    user?.email ||
    currentUser?.email ||
    effectiveUser?.email ||
    getEmailFromToken() ||
    "";

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[100] animate-slideIn flex flex-col border-l border-gray-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-blue-700">User Details</h2>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 rounded-xl"
          onClick={onClose}
        >
          <span className="text-gray-500">✕</span>
        </Button>
      </div>
      <div className="px-6 py-6 flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {initialLetters}
          </div>
          <div className="overflow-hidden">
            <p className="text-lg font-semibold text-gray-900 truncate">
              {displayName}
            </p>
            <p className="text-sm text-gray-500 capitalize">{roleDisplay}</p>
            {resolvedEmail && (
              <p
                className="text-xs text-blue-600 font-medium truncate mt-0.5"
                title={resolvedEmail}
              >
                {resolvedEmail}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Email:</span>{" "}
            <span className="text-gray-600">{resolvedEmail || "N/A"}</span>
          </p>
          <hr className="my-4" />
          <h3 className="text-md font-semibold text-gray-800 mb-2">
            Change Password
          </h3>
          <ChangePasswordSection
            userId={resolvedUserId}
            email={resolvedEmail}
          />
        </div>
      </div>
    </div>
  );
};

export default UserDetailsDrawer;

