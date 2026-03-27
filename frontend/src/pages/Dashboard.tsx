import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Users, Building, Activity, ArrowUpRight } from "lucide-react";

interface ChartData {
  name: string;
  value: number;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

interface EmployeeSummary {
  total_employees: number;
  active_employees: number;
  department_count: number;
  department_distribution: Record<string, number>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, departments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get<EmployeeSummary>("/employees/summary");
        const summary = response.data;

        const chartData = Object.entries(summary.department_distribution || {})
          .filter(([name]) => name !== "null" && name !== "undefined" && name)
          .map(([name, value]) => ({
            name,
            value: value as number,
          }));

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

  const handleCardClick = (params: string) => {
    navigate(`/?${params}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div 
          data-testid="loading-spinner"
          className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"
        ></div>
        <p className="text-gray-500 animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time analytics and employee distribution data.
          </p>
        </div>
        <div className="hidden sm:block text-xs font-medium text-gray-400 uppercase tracking-wider">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <button 
          onClick={() => handleCardClick("")}
          className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-all rounded-xl border border-gray-100 flex items-center p-6 group text-left"
        >
          <div className="flex-shrink-0 bg-blue-50 p-4 rounded-xl group-hover:bg-blue-100 transition-colors">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                Total Employees
                <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </dt>
              <dd className="text-3xl font-bold text-gray-900 mt-1">
                {stats.total}
              </dd>
            </dl>
          </div>
        </button>

        <button 
          onClick={() => handleCardClick("status=active")}
          className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-all rounded-xl border border-gray-100 flex items-center p-6 group text-left"
        >
          <div className="flex-shrink-0 bg-emerald-50 p-4 rounded-xl group-hover:bg-emerald-100 transition-colors">
            <Activity className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                Active Employees
                <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </dt>
              <dd className="text-3xl font-bold text-gray-900 mt-1">
                {stats.active}
              </dd>
            </dl>
          </div>
        </button>

        <button 
          onClick={() => handleCardClick("department=")}
          className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-all rounded-xl border border-gray-100 flex items-center p-6 group text-left"
        >
          <div className="flex-shrink-0 bg-amber-50 p-4 rounded-xl group-hover:bg-amber-100 transition-colors">
            <Building className="h-6 w-6 text-amber-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                Departments
                <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </dt>
              <dd className="text-3xl font-bold text-gray-900 mt-1">
                {stats.departments}
              </dd>
            </dl>
          </div>
        </button>
      </div>

      {/* Charts section */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-bold text-gray-900">
            Employees by Department
          </h3>
          <div className="flex items-center space-y-0 space-x-2">
             <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
             <span className="text-xs text-gray-500 font-medium">Distribution by Headcount</span>
          </div>
        </div>
        
        {data.length > 0 ? (
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 shadow-xl rounded-lg border border-gray-100">
                          <p className="text-sm font-bold text-gray-900">{payload[0].name}</p>
                          <p className="text-xs text-blue-600 font-medium">{payload[0].value} employees</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-medium text-gray-600 px-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Activity className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">No distribution data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
