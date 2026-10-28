import { AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-blue-100 p-10 max-w-md w-full text-center overflow-hidden transition-all duration-500 hover:shadow-3xl">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-100 rounded-full opacity-50" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-indigo-100 rounded-full opacity-50" />

        <div className="relative z-10">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center transition-transform duration-300 hover:scale-110">
            <AlertCircle className="w-10 h-10 text-blue-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Page Not Found
          </h1>

          <p className="text-gray-600 mb-8">
            The page you are looking for does not exist or has been moved.
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
