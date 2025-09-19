// Navbar.tsx
import { useState } from "react";
import { Brain, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", link: "/" },
    { name: "Upload", link: "/upload" },
    { name: "Documents", link: "/documents" },
    { name: "Schemas", link: "/schemas" },
    { name: "Jobs", link: "/jobs" },
    { name: "Analytics", link: "/analytics" },
    { name: "Settings", link: "/settings" },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain 
              height={30}
              width={30}
            />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              ExtractIQ
            </span>
          </div>

          {/* Middle: Nav Links */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.link}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-white"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-2 bg-white dark:bg-gray-900">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.link}
              className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {item.name}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
