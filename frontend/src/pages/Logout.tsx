import React, { useActionState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const logoutAction = async () => {
    try {
      await api.post("/auth/logout", {});
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      try {
        logout();
      } catch (e) {}
      return { success: true };
    }
  };

  const [_, formAction, isPending] = useActionState(logoutAction, {
    success: false,
  });

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center">
        <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
          Are you sure you want to log out?
        </h2>
        <div className="mt-8 space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:gap-4">
          <form action={formAction} className="w-full sm:w-auto">
            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Logging out..." : "Confirm Logout"}
            </button>
          </form>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="w-full sm:w-auto flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Logout;
