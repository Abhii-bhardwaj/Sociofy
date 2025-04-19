import React from "react";

const SidebarItem = ({
  icon: Icon,
  text,
  isActive,
  onClick,
  dropdown,
  isOpen,
  toggleDropdown,
  children,
}) => {
  return (
    <li className="mb-2">
      <div
        className={`flex items-center justify-between p-2 rounded cursor-pointer ${
          isActive ? "bg-primary" : "hover:bg-base-300"
        }`}
        onClick={dropdown ? toggleDropdown : onClick}>
        <div className="flex items-center">
          <Icon className="mr-3 text-xl" />
          <span>{text}</span>
        </div>
        {dropdown && (
          <span
            className="text-xs transition-transform duration-200"
            style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▼
          </span>
        )}
      </div>
      {dropdown && isOpen && (
        <ul className="ml-6 mt-1 space-y-1">{children}</ul>
      )}
    </li>
  );
};

export default SidebarItem;
