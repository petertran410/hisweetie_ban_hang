"use client";

import { useEffect, useState } from "react";
import { dashboardAPI } from "../../lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardAPI.getStats();
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="text-2xl font-semibold text-gray-900">
                  {stats?.currentMonthRevenue?.toLocaleString("vi-VN")} ₫
                </div>
                <div className="text-sm text-gray-500">Doanh thu tháng này</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="text-2xl font-semibold text-gray-900">
                  {stats?.currentMonthOrders}
                </div>
                <div className="text-sm text-gray-500">Đơn hàng tháng này</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="text-2xl font-semibold text-gray-900">
                  {stats?.totalCustomerDebt?.toLocaleString("vi-VN")} ₫
                </div>
                <div className="text-sm text-gray-500">Công nợ khách hàng</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="text-2xl font-semibold text-gray-900">
                  {stats?.lowStockProducts}
                </div>
                <div className="text-sm text-gray-500">Sản phẩm sắp hết</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
