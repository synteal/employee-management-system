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

  it("should render Home link for regular users", () => {
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

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Mgmt")).not.toBeInTheDocument();
  });

  it("should render Dashboard and Mgmt links for admin users", () => {
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

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Mgmt")).toBeInTheDocument();
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

    // Mobile menu button is only visible on small screens, 
    // but in JSDOM we can still find it.
    // Lucide-react Menu icon button
    const menuButton = screen.getByRole("button");
    
    // Initially mobile menu links should not be visible 
    // (Wait, they are in the DOM but conditionally rendered)
    // In Navbar.tsx: {isMobileMenuOpen && ( ... )}
    expect(screen.queryByRole("link", { name: "Home", hidden: false })).toBeInTheDocument(); // desktop link
    
    // We need to differentiate between desktop and mobile links if they share text.
    // In Navbar.tsx, desktop links are in a div with .hidden.md:flex.
    // Mobile links are in a div with .md:hidden.
    
    // Let's check for the presence of the mobile menu div
    // It's not there by default
    expect(screen.queryByText("Home", { selector: ".md\\:hidden a" })).not.toBeInTheDocument();

    // Open mobile menu
    fireEvent.click(menuButton);
    
    // Now it should be there
    // Re-querying specifically for the mobile menu container or its content
    expect(screen.getAllByText("Home").length).toBe(2); // One for desktop, one for mobile
  });
});
