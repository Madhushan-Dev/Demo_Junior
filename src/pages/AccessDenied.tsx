import { Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-blue-50 px-4">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-red-100 p-10 max-w-md w-full text-center overflow-hidden transition-all duration-500 hover:shadow-3xl">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-red-100 rounded-full opacity-50" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-blue-100 rounded-full opacity-50" />

        <div className="relative z-10">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-100 flex items-center justify-center transition-transform duration-300 hover:scale-110">
            <Lock className="w-10 h-10 text-red-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Access Denied
          </h1>

          <p className="text-gray-600 mb-8">
            You do not have permission to access this project.
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold shadow-lg hover:bg-red-700 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
