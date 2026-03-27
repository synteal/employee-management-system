import React, { useState, useEffect, useDeferredValue } from "react";
import { useSearchParams } from "react-router-dom";
import api, { getApiErrorMessage } from "../api/axios";
import { Search, Filter, Edit, Trash2, UserX } from "lucide-react";

export interface Employee {
  employeeId: string;
  _id?: string;
  name: string;
  email: string;
  department: string;
  role: string;
  yearlySalary: number;
  status: "active" | "disabled" | "on_leave";
}

interface EmployeeTableProps {
  isAdminView?: boolean;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-pink-100 text-pink-600",
  "bg-indigo-100 text-indigo-600",
  "bg-teal-100 text-teal-600",
  "bg-orange-100 text-orange-600",
  "bg-green-100 text-green-600",
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  isAdminView = false,
  onEdit,
  onDelete,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("name") || "");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [departmentFilter, setDepartmentFilter] = useState(
    searchParams.get("department") || "",
  );
  const statusFilter = searchParams.get("status") || "";

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError("");
      try {
        let url = "/employees";
        const params = new URLSearchParams();
        
        if (deferredSearchTerm) params.append("name", deferredSearchTerm);
        if (departmentFilter) params.append("department", departmentFilter);
        if (statusFilter) params.append("status", statusFilter);

        if (params.toString()) {
          url = `/employees/search?${params.toString()}`;
        }
        
        const response = await api.get(url);
        setEmployees(response.data);
      } catch (err: unknown) {
        console.error("Failed to fetch employees", err);
        const errorMessage = getApiErrorMessage(
          err,
          "Failed to fetch employees",
        );
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [deferredSearchTerm, departmentFilter, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set("name", val);
    else newParams.delete("name");
    setSearchParams(newParams);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDepartmentFilter(val);
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set("department", val);
    else newParams.delete("department");
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setSearchParams({});
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={departmentFilter}
              onChange={handleDepartmentChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none transition-colors"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
          {(searchTerm || departmentFilter || statusFilter) && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="p-12 text-center text-red-500">
          <p className="text-lg font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-600 underline"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="p-16 text-center text-gray-500 flex flex-col justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="animate-pulse">Loading employees...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="p-16 text-center text-gray-500 max-w-xs mx-auto">
          <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <UserX className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            We couldn't find any employees matching your current search or filters.
          </p>
          {(searchTerm || departmentFilter || statusFilter) && (
            <button
              onClick={clearFilters}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed sm:table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="w-1/3 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Department
                </th>
                <th
                  scope="col"
                  className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                {isAdminView && (
                  <th
                    scope="col"
                    className="w-1/12 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr
                  key={employee.employeeId}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold transition-transform group-hover:scale-110 ${getAvatarColor(employee.name)}`}>
                        {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {employee.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {employee.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {employee.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        employee.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : employee.status === "disabled"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}
                    >
                      {employee.status.replace("_", " ")}
                    </span>
                  </td>
                  {isAdminView && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => onEdit && onEdit(employee)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded-md hover:bg-blue-50"
                          title="Edit Employee"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete && onDelete(employee)}
                          className="text-rose-600 hover:text-rose-900 transition-colors p-1 rounded-md hover:bg-rose-50"
                          title="Delete Employee"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeTable;
