import React, { useEffect } from "react";
import { Home, SquarePlus, User, Settings, LogOut, Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import CreatePost from "../modal/CreatePost";
import useUser from "../hooks/useUser.hook.js";


const StatusBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore()
  const queryParams = new URLSearchParams(location.search);
  const isModalOpen = queryParams.get("modal") === "open"; // ✅ Check if modal is open in URL
  const user = useUser();

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile/${user.username}`);
    // setIsOpen(false);
  };

  const openModal = () => {
    navigate(location.pathname + "?modal=open"); // ✅ Keep current path and just add `?modal=open`
  };

  const closeModal = () => {
    navigate(location.pathname); // ✅ Remove `?modal=open` but keep user on the same page
  };

  // ✅ Refresh hone pe modal automatically open ho
  useEffect(() => {
    isModalOpen;
  }, [isModalOpen]);

  const menuItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Search", icon: Search, path: "/search" },
    { name: "Add", icon: SquarePlus, action: openModal }, // ✅ Modal Open Hoga
    { name: "Profile", icon: User, action: handleProfileClick },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full bg-base-100 text-base-content flex justify-around py-2 border-t border-base-300 md:hidden z-50">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={index}
              onClick={item.action ? item.action : () => navigate(item.path)}
              className={`flex flex-col items-center text-xs transition-all duration-200 ${
                isActive
                  ? "text-base-content"
                  : "text-base-content/60 hover:text-base-content"
              }`}>
              <item.icon
                size={22}
                className={`transition-all duration-300 ${
                  isActive
                    ? "stroke-base-content fill-base-content"
                    : "stroke-base-content/40 fill-none"
                }`}
              />
              <span className="mt-1">{item.name}</span>
            </button>
          );
        })}

        {/* Logout Button
        <button
          onClick={handleLogout}
          className="flex flex-col items-center text-base-content/60 hover:text-base-content text-xs transition-all duration-200">
          <LogOut size={22} stroke="currentColor" fill="none" />
          <span className="mt-1">Logout</span>
        </button> */}
      </div>

      {/* ✅ Modal will stay open even after refresh */}
      <CreatePost isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
};

export default StatusBar;
