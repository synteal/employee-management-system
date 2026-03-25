// src/pages/Logout.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LinkProps } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import api from "../api/axios";
import Logout from "./Logout";

// Mock the libraries we depend on
vi.mock("axios");
vi.mock("../api/axios", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
  isApiError: vi.fn((err: unknown) => !!(err as any)?.response),
  getApiErrorMessage: vi.fn(
    (err: any) => err.response?.data?.detail || "An unexpected error occurred",
  ),
}));

const mockedAxios = vi.mocked(axios, true);
const mockedApi = vi.mocked(api, true);

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: LinkProps) => <a href={to as string}>{children}</a>,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    logout: vi.fn(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      mockNavigate("/login");
    }),
  }),
}));

describe("Logout Page", () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    vi.clearAllMocks();
    localStorage.clear();
    // Default mock for isAxiosError
    mockedAxios.isAxiosError.mockImplementation(
      (err: unknown): err is any => !!(err as any)?.response,
    );
  });

  it("1. should render the logout confirmation page correctly", () => {
    render(<Logout />);

    // Check if the confirmation text and logout button exist
    expect(
      screen.getByText(/are you sure you want to log out/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm logout/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("2. should navigate back when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<Logout />);

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelBtn);

    // Expect to navigate back (e.g., to home or previous page, let's say '/')
    // We could either test navigate(-1) or navigate('/') depending on implementation
    // Assuming navigating to home is the default cancel action
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("3. should call backend, clear localStorage, and redirect to login on successful logout", async () => {
    const user = userEvent.setup();

    // Pre-populate localStorage to verify it gets cleared
    localStorage.setItem("token", "fake-jwt-token");
    localStorage.setItem("role", "user");

    render(<Logout />);

    // Setup a successful API response
    const mockResponse = {
      data: { message: "Logged out successfully" },
    };
    mockedApi.post.mockResolvedValueOnce(mockResponse);

    // Click the confirm logout button
    const confirmBtn = screen.getByRole("button", { name: /confirm logout/i });
    await user.click(confirmBtn);

    // Wait for the asynchronous actions to complete
    await waitFor(() => {
      // Ensure api.post was called with the right endpoint
      // The interceptor handles the Authorization header
      expect(mockedApi.post).toHaveBeenCalledWith("/auth/logout", {});

      // Ensure localStorage was cleared
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("role")).toBeNull();

      // Ensure we navigated to the login route
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("4. should still clear localStorage and redirect to login even if backend logout fails", async () => {
    const user = userEvent.setup();

    localStorage.setItem("token", "fake-jwt-token");
    localStorage.setItem("role", "user");

    render(<Logout />);

    // Setup an intentional API failure
    mockedApi.post.mockRejectedValueOnce({
      response: { data: { detail: "Token already expired" } },
    });

    // Click the confirm logout button
    const confirmBtn = screen.getByRole("button", { name: /confirm logout/i });
    await user.click(confirmBtn);

    // Verify localStorage is cleared and user is redirected regardless of backend failure
    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("role")).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
});
