import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import EmployeeTable from "./EmployeeTable";
import api from "../api/axios";

// Mock the API
vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
  },
  getApiErrorMessage: vi.fn((_err, fallback) => fallback),
}));

const mockEmployees = [
  {
    employeeId: "emp-1",
    name: "Alice Smith",
    email: "alice@example.com",
    department: "Engineering",
    role: "Senior Engineer",
    yearlySalary: 120000,
    status: "active",
  },
  {
    employeeId: "emp-2",
    name: "Bob Jones",
    email: "bob@example.com",
    department: "HR",
    role: "HR Manager",
    yearlySalary: 90000,
    status: "disabled",
  },
];

describe("EmployeeTable Component", () => {
  const mockApi = vi.mocked(api);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show a loading spinner initially", async () => {
    mockApi.get.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<EmployeeTable />);
    expect(screen.getByText(/Loading employees.../i)).toBeInTheDocument();
  });

  it("should render employee data correctly after fetching", async () => {
    mockApi.get.mockResolvedValue({ data: mockEmployees });
    render(<EmployeeTable />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading employees.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText("HR Manager")).toBeInTheDocument();
  });

  it("should show empty state message when no employees are returned", async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    render(<EmployeeTable />);

    await waitFor(() => {
      expect(screen.getByText(/No employees found matching your criteria/i)).toBeInTheDocument();
    });
  });

  it("should show error message when API call fails", async () => {
    mockApi.get.mockRejectedValue(new Error("API Error"));
    render(<EmployeeTable />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch employees/i)).toBeInTheDocument();
    });
  });

  it("should trigger a search when typing in the search box", async () => {
    mockApi.get.mockResolvedValue({ data: mockEmployees });
    render(<EmployeeTable />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by name.../i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by name.../i);
    fireEvent.change(searchInput, { target: { value: "Alice" } });

    // Wait for debounce (useDeferredValue)
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining("name=Alice"));
    }, { timeout: 2000 });
  });

  it("should trigger a filter when changing department", async () => {
    mockApi.get.mockResolvedValue({ data: mockEmployees });
    render(<EmployeeTable />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Engineering" } });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining("department=Engineering"));
    });
  });

  it("should call onEdit callback when clicking edit button", async () => {
    const onEditMock = vi.fn();
    mockApi.get.mockResolvedValue({ data: mockEmployees });
    render(<EmployeeTable isAdminView={true} onEdit={onEditMock} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle(/Edit Employee/i);
    fireEvent.click(editButtons[0]);

    expect(onEditMock).toHaveBeenCalledWith(mockEmployees[0]);
  });

  it("should call onDelete callback when clicking delete button", async () => {
    const onDeleteMock = vi.fn();
    mockApi.get.mockResolvedValue({ data: mockEmployees });
    render(<EmployeeTable isAdminView={true} onDelete={onDeleteMock} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/Delete Employee/i);
    fireEvent.click(deleteButtons[0]);

    expect(onDeleteMock).toHaveBeenCalledWith(mockEmployees[0]);
  });

  it("should not show action buttons when isAdminView is false", async () => {
    mockApi.get.mockResolvedValue({ data: mockEmployees });
    render(<EmployeeTable isAdminView={false} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });

    expect(screen.queryByTitle(/Edit Employee/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Delete Employee/i)).not.toBeInTheDocument();
  });

  it("should have high-contrast styling for search input and filter select", async () => {
    mockApi.get.mockResolvedValue({ data: mockEmployees });
    render(<EmployeeTable />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by name.../i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by name.../i);
    const filterSelect = screen.getByRole("combobox");

    expect(searchInput).toHaveClass("bg-white", "text-gray-900");
    expect(filterSelect).toHaveClass("bg-white", "text-gray-900");
  });
});
