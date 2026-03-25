import React, { useState, useEffect } from "react";
import api from "../api/axios";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Users, Building, Activity } from "lucide-react";

interface ChartData {
  name: string;
  value: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface EmployeeSummary {
  total_employees: number;
  active_employees: number;
  department_count: number;
  department_distribution: Record<string, number>;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, departments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get<EmployeeSummary>("/employees/summary");
        const summary = response.data;

        const chartData = Object.entries(summary.department_distribution).map(
          ([name, value]) => ({
            name,
            value: value as number,
          }),
        );

        setData(chartData);
        setStats({
          total: summary.total_employees,
          active: summary.active_employees,
          departments: summary.department_count,
        });
      } catch (err) {
        console.error("Failed to fetch data for dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div 
          data-testid="loading-spinner"
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
        ></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Company employee statistics and distribution.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 flex items-center p-5">
          <div className="flex-shrink-0 bg-blue-100 p-3 rounded-md">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Employees
              </dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {stats.total}
              </dd>
            </dl>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 flex items-center p-5">
          <div className="flex-shrink-0 bg-green-100 p-3 rounded-md">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Active Employees
              </dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {stats.active}
              </dd>
            </dl>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 flex items-center p-5">
          <div className="flex-shrink-0 bg-purple-100 p-3 rounded-md">
            <Building className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Departments
              </dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {stats.departments}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="bg-white shadow rounded-lg border border-gray-100 p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Employees by Department
        </h3>
        {data.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} employees`, "Count"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-10">
            No data available to display chart.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
