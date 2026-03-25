// src/pages/Login.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LinkProps } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import api from "../api/axios";
import Login from "./Login";

// 1. Mock the libraries we depend on
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

vi.mock("../context/AuthContext", () => {
  return {
    useAuth: () => ({
      login: vi.fn((token: string, user: any) => {
        localStorage.setItem("token", token);
        localStorage.setItem("role", user.role);
        mockNavigate("/");
      }),
      logout: vi.fn(),
      user: { role: "admin" },
      isAuthenticated: true,
    }),
  };
});

describe("Login Page", () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    vi.clearAllMocks();
    localStorage.clear();
    // Default mock for isAxiosError
    mockedAxios.isAxiosError.mockImplementation(
      (err: unknown): err is any => !!(err as any)?.response,
    );
  });

  it("1. should render the login form correctly", () => {
    render(<Login />);

    // Check if the username input, password input, and submit button exist
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("2. should show validation errors for empty required fields", async () => {
    const user = userEvent.setup();
    render(<Login />);

    // Click the login button without typing anything
    const submitBtn = screen.getByRole("button", { name: /login/i });
    await user.click(submitBtn);

    // Expect validation messages (assuming the component handles UI validation)
    expect(
      await screen.findByText(/username is required/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/password is required/i),
    ).toBeInTheDocument();
  });

  it("3. should display an error message when login fails on the backend", async () => {
    const user = userEvent.setup();
    render(<Login />);

    // Setup an intentional API failure
    mockedApi.post.mockRejectedValueOnce({
      response: { data: { detail: "Invalid credentials" } },
    });

    // Fill in the form
    await user.type(screen.getByPlaceholderText(/username/i), "wronguser");
    await user.type(screen.getByPlaceholderText(/password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /login/i }));

    // Verify the error message appears
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it("4 & 5. should call backend, store JWT and role, and redirect to home on success", async () => {
    const user = userEvent.setup();
    render(<Login />);

    // Setup a successful API response with a mocked JWT containing 'admin' role
    // Payload: {"sub": "admin", "role": "admin"} -> Base64
    const mockToken =
      "header.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.signature";
    const mockResponse = {
      data: { access_token: mockToken },
    };
    mockedApi.post.mockResolvedValueOnce(mockResponse);

    // Fill in the form
    await user.type(screen.getByPlaceholderText(/username/i), "admin");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    // Wait for the asynchronous actions to complete
    await waitFor(() => {
      // Ensure Axios was called with the right endpoint and payload
      // In the component we use api.post("/auth/login", ...) which uses the baseURL from the instance
      expect(mockedApi.post).toHaveBeenCalledWith(
        "/auth/login",
        expect.any(URLSearchParams),
        expect.any(Object),
      );

      // Verify the content of the URLSearchParams
      const callArgs = mockedApi.post.mock.calls[0];
      const params = callArgs[1] as URLSearchParams;
      expect(params.get("username")).toBe("admin");
      expect(params.get("password")).toBe("password123");

      // Ensure localStorage was updated correctly
      expect(localStorage.getItem("token")).toBe(mockToken);
      expect(localStorage.getItem("role")).toBe("admin");

      // Ensure we navigated to the home '/' route
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it('6. should default to "user" role if JWT contains an invalid role', async () => {
    const user = userEvent.setup();
    render(<Login />);

    // JWT with role "hacker"
    const mockToken =
      "header.eyJzdWIiOiJ1c2VyMSIsInJvbGUiOiJoYWNrZXIifQ.signature";
    mockedApi.post.mockResolvedValueOnce({
      data: { access_token: mockToken },
    });

    await user.type(screen.getByPlaceholderText(/username/i), "user1");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      // Check that localStorage now has 'user' as role, not 'hacker'
      // Note: Our mocked login updates localStorage
      expect(localStorage.getItem("role")).toBe("user");
    });
  });
});
