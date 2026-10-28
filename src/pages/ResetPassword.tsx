// export default ResetPassword;
import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import {
  resetPassword,
  validateResetToken,
} from "../api/forgotpassword/forgotPassword";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Token validation
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenChecking, setTokenChecking] = useState(true);
  const [tokenError, setTokenError] = useState("");

  // Password validation
  const [passwordError, setPasswordError] = useState("");

  // Reset success
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setTokenError("Invalid password reset link.");
        setTokenChecking(false);
        return;
      }

      try {
        setTokenChecking(true);

        await validateResetToken(token);

        // Token is valid
        setTokenValid(true);
        setTokenError("");
      } catch (err: any) {
        const errorData = err.response?.data;

        const backendMessage =
          errorData?.data?.[0]?.message ||
          errorData?.message ||
          errorData?.statusMessage;

        setTokenValid(false);

        setTokenError(
          backendMessage ||
            "This password reset link is invalid or has expired.",
        );
      } finally {
        setTokenChecking(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear only password error
    setPasswordError("");

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      setPasswordError(
        "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (!token || !tokenValid) {
      setTokenError("This password reset link is invalid or has expired.");
      return;
    }

    try {
      setLoading(true);

      const response = await resetPassword(token, newPassword);

      if (response.statusCode === 200) {
        setSuccess(true);

        setSuccessMessage(
          response.statusMessage || "Password has been reset successfully.",
        );
      } else {
        setPasswordError(
          response.statusMessage || "Failed to reset password.",
        );
      }
    } catch (err: any) {
      const errorData = err.response?.data;

      const backendMessage =
        errorData?.data?.[0]?.message ||
        errorData?.message ||
        errorData?.statusMessage;

      setPasswordError(
        backendMessage || "Failed to reset password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Reset Password
          </h1>
        </div>
        {tokenChecking ? (
          <div className="text-center">
            <p className="text-gray-600">
              Validating password reset link...
            </p>
          </div>

        ) : !tokenValid ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">

            <p className="text-red-600">
              {tokenError}
            </p>

            <Link to="/forgot-password">
              <Button className="w-full mt-4">
                Request New Reset Link
              </Button>
            </Link>

          </div>

        ) : success ? (

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">

            <p className="text-green-700">
              {successMessage}
            </p>

            <Link to="/login">
              <Button className="w-full mt-4">
                Go to Login
              </Button>
            </Link>

          </div>

        ) : (

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* New Password */}
            <Input
              label="New Password"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError("");
              }}
              placeholder="Enter your new password"
              required
              disabled={loading}
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNew((v) => !v)}
                  className="focus:outline-none"
                  aria-label={
                    showNew ? "Hide password" : "Show password"
                  }
                >
                  {showNew ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              }
            />

            {/* Confirm Password */}
            <Input
              label="Confirm New Password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError("");
              }}
              placeholder="Confirm your new password"
              required
              disabled={loading}
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="focus:outline-none"
                  aria-label={
                    showConfirm ? "Hide password" : "Show password"
                  }
                >
                  {showConfirm ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              }
            />

            {/* Password Error */}
            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">
                  {passwordError}
                </p>
              </div>
            )}

            {/* Reset Button */}
            <Button
              disabled={loading}
              type="submit"
              className="w-full"
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}
            </Button>

          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;