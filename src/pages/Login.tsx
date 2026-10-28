import React, { useState, useEffect } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { testAuthHeader } from "../api/importTestCase";

export const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("selectedProjectId");
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
const success = await login(username, password);
if (success) {
setTimeout(() => {
          navigate(sessionStorage.getItem("redirectUrl") || "/dashboard", {
            replace: true,
          });

          sessionStorage.removeItem("redirectUrl");
        }, 100);
      } else {
setError("Login failed. Please check your credentials and try again.");
      }
    } catch (err: any) {
setError(
        err.message || "An error occurred during login. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            DefectTracker Pro
          </h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your Email"
            required
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              const trimmed = e.target.value.replace(/^\s+/, "");
              setPassword(trimmed);
            }}
            placeholder="Enter your password"
            required
            rightIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            }
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-700">
              {}
            </label>
            <Link
              to="/forgot-password"
              className="text-blue-600 text-sm hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            icon={User}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          {user && (
            <Button
              type="button"
              onClick={testAuthHeader}
              className="w-full mt-2 bg-green-500 hover:bg-green-600"
            >
              Test Authorization Header
            </Button>
          )}
        </form>

        {}
      </div>
    </div>
  );
};
