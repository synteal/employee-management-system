import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";

// Mock useAuth
vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("Navbar Component", () => {
  const mockUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the logo", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "testuser", role: "user" },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText("EMS")).toBeInTheDocument();
  });

  it("should render Employees link for regular users", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "testuser", role: "user" },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText("Employees")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("should render Employees and Dashboard links for admin users", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "admin", role: "admin" },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText("Employees")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Mgmt")).not.toBeInTheDocument();
  });

  it("should render Dashboard before Employees for admin users", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "admin", role: "admin" },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const links = screen.getAllByRole("link");
    const linkTexts = links.map((link) => link.textContent);
    
    // The first mobile link might be in the list if we don't filter.
    // Desktop links are usually rendered first in the DOM in this component.
    // Let's find the indices of Dashboard and Employees in the linkTexts array.
    const dashboardIndex = linkTexts.indexOf("Dashboard");
    const employeesIndex = linkTexts.indexOf("Employees");

    expect(dashboardIndex).toBeLessThan(employeesIndex);
  });

  it("should display the user's name and role", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "testuser", role: "user" },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByText("(user)")).toBeInTheDocument();
  });

  it("should have a logout link", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "testuser", role: "user" },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const logoutLink = screen.getByRole("link", { name: /logout/i });
    expect(logoutLink).toBeInTheDocument();
    expect(logoutLink.getAttribute("href")).toBe("/logout");
  });

  it("should toggle the mobile menu", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "testuser", role: "user" },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const menuButton = screen.getByRole("button");
    
    // Desktop links are visible
    expect(screen.queryByRole("link", { name: "Employees", hidden: false })).toBeInTheDocument();
    
    // Mobile menu container is not there initially
    // (Wait, the container might be there but hidden, or it's conditionally rendered in React)
    // Looking at Navbar.tsx: {isMobileMenuOpen && ( ... )}
    
    // Open mobile menu
    fireEvent.click(menuButton);
    
    // Now we should have 2 Employees links (one desktop, one mobile)
    expect(screen.getAllByText("Employees").length).toBe(2);
  });
});
