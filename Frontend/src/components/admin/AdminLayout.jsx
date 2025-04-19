import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import {
  LayoutDashboard,
  Users,
  FileText,
  Bell,
  LogOut,
  User,
  Settings,
  ChevronDown,
  MessageSquare,
  Moon,
  Sun,
} from "lucide-react";

const AdminLayout = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    // Prevent body scrolling
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    {
      path: "/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      path: "/admin/notifications",
      label: "Notifications",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      path: "/admin/users",
      label: "Users",
      icon: <Users className="w-5 h-5" />,
    },
    {
      path: "/admin/posts",
      label: "Posts",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      path: "/admin/settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const getCurrentPageTitle = () => {
    const currentItem = navItems.find(
      (item) => item.path === location.pathname
    );
    return currentItem ? currentItem.label : "Admin";
  };

  return (
    <div className="fixed inset-0 flex bg-base-100 overflow-hidden">
      {/* Sidebar for Desktop/Tablet - Fixed Position */}
      <aside className="hidden md:flex flex-col w-64 bg-base-200 shadow-lg fixed top-0 bottom-0">
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-semibold text-base-content">
              Admin Panel
            </span>
          </div>
        </div>
        <nav className="flex-1 py-4 overflow-hidden">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-content"
                        : "text-base-content hover:bg-base-300"
                    }`
                  }>
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-base-300 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-error hover:bg-error/10 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Navbar - Fixed at top */}
        <header className="bg-base-100 shadow-sm fixed top-0 left-0 right-0 md:left-64 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-base-content">
                {getCurrentPageTitle()}
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-base-200 transition-colors"
                aria-label="Toggle theme">
                {theme === "light" ? (
                  <Moon className="w-5 h-5 text-base-content" />
                ) : (
                  <Sun className="w-5 h-5 text-base-content" />
                )}
              </button>
              <NavLink
                to="/admin/notifications"
                className="md:hidden p-2 text-base-content hover:text-primary transition-colors relative">
                <Bell className="w-5 h-5" />
                {location.pathname === "/admin/notifications" && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
                )}
              </NavLink>
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-base-200 transition-colors"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm">
                    {user?.name?.charAt(0) || "A"}
                  </div>
                  <span className="hidden md:inline text-base-content">
                    {user?.name || "Admin"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-base-content" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-base-100 rounded-lg shadow-lg py-2 z-50">
                    <NavLink
                      to="/admin/profile"
                      className="flex items-center gap-2 px-4 py-2 text-base-content hover:bg-base-200"
                      onClick={() => setUserMenuOpen(false)}>
                      <User className="w-4 h-4" />
                      Profile
                    </NavLink>
                    <NavLink
                      to="/admin/settings"
                      className="flex items-center gap-2 px-4 py-2 text-base-content hover:bg-base-200"
                      onClick={() => setUserMenuOpen(false)}>
                      <Settings className="w-4 h-4" />
                      Settings
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-error hover:bg-error/10">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Only this area is scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-base-100 mt-16 pb-16 md:pb-0 scroll-smooth">
          <Outlet />
        </main>

        {/* Mobile Status Bar - Fixed Bottom */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 z-30">
          <nav className="flex justify-around py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 p-2 ${
                    isActive ? "text-primary" : "text-base-content"
                  }`
                }>
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
