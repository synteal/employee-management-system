import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import EmployeeTable from "../components/EmployeeTable";

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Welcome, {user?.username || "User"}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's an overview of the company's employees.
          </p>
        </div>

        {user?.role === "admin" && (
          <Link
            to="/management"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Employee Management
            <ArrowRight className="ml-2 -mr-1 h-4 w-4" />
          </Link>
        )}
      </div>

      <EmployeeTable isAdminView={false} />
    </div>
  );
};

export default Home;
