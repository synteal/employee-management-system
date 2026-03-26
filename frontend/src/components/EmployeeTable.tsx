import React, { useState, useEffect, useDeferredValue } from "react";
import api, { getApiErrorMessage } from "../api/axios";
import { Search, Filter, Edit, Trash2 } from "lucide-react";

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

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  isAdminView = false,
  onEdit,
  onDelete,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [departmentFilter, setDepartmentFilter] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError("");
      try {
        let url = "/employees";
        if (deferredSearchTerm || departmentFilter) {
          const params = new URLSearchParams();
          if (deferredSearchTerm) params.append("name", deferredSearchTerm);
          if (departmentFilter) params.append("department", departmentFilter);
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
  }, [deferredSearchTerm, departmentFilter]);

  // Use this exposed method if parent wants to trigger a refresh (e.g. after adding)
  // we can use a ref or pass a key, but for simplicity, we rely on the parent updating a `refreshKey` prop which we can add later if needed.

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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          />
        </div>

        <div className="relative sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
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
      </div>

      {error ? (
        <div className="p-8 text-center text-red-500">
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="p-8 text-center text-gray-500 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          Loading employees...
        </div>
      ) : employees.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No employees found matching your criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Department
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                {isAdminView && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {employee.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.status === "active"
                          ? "bg-green-100 text-green-800"
                          : employee.status === "disabled"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {employee.status.replace("_", " ")}
                    </span>
                  </td>
                  {isAdminView && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onEdit && onEdit(employee)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4 focus:outline-none"
                        title="Edit Employee"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete && onDelete(employee)}
                        className="text-red-600 hover:text-red-900 focus:outline-none"
                        title="Delete Employee"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
