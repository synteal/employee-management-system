import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import EmployeeTable, { type Employee } from "../components/EmployeeTable";
import EmployeeForm from "../components/EmployeeForm";

const Employees: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  // We use key to force unmount & remount EmployeeTable and force fetch refresh
  // Because table fetches on mount/filter change.
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
      try {
        const id = employee.employeeId;
        if (!id) {
          console.error("Cannot delete employee: Missing employeeId", employee);
          return;
        }
        await api.delete(`/employees/${id}/`);
        setRefreshKey((prev) => prev + 1);
      } catch (err: any) {
        console.error("Failed to delete employee", err);
        alert(err.response?.data?.detail || "Failed to delete employee.");
      }
    }
  };

  const handleFormSubmit = async (employeeData: Partial<Employee>) => {
    try {
      if (selectedEmployee) {
        const id = selectedEmployee.employeeId;
        if (!id) {
          console.error(
            "Cannot update employee: Missing employeeId",
            selectedEmployee,
          );
          return;
        }
        await api.put(`/employees/${id}/`, employeeData);
      } else {
        await api.post("/employees/", employeeData);
      }
      setRefreshKey((prev) => prev + 1);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to save employee", err);
      alert(err.response?.data?.detail || "Failed to save employee.");
      throw err; // Re-throw to keep modal open if needed, but usually we handle it in form
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Employees
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? "Manage company employees, their roles, and status."
              : "View the list of company employees."}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleAddEmployee}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="mr-2 -ml-1 h-5 w-5" />
            Add Employee
          </button>
        )}
      </div>

      <EmployeeTable
        key={refreshKey}
        isAdminView={isAdmin}
        onEdit={handleEditEmployee}
        onDelete={handleDeleteEmployee}
      />

      {isAdmin && (
        <EmployeeForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={selectedEmployee}
        />
      )}
    </div>
  );
};

export default Employees;
