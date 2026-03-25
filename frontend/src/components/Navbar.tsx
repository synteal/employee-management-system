import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  LayoutDashboard,
  UserCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/", icon: <Users className="w-5 h-5 mr-2" /> },
    ...(user?.role === "admin"
      ? [
          {
            name: "Dashboard",
            path: "/dashboard",
            icon: <LayoutDashboard className="w-5 h-5 mr-2" />,
          },
          {
            name: "Mgmt",
            path: "/management",
            icon: <UserCircle className="w-5 h-5 mr-2" />,
          },
        ]
      : []),
  ];

  return (
    <nav className="bg-white shadow-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600 tracking-tight">
                EMS
              </span>
            </div>
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === link.path
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              <span className="font-medium">
                {user?.username || user?.email}
              </span>{" "}
              ({user?.role})
            </div>
            <Link
              to="/logout"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-2 text-base font-medium ${
                  location.pathname === link.path
                    ? "bg-blue-50 border-l-4 border-blue-500 text-blue-700"
                    : "border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            <Link
              to="/logout"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex w-full items-center px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
