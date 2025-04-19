import { useState, useEffect } from "react";
import {
  BarChart2,
  Users,
  FileText,
  Bell,
  TrendingUp,
  Activity,
  UserPlus,
  Calendar,
  Zap,
  Award,
  Eye,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Flag,
  CheckCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { axiosInstance } from "../../lib/axios";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalNotifications: 0,
    newUsersToday: 0,
    newPostsToday: 0,
    activeUsers: 0,
    flaggedPosts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("week");
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState(null);

  // State for storing activity data by time range
  const [activityData, setActivityData] = useState({
    day: [],
    week: [],
    month: [],
  });
  const [deviceDistribution, setDeviceDistribution] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    userEngagement: "0.0",
    notificationRate: "0.0",
    activeUserRate: "0",
  });

  // Fetch initial data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch data when time range changes
  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  // Function to fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(
        `/admin/stats?timeRange=${timeRange}`
      );

      // Update all state with the response data
      setStats(response.data.stats);
      setActivityData(response.data.activityData);
      setDeviceDistribution(response.data.deviceDistribution);
      setPerformanceMetrics(response.data.performanceMetrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh data handler
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Calculate percentage change
  const calculateChange = (today, total) => {
    if (total === 0) return 0;
    return Math.round((today / total) * 100);
  };

  // Format numbers with commas
  const formatNumber = (value) => {
    return value?.toLocaleString() || "0";
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(date);
  };

  // Get color class based on growth value
  const getGrowthClass = (value) => {
    if (value > 0) return "text-emerald-500";
    if (value < 0) return "text-rose-500";
    return "text-gray-500";
  };

  // Get current data based on selected time range
  const getCurrentTimeRangeData = () => {
    return activityData[timeRange] || [];
  };

  // Get current tab content data
  const getFilteredDataForTab = () => {
    const currentData = getCurrentTimeRangeData();

    switch (activeTab) {
      case "users":
        return currentData.map((item) => ({
          name: item.name,
          users: item.users,
          activeUsers: item.activeUsers,
        }));
      case "content":
        return currentData.map((item) => ({
          name: item.name,
          posts: item.posts,
          flaggedPosts: stats.flaggedPosts
            ? Math.round((item.posts / stats.totalPosts) * stats.flaggedPosts)
            : 0, // Estimate flagged posts distribution
        }));
      case "analytics":
        return currentData.map((item) => ({
          name: item.name,
          engagement: item.users > 0 ? Math.round((item.posts / item.users) * 100) : 0,
          notifications: item.notifications,
        }));
      default: // "overview"
        return currentData;
    }
  };

  // Get chart type and properties based on active tab
  const getChartConfig = () => {
    const data = getFilteredDataForTab();

    switch (activeTab) {
      case "users":
        return {
          bars: [
            { dataKey: "users", name: "Total Users", fill: "#4f46e5" },
            { dataKey: "activeUsers", name: "Active Users", fill: "#10b981" },
          ],
        };
      case "content":
        return {
          bars: [
            { dataKey: "posts", name: "Total Posts", fill: "#ec4899" },
            { dataKey: "flaggedPosts", name: "Flagged Posts", fill: "#f59e0b" },
          ],
        };
      case "analytics":
        return {
          type: "line",
          lines: [
            {
              dataKey: "engagement",
              name: "Engagement %",
              stroke: "#06b6d4",
              strokeWidth: 2,
            },
            {
              dataKey: "notifications",
              name: "Notifications",
              stroke: "#8b5cf6",
              strokeWidth: 2,
            },
          ],
        };
      default: // "overview"
        return {
          bars: [
            { dataKey: "users", name: "New Users", fill: "#4f46e5" },
            { dataKey: "posts", name: "New Posts", fill: "#ec4899" },
            {
              dataKey: "notifications",
              name: "Notifications",
              fill: "#06b6d4",
            },
          ],
        };
    }
  };

  // Get appropriate title for the main chart based on active tab
  const getChartTitle = () => {
    switch (activeTab) {
      case "users":
        return "User Activity";
      case "content":
        return "Content Metrics";
      case "analytics":
        return "Engagement Analytics";
      default:
        return "Platform Overview";
    }
  };

  // Get device icon based on device name
  const getDeviceIcon = (deviceName) => {
    switch (deviceName.toLowerCase()) {
      case "mobile":
        return <Smartphone className="w-4 h-4" />;
      case "desktop":
        return <Monitor className="w-4 h-4" />;
      case "tablet":
        return <Tablet className="w-4 h-4" />;
      default:
        return <Laptop className="w-4 h-4" />;
    }
  };

  if (loading && !lastUpdated) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-base-100 to-base-200">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-lg font-medium animate-pulse">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (error && !lastUpdated) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-base-100 to-base-200">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-error" />
          <h2 className="text-xl font-bold">Failed to Load Dashboard</h2>
          <p className="text-base-content/70">{error}</p>
          <button className="btn btn-primary" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const chartConfig = getChartConfig();
  const chartData = getFilteredDataForTab();
  const COLORS = ["#4f46e5", "#ec4899", "#06b6d4", "#10b981"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl shadow-sm">
            <BarChart2 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Dashboard Overview</h2>
            <p className="text-base-content/70">
              Welcome to your analytics center
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 bg-base-200 p-1 rounded-lg shadow-sm">
            <button
              className={`px-4 py-2 rounded-md transition-all ${timeRange === "day"
                  ? "bg-primary text-white"
                  : "hover:bg-base-300"
                }`}
              onClick={() => setTimeRange("day")}>
              Day
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-all ${timeRange === "week"
                  ? "bg-primary text-white"
                  : "hover:bg-base-300"
                }`}
              onClick={() => setTimeRange("week")}>
              Week
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-all ${timeRange === "month"
                  ? "bg-primary text-white"
                  : "hover:bg-base-300"
                }`}
              onClick={() => setTimeRange("month")}>
              Month
            </button>
          </div>
          <button
            className="btn btn-outline btn-sm flex items-center gap-2"
            onClick={handleRefresh}
            disabled={loading}>
            {loading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Last Updated Info */}
      {lastUpdated && (
        <div className="flex justify-end items-center text-xs text-base-content/60 mb-2">
          <Calendar className="w-3 h-3 mr-1" />
          Last updated: {formatDate(lastUpdated)}
        </div>
      )}

      {/* Main Tabs */}
      <div className="tabs tabs-boxed bg-base-200 p-1 mb-6 justify-center">
        <button
          className={`tab tab-lg transition-all ${activeTab === "overview" ? "tab-active" : ""
            }`}
          onClick={() => setActiveTab("overview")}>
          Overview
        </button>
        <button
          className={`tab tab-lg transition-all ${activeTab === "users" ? "tab-active" : ""
            }`}
          onClick={() => setActiveTab("users")}>
          Users
        </button>
        <button
          className={`tab tab-lg transition-all ${activeTab === "content" ? "tab-active" : ""
            }`}
          onClick={() => setActiveTab("content")}>
          Content
        </button>
        <button
          className={`tab tab-lg transition-all ${activeTab === "analytics" ? "tab-active" : ""
            }`}
          onClick={() => setActiveTab("analytics")}>
          Analytics
        </button>
      </div>

      {/* Stats Cards Grid with Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-base-100 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="card-body p-6">
            <div className="flex justify-between">
              <div className="bg-primary/10 rounded-xl p-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div
                className={`badge ${getGrowthClass(
                  stats.newUsersToday
                )} gap-1`}>
                <Zap size={12} />+
                {calculateChange(stats.newUsersToday, stats.totalUsers)}%
              </div>
            </div>
            <h2 className="card-title mt-4 text-3xl font-bold">
              {formatNumber(stats.totalUsers)}
            </h2>
            <p className="text-base-content/70">Total Users</p>
            <div className="mt-2 flex items-center text-xs text-base-content/70">
              <UserPlus size={14} className="mr-1" />
              <span>{stats.newUsersToday} new today</span>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="card-body p-6">
            <div className="flex justify-between">
              <div className="bg-secondary/10 rounded-xl p-3">
                <FileText className="w-6 h-6 text-secondary" />
              </div>
              <div
                className={`badge ${getGrowthClass(
                  stats.newPostsToday
                )} gap-1`}>
                <Zap size={12} />+
                {calculateChange(stats.newPostsToday, stats.totalPosts)}%
              </div>
            </div>
            <h2 className="card-title mt-4 text-3xl font-bold">
              {formatNumber(stats.totalPosts)}
            </h2>
            <p className="text-base-content/70">Total Posts</p>
            <div className="mt-2 flex items-center text-xs text-base-content/70">
              <Activity size={14} className="mr-1" />
              <span>{stats.newPostsToday} new today</span>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="card-body p-6">
            <div className="flex justify-between">
              <div className="bg-accent/10 rounded-xl p-3">
                <Bell className="w-6 h-6 text-accent" />
              </div>
              <div className="badge badge-accent gap-1">
                <Zap size={12} />
                Active
              </div>
            </div>
            <h2 className="card-title mt-4 text-3xl font-bold">
              {formatNumber(stats.totalNotifications)}
            </h2>
            <p className="text-base-content/70">Notifications</p>
            <div className="mt-2 flex items-center text-xs text-base-content/70">
              <Calendar size={14} className="mr-1" />
              <span>Updated just now</span>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="card-body p-6">
            <div className="flex justify-between">
              <div className="bg-info/10 rounded-xl p-3">
                <Award className="w-6 h-6 text-info" />
              </div>
              <div className="badge badge-info gap-1">
                <Zap size={12} />
                Active
              </div>
            </div>
            <h2 className="card-title mt-4 text-3xl font-bold">
              {formatNumber(stats.activeUsers)}
            </h2>
            <p className="text-base-content/70">Active Users</p>
            <div className="mt-2 flex items-center text-xs text-base-content/70">
              <Eye size={14} className="mr-1" />
              <span>Currently online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="card bg-base-100 shadow-lg lg:col-span-2">
          <div className="card-body">
            <div className="flex justify-between items-center mb-6">
              <h3 className="card-title text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {getChartTitle()}
              </h3>
              <div className="badge badge-outline">
                {timeRange === "day"
                  ? "Last 24 hours"
                  : timeRange === "week"
                    ? "Last 7 days"
                    : "Last month"}
              </div>
            </div>

            {loading && (
              <div className="absolute inset-0 bg-base-100/50 flex items-center justify-center z-10">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            )}

            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {chartConfig.type === "line" ? (
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        border: "none",
                      }}
                    />
                    <Legend />
                    {chartConfig.lines.map((line, index) => (
                      <Line
                        key={index}
                        type="monotone"
                        dataKey={line.dataKey}
                        name={line.name}
                        stroke={line.stroke}
                        strokeWidth={line.strokeWidth || 2}
                        dot={{ r: 4 }}
                        activeDot={{
                          r: 6,
                          stroke: line.stroke,
                          strokeWidth: 2,
                          fill: "white",
                        }}
                      />
                    ))}
                  </LineChart>
                ) : (
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        border: "none",
                      }}
                    />
                    <Legend />
                    {chartConfig.bars.map((bar, index) => (
                      <Bar
                        key={index}
                        dataKey={bar.dataKey}
                        name={bar.name}
                        fill={bar.fill}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <AlertTriangle className="w-12 h-12 text-warning mb-2" />
                <p className="text-base-content/70">No data available for the selected time range</p>
              </div>
            )}
          </div>
        </div>

        {/* Added Device Distribution Chart */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title text-lg font-bold flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Device Distribution
            </h3>
            
            {deviceDistribution.length > 0 ? (
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={deviceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {deviceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} users`, 'Count']}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        border: "none",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  {deviceDistribution.map((device, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-md bg-base-200/50"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <div className="flex items-center gap-1">
                        {getDeviceIcon(device.name)}
                        <span className="text-sm font-medium">{device.name}</span>
                      </div>
                      <span className="text-xs ml-auto">{formatNumber(device.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <AlertTriangle className="w-12 h-12 text-warning mb-2" />
                <p className="text-base-content/70">No device data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Added Performance Metrics and Flagged Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Performance Metrics Cards */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title text-lg font-bold flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              Performance Metrics
            </h3>
            
            <div className="space-y-4">
              <div className="bg-base-200/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <FileText className="w-4 h-4 text-primary" /> Posts per User
                  </span>
                  <span className="text-lg font-bold">{performanceMetrics.userEngagement}</span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${Math.min(parseFloat(performanceMetrics.userEngagement) * 10, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-base-200/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Bell className="w-4 h-4 text-secondary" /> Notifications per Post
                  </span>
                  <span className="text-lg font-bold">{performanceMetrics.notificationRate}</span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-2">
                  <div
                    className="bg-secondary h-2 rounded-full"
                    style={{ width: `${Math.min(parseFloat(performanceMetrics.notificationRate) * 10, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-base-200/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Users className="w-4 h-4 text-accent" /> Active User Rate
                  </span>
                  <span className="text-lg font-bold">{performanceMetrics.activeUserRate}%</span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full"
                    style={{ width: `${performanceMetrics.activeUserRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Flagged Content Section */}
        <div className="card bg-base-100 shadow-lg lg:col-span-2">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title text-lg font-bold flex items-center gap-2">
                <Flag className="w-5 h-5 text-warning" />
                Content Moderation
              </h3>
              <div className="badge badge-warning badge-lg">
                {stats.flaggedPosts} Flagged Posts
              </div>
            </div>
      
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Category</th>
                    <th>Count</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="flex items-center gap-2">
                      <div className="badge badge-warning badge-sm">Pending</div>
                      <span className="font-medium">Spam</span>
                    </td>
                    <td>Content</td>
                    <td>{Math.round(stats.flaggedPosts * 0.4)}</td>
                    <td>{(stats.totalPosts > 0 ? (stats.flaggedPosts * 0.4 / stats.totalPosts) * 100 : 0).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="flex items-center gap-2">
                      <div className="badge badge-error badge-sm">High</div>
                      <span className="font-medium">Abuse</span>
                    </td>
                    <td>User</td>
                    <td>{Math.round(stats.flaggedPosts * 0.25)}</td>
                    <td>{(stats.totalPosts > 0 ? (stats.flaggedPosts * 0.25 / stats.totalPosts) * 100 : 0).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="flex items-center gap-2">
                      <div className="badge badge-secondary badge-sm">Medium</div>
                      <span className="font-medium">Misinformation</span>
                    </td>
                    <td>Content</td>
                    <td>{Math.round(stats.flaggedPosts * 0.2)}</td>
                    <td>{(stats.totalPosts > 0 ? (stats.flaggedPosts * 0.2 / stats.totalPosts) * 100 : 0).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="flex items-center gap-2">
                      <div className="badge badge-success badge-sm">Resolved</div>
                      <span className="font-medium">Other</span>
                    </td>
                    <td>Content</td>
                    <td>{Math.round(stats.flaggedPosts * 0.15)}</td>
                    <td>{(stats.totalPosts > 0 ? (stats.flaggedPosts * 0.15 / stats.totalPosts) * 100 : 0).toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
      
            <div className="card-actions justify-end mt-4">
              <button className="btn btn-primary btn-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Review Flagged Content
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard;