import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import api from "../api/axios";

// Mock the API
vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock Recharts to avoid JSDOM measurement issues
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div style={{ width: "100%", height: "100%" }}>{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-slice">{children}</div>,
  Cell: () => null,
  Tooltip: () => null,
  Legend: () => <div data-testid="legend" />,
}));

describe("Dashboard Page", () => {
  const mockApi = vi.mocked(api);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    total_employees: 10,
    active_employees: 8,
    department_count: 3,
    department_distribution: {
      Engineering: 5,
      Product: 3,
      Sales: 2,
    },
  };

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  };

  it("should display analytics loading initially", async () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/Loading analytics.../i)).toBeInTheDocument();
  });

  it("should render statistics correctly after data is loaded", async () => {
    mockApi.get.mockResolvedValue({ data: mockData });
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Loading analytics.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("Total Employees")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Active Employees")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Departments")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should render the chart when data is available", async () => {
    mockApi.get.mockResolvedValue({ data: mockData });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });

    expect(screen.getByText("Employees by Department")).toBeInTheDocument();
  });

  it("should display empty state if no distribution data is returned", async () => {
    const emptyData = {
      total_employees: 0,
      active_employees: 0,
      department_count: 0,
      department_distribution: {},
    };
    mockApi.get.mockResolvedValue({ data: emptyData });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No distribution data available/i)).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
  });

  it("should handle API failure gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockApi.get.mockRejectedValue(new Error("API Error"));
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Loading analytics.../i)).not.toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to fetch data for dashboard",
      expect.any(Error)
    );
    expect(screen.getByText(/No distribution data available/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});
