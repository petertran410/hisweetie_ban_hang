"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "../../lib/api";
import type { User } from "../../types/index";

interface DropdownItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  dropdown?: DropdownItem[];
}

const navItems: NavItem[] = [
  {
    label: "Tổng quan",
    href: "/dashboard",
  },
  {
    label: "Hàng hóa",
    dropdown: [
      { label: "Danh sách hàng hóa", href: "/dashboard/products" },
      { label: "Thiết lập giá", href: "/dashboard/pricing" },
      { label: "Chuyển hàng", href: "/dashboard/transfer" },
      { label: "Sản xuất", href: "/dashboard/production" },
      { label: "Kiểm kho", href: "/dashboard/inventory-check" },
      { label: "Xuất hủy", href: "/dashboard/disposal" },
      { label: "Nhà cung cấp", href: "/dashboard/suppliers" },
      { label: "Đặt hàng nhập", href: "/dashboard/order-suppliers" },
      { label: "Nhập hàng", href: "/dashboard/purchase-orders" },
      { label: "Trả hàng nhập", href: "/dashboard/return-order-suppliers" },
    ],
  },
  {
    label: "Đơn hàng",
    dropdown: [
      { label: "Đặt hàng", href: "/dashboard/orders/new" },
      { label: "Hóa đơn", href: "/dashboard/invoices" },
      { label: "Trả hàng", href: "/dashboard/returns" },
      { label: "Đổi tác giao hàng", href: "/dashboard/delivery" },
      { label: "Vận đơn", href: "/dashboard/shipping" },
    ],
  },
  {
    label: "Khách hàng",
    dropdown: [
      { label: "Khách hàng", href: "/dashboard/customers" },
      { label: "Khuyến mãi", href: "/dashboard/promotions" },
      { label: "Voucher", href: "/dashboard/vouchers" },
    ],
  },
  {
    label: "Số quỹ",
    href: "/dashboard/cashflow",
  },
  {
    label: "Bán hàng online",
    href: "/dashboard/online-selling",
  },
];

const branches = ["Kho Hà Nội", "Kho Sài Gòn", "Cửa Hàng"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("Kho Hà Nội");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await authAPI.getProfile();
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem("accessToken");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    if (openDropdown) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openDropdown]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    router.push("/login");
  };

  const toggleDropdown = (dropdownName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold text-blue-600">HiSweetie</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Cửa Hàng Điệp Trà"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            {/* Branch Selector */}
            <div className="relative">
              <button
                onClick={(e) => toggleDropdown("branch", e)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none">
                <span className="text-sm">{selectedBranch}</span>
                <svg
                  className="h-4 w-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openDropdown === "branch" && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    {branches.map((branch) => (
                      <button
                        key={branch}
                        onClick={() => {
                          setSelectedBranch(branch);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none">
                        {branch}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <button className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={(e) => toggleDropdown("user", e)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md focus:outline-none">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <span className="text-sm text-gray-700">{user?.name}</span>
                <svg
                  className="h-4 w-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openDropdown === "user" && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm hover:bg-gray-100">
                      Thông tin cá nhân
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600">
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-blue-600 px-6">
        <div className="flex items-center space-x-8">
          {navItems.map((item) => (
            <div key={item.label} className="relative">
              {item.dropdown ? (
                <button
                  onClick={(e) => toggleDropdown(item.label, e)}
                  className="flex items-center space-x-1 px-4 py-4 text-white hover:bg-blue-700 focus:outline-none">
                  <span>{item.label}</span>
                  <svg
                    className="h-4 w-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              ) : (
                <Link
                  href={item.href || "#"}
                  className="block px-4 py-4 text-white hover:bg-blue-700">
                  {item.label}
                </Link>
              )}

              {item.dropdown && openDropdown === item.label && (
                <div className="absolute left-0 mt-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-2">
                    {item.dropdown.map((dropdownItem) => (
                      <Link
                        key={dropdownItem.href}
                        href={dropdownItem.href}
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        onClick={() => setOpenDropdown(null)}>
                        {dropdownItem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Bán hàng Button */}
          <div className="ml-auto">
            <Link
              href="/dashboard/pos"
              className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 flex items-center space-x-2">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                />
              </svg>
              <span>Bán hàng</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">{children}</main>
    </div>
  );
}
