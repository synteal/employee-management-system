import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import EmployeeForm from "./EmployeeForm";

describe("EmployeeForm Component", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    render(
      <EmployeeForm
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render empty fields in 'Add New Employee' mode", () => {
    render(
      <EmployeeForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.getByText("Add New Employee")).toBeInTheDocument();
    expect(screen.getByLabelText(/Employee ID \*/i)).toHaveValue("");
    expect(screen.getByLabelText(/Full Name \*/i)).toHaveValue("");
    expect(screen.getByLabelText(/Email Address \*/i)).toHaveValue("");
    expect(screen.getByLabelText(/Department \*/i)).toHaveValue("Engineering");
    expect(screen.getByLabelText(/Role \*/i)).toHaveValue("");
    expect(screen.getByLabelText(/Yearly Salary \*/i)).toHaveValue(0);
    expect(screen.getByLabelText(/Status/i)).toHaveValue("active");
  });

  it("should pre-fill fields in 'Edit Employee' mode", () => {
    const initialData = {
      employeeId: "emp-1",
      name: "John Doe",
      email: "john@example.com",
      department: "Sales",
      role: "Sales Rep",
      yearlySalary: 75000,
      status: "active" as const,
    };

    render(
      <EmployeeForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        initialData={initialData}
      />
    );

    expect(screen.getByText("Edit Employee")).toBeInTheDocument();
    expect(screen.getByLabelText(/Employee ID \*/i)).toHaveValue("emp-1");
    expect(screen.getByLabelText(/Employee ID \*/i)).toBeDisabled();
    expect(screen.getByLabelText(/Full Name \*/i)).toHaveValue("John Doe");
    expect(screen.getByLabelText(/Email Address \*/i)).toHaveValue("john@example.com");
    expect(screen.getByLabelText(/Department \*/i)).toHaveValue("Sales");
    expect(screen.getByLabelText(/Role \*/i)).toHaveValue("Sales Rep");
    expect(screen.getByLabelText(/Yearly Salary \*/i)).toHaveValue(75000);
  });

  it("should show validation error if required fields are missing on submit", async () => {
    render(
      <EmployeeForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText("Save"));

    expect(screen.getByText(/Please fill in all required fields/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should call onSubmit with form data when valid", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(
      <EmployeeForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText(/Employee ID \*/i), { target: { value: "emp-999" } });
    fireEvent.change(screen.getByLabelText(/Full Name \*/i), { target: { value: "Jane Smith" } });
    fireEvent.change(screen.getByLabelText(/Email Address \*/i), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText(/Role \*/i), { target: { value: "Developer" } });
    fireEvent.change(screen.getByLabelText(/Yearly Salary \*/i), { target: { value: "100000" } });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        employeeId: "emp-999",
        name: "Jane Smith",
        email: "jane@example.com",
        role: "Developer",
        yearlySalary: 100000,
        department: "Engineering",
        status: "active"
      }));
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should call onClose when clicking Cancel button", () => {
    render(
      <EmployeeForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should handle error during submission", async () => {
    mockOnSubmit.mockRejectedValue(new Error("Failed to save"));
    
    render(
      <EmployeeForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill all fields
    fireEvent.change(screen.getByLabelText(/Employee ID \*/i), { target: { value: "emp-1" } });
    fireEvent.change(screen.getByLabelText(/Full Name \*/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/Email Address \*/i), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByLabelText(/Role \*/i), { target: { value: "Dev" } });
    fireEvent.change(screen.getByLabelText(/Yearly Salary \*/i), { target: { value: "100" } });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText("Failed to save")).toBeInTheDocument();
    });
  });
});
