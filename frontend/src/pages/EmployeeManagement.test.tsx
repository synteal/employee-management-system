import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import EmployeeManagement from "./EmployeeManagement";
import api from "../api/axios";

// Mock the API
vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  getApiErrorMessage: vi.fn((err, fallback) => fallback),
}));

const mockEmployees = [
  {
    employeeId: "emp-123",
    name: "John Doe",
    email: "john@example.com",
    department: "Engineering",
    role: "Senior Developer",
    yearlySalary: 100000,
    status: "active",
  },
];

describe("EmployeeManagement Page (Integration)", () => {
  const mockApi = vi.mocked(api);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockImplementation(() => true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    
    // Default GET response for EmployeeTable
    mockApi.get.mockResolvedValue({ data: mockEmployees });
  });

  it("should render the page and fetch employees on mount", async () => {
    render(<EmployeeManagement />);
    
    expect(screen.getByText("Employee Management")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });
    
    expect(mockApi.get).toHaveBeenCalledWith("/employees");
  });

  it("should open the real EmployeeForm modal when clicking 'Add Employee'", async () => {
    render(<EmployeeManagement />);
    
    await waitFor(() => expect(screen.getByText("John Doe")).toBeInTheDocument());
    
    fireEvent.click(screen.getByRole("button", { name: /Add Employee/i }));
    
    expect(screen.getByText("Add New Employee")).toBeInTheDocument();
    expect(screen.getByLabelText(/Employee ID \*/i)).toHaveValue("");
  });

  it("should open the real EmployeeForm for editing when clicking edit button in table", async () => {
    render(<EmployeeManagement />);
    
    await waitFor(() => expect(screen.getByText("John Doe")).toBeInTheDocument());
    
    const editButton = screen.getByTitle("Edit Employee");
    fireEvent.click(editButton);
    
    expect(screen.getByText("Edit Employee")).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name \*/i)).toHaveValue("John Doe");
    expect(screen.getByLabelText(/Employee ID \*/i)).toBeDisabled();
  });

  it("should call delete API and refresh table when deleting an employee", async () => {
    mockApi.delete.mockResolvedValue({ data: {} });
    const confirmSpy = vi.spyOn(window, "confirm");

    render(<EmployeeManagement />);
    
    await waitFor(() => expect(screen.getByText("John Doe")).toBeInTheDocument());
    
    const deleteButton = screen.getByTitle("Delete Employee");
    fireEvent.click(deleteButton);
    
    expect(confirmSpy).toHaveBeenCalled();
    expect(mockApi.delete).toHaveBeenCalledWith("/employees/emp-123");
    
    // EmployeeTable should re-render and re-fetch (refreshKey change)
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledTimes(2); // Initial + Refresh
    });
  });

  it("should call post API and refresh table on new employee form submission", async () => {
    mockApi.post.mockResolvedValue({ data: {} });
    
    render(<EmployeeManagement />);
    
    await waitFor(() => expect(screen.getByText("John Doe")).toBeInTheDocument());
    
    // Open modal
    fireEvent.click(screen.getByRole("button", { name: /Add Employee/i }));
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/Employee ID \*/i), { target: { value: "emp-new" } });
    fireEvent.change(screen.getByLabelText(/Full Name \*/i), { target: { value: "New Employee" } });
    fireEvent.change(screen.getByLabelText(/Email Address \*/i), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText(/Role \*/i), { target: { value: "Intern" } });
    fireEvent.change(screen.getByLabelText(/Yearly Salary \*/i), { target: { value: "50000" } });
    
    // Click Save
    fireEvent.click(screen.getByText("Save"));
    
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/employees", expect.objectContaining({
        employeeId: "emp-new",
        name: "New Employee",
      }));
    });
    
    // Form should close and table should refresh
    await waitFor(() => {
      expect(screen.queryByText("Add New Employee")).not.toBeInTheDocument();
      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });

  it("should call put API and refresh table on edit employee form submission", async () => {
    mockApi.put.mockResolvedValue({ data: {} });
    
    render(<EmployeeManagement />);
    
    await waitFor(() => expect(screen.getByText("John Doe")).toBeInTheDocument());
    
    // Open edit modal
    fireEvent.click(screen.getByTitle("Edit Employee"));
    
    // Modify a field
    fireEvent.change(screen.getByLabelText(/Full Name \*/i), { target: { value: "John Updated" } });
    
    // Click Save
    fireEvent.click(screen.getByText("Save"));
    
    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith("/employees/emp-123", expect.objectContaining({
        name: "John Updated",
      }));
    });
    
    // Form should close and table should refresh
    await waitFor(() => {
      expect(screen.queryByText("Edit Employee")).not.toBeInTheDocument();
      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });
});
