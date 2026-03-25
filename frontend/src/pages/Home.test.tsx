import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Home from "./Home";
import { useAuth } from "../context/AuthContext";

// Mock useAuth
vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock EmployeeTable to simplify tests
vi.mock("../components/EmployeeTable", () => ({
  default: ({ isAdminView }: { isAdminView: boolean }) => (
    <div data-testid="employee-table">
      Employee Table (Admin View: {isAdminView.toString()})
    </div>
  ),
}));

// Mock react-router-dom's Link to avoid routing issues in simple tests
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

describe("Home Page", () => {
  const mockUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the welcome message with the username", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "johndoe", role: "user" },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as any);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/Welcome, johndoe!/i)).toBeInTheDocument();
  });

  it("should display 'User' if username is missing", () => {
    mockUseAuth.mockReturnValue({
      user: { role: "user" },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as any);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/Welcome, User!/i)).toBeInTheDocument();
  });

  it("should show the Employee Management link for admins", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "adminuser", role: "admin" },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as any);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/Employee Management/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Employee Management/i })).toHaveAttribute("href", "/management");
  });

  it("should NOT show the Employee Management link for regular users", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "regularuser", role: "user" },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as any);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.queryByText(/Employee Management/i)).not.toBeInTheDocument();
  });

  it("should render the EmployeeTable component", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "testuser", role: "user" },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as any);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const table = screen.getByTestId("employee-table");
    expect(table).toBeInTheDocument();
    expect(table).toHaveTextContent("Admin View: false");
  });
});
