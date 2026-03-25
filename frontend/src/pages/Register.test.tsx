import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LinkProps } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../api/axios";
import Register from "./Register";

// Mock the libraries we depend on
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
  getApiErrorMessage: vi.fn(
    (err: any) => err.response?.data?.detail || "An unexpected error occurred",
  ),
}));

const mockedApi = vi.mocked(api, true);

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: LinkProps) => <a href={to as string}>{children}</a>,
}));

describe("Register Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. should render the registration form correctly", () => {
    render(<Register />);

    expect(
      screen.getByPlaceholderText(/name \/ username/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /register/i }),
    ).toBeInTheDocument();
  });

  it("2. should show validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<Register />);

    const submitBtn = screen.getByRole("button", { name: /register/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/name\/username is required/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/password is required/i),
    ).toBeInTheDocument();
  });

  it("3. should show validation error for password less than 8 characters", async () => {
    const user = userEvent.setup();
    render(<Register />);

    await user.type(
      screen.getByPlaceholderText(/name \/ username/i),
      "testuser",
    );
    await user.type(
      screen.getByPlaceholderText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByPlaceholderText(/password/i), "1234567");

    const submitBtn = screen.getByRole("button", { name: /register/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("4. should successfully submit when password is 8 characters", async () => {
    const user = userEvent.setup();
    render(<Register />);

    mockedApi.post.mockResolvedValueOnce({ data: {} });

    await user.type(
      screen.getByPlaceholderText(/name \/ username/i),
      "testuser",
    );
    await user.type(
      screen.getByPlaceholderText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByPlaceholderText(/password/i), "12345678");

    const submitBtn = screen.getByRole("button", { name: /register/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith("/auth/register", {
        name: "testuser",
        username: "testuser",
        email: "test@example.com",
        password: "12345678",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
});
