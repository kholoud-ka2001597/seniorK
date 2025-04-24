import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Package,
  Calendar,
  Cat as Categories,
  RefreshCw,
  Download,
} from "lucide-react";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#6366F1",
  "#84CC16",
  "#F97316",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function StatisticsDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("30");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeChart, setActiveChart] = useState(null);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/dashboard?days=${dateRange}`);
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(dashboardData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dashboard-data-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            No Data Available
          </h2>
          <p className="text-gray-600">Please try refreshing the dashboard.</p>
        </div>
      </div>
    );
  }

  const userRolesData = [
    { name: "Buyers", value: dashboardData.buyersCount },
    { name: "Sellers", value: dashboardData.sellersCount },
  ];

  const servicesCategoriesData = dashboardData.serviceCategories.map(
    (category) => ({
      name: category.category,
      value: Number(category.count),
    })
  );

  const totalUsers = dashboardData.buyersCount + dashboardData.sellersCount;
  const previousTotalUsers = totalUsers * 0.9;
  const userGrowth =
    ((totalUsers - previousTotalUsers) / previousTotalUsers) * 100;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Analytics Dashboard
          </h1>
          <div className="flex gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <h2 className="text-2xl font-bold text-gray-800">
                  {totalUsers.toLocaleString()}
                </h2>
              </div>
              <div
                className={`flex items-center ${
                  userGrowth >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {userGrowth >= 0 ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )}
                <span className="ml-1 text-sm font-medium">
                  {Math.abs(userGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm text-gray-500">
              <span>Buyers: {dashboardData.buyersCount.toLocaleString()}</span>
              <span>
                Sellers: {dashboardData.sellersCount.toLocaleString()}
              </span>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Services</p>
                <h2 className="text-2xl font-bold text-gray-800">
                  {dashboardData.servicesCount.toLocaleString()}
                </h2>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Active services across all categories
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Recent Reservations
                </p>
                <h2 className="text-2xl font-bold text-gray-800">
                  {dashboardData.reservationsByDate
                    .reduce((sum, item) => sum + item.count, 0)
                    .toLocaleString()}
                </h2>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">In selected period</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Service Categories</p>
                <h2 className="text-2xl font-bold text-gray-800">
                  {servicesCategoriesData.length}
                </h2>
              </div>
              <Categories className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Different types available</p>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-100"
            onHoverStart={() => setActiveChart("users")}
            onHoverEnd={() => setActiveChart(null)}
          >
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              User Distribution
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userRolesData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {userRolesData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        opacity={activeChart === "users" ? 1 : 0.8}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-100"
            onHoverStart={() => setActiveChart("categories")}
            onHoverEnd={() => setActiveChart(null)}
          >
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Services by Category
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={servicesCategoriesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {servicesCategoriesData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        opacity={activeChart === "categories" ? 1 : 0.8}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 col-span-1 lg:col-span-2"
            onHoverStart={() => setActiveChart("reservations")}
            onHoverEnd={() => setActiveChart(null)}
          >
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Reservations Over Time
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.reservationsByDate}>
                  <defs>
                    <linearGradient
                      id="colorReservations"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorReservations)"
                    name="Reservations"
                    strokeWidth={activeChart === "reservations" ? 3 : 2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg

-white rounded-lg shadow-lg p-6 border border-gray-100 col-span-1 lg:col-span-2"
            onHoverStart={() => setActiveChart("distribution")}
            onHoverEnd={() => setActiveChart(null)}
          >
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Service Categories Distribution
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicesCategoriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name="Number of Services"
                    fill="#82ca9d"
                    radius={[4, 4, 0, 0]}
                    opacity={activeChart === "distribution" ? 1 : 0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
