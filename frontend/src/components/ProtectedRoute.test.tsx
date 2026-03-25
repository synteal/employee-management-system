import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";

// Mock useAuth
vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("ProtectedRoute Component", () => {
  const mockUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const TestComponent = () => <div>Protected Content</div>;
  const LoginComponent = () => <div>Login Page</div>;
  const HomeComponent = () => <div>Home Page</div>;

  const renderWithRouter = (requiredRole?: "admin" | "user") => {
    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route element={<ProtectedRoute requiredRole={requiredRole} />}>
            <Route path="/protected" element={<TestComponent />} />
          </Route>
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/" element={<HomeComponent />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("should show loading spinner when isLoading is true", () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      user: null,
    } as any);

    render(<ProtectedRoute />);
    // Check for the spinner div (animate-spin)
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("should redirect to login if not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
    } as any);

    renderWithRouter();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("should render protected content if authenticated and no role required", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { username: "testuser", role: "user" },
    } as any);

    renderWithRouter();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("should redirect to home if role mismatched", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { username: "testuser", role: "user" },
    } as any);

    renderWithRouter("admin");
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("should allow access if role matches requiredRole", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { username: "testadmin", role: "admin" },
    } as any);

    renderWithRouter("admin");
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("should allow admin access to user-protected routes", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { username: "admin", role: "admin" },
    } as any);

    renderWithRouter("user");
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
