"use client";

import { JSX, useEffect, useState } from "react";
import { productsAPI, categoriesAPI } from "../../../lib/api";
import type { Product, Category } from "../../../types/index";

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "code", label: "Mã hàng", visible: true },
  { key: "name", label: "Tên hàng", visible: true },
  { key: "category", label: "Nhóm hàng", visible: true },
  { key: "variant", label: "Loại hàng", visible: true },
  { key: "retailPrice", label: "Giá bán", visible: true },
  { key: "purchasePrice", label: "Giá vốn", visible: true },
  { key: "stockQuantity", label: "Tồn kho", visible: true },
  { key: "createdAt", label: "Thời gian tạo", visible: false },
  { key: "isActive", label: "Trạng thái", visible: false },
  { key: "isRewardPoint", label: "Tích điểm", visible: false },
];

const STORAGE_KEY = "products_columns_config";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    parentId: undefined as number | undefined,
  });
  const [categoryLoading, setCategoryLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    categoryId: undefined as number | undefined,
    stockFilter: "all",
    warehouse: "all",
    isRewardPoint: undefined as boolean | undefined,
    isActive: undefined as boolean | undefined,
    page: 1,
    limit: 50,
  });

  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const savedColumns = JSON.parse(saved);
          const validKeys = DEFAULT_COLUMNS.map((col) => col.key);
          return DEFAULT_COLUMNS.map((defaultCol) => {
            const savedCol = savedColumns.find(
              (col: ColumnConfig) => col.key === defaultCol.key
            );
            return savedCol
              ? { ...defaultCol, visible: savedCol.visible }
              : defaultCol;
          });
        } catch {
          return DEFAULT_COLUMNS;
        }
      }
    }
    return DEFAULT_COLUMNS;
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
    }
  }, [columns]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.isActive !== undefined) params.isActive = filters.isActive;

      const response = await productsAPI.getAll(params);
      setProducts(response.data.data || []);
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    try {
      setCategoryLoading(true);
      await categoriesAPI.create({
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || undefined,
        parentId: categoryForm.parentId,
      });

      setCategoryForm({ name: "", description: "", parentId: undefined });
      setShowCategoryModal(false);
      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setCategoryLoading(false);
    }
  };

  const getCategoryHierarchy = (categories: Category[]): Category[] => {
    const categoryMap = new Map<number, Category & { children: Category[] }>();

    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    const roots: Category[] = [];
    categories.forEach((cat) => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children.push(category);
      } else {
        roots.push(category);
      }
    });

    return roots;
  };

  const renderCategoryOptions = (
    categories: Category[],
    level = 0
  ): JSX.Element[] => {
    const result: JSX.Element[] = [];

    categories.forEach((cat) => {
      const prefix = "  ".repeat(level);
      result.push(
        <option key={cat.id} value={cat.id}>
          {prefix}
          {cat.name}
        </option>
      );

      if (cat.children && cat.children.length > 0) {
        result.push(...renderCategoryOptions(cat.children, level + 1));
      }
    });

    return result;
  };

  const toggleColumn = (key: string) => {
    setColumns(
      columns.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const visibleColumns = columns.filter((col) => col.visible);

  const renderCellValue = (product: Product, columnKey: string) => {
    switch (columnKey) {
      case "code":
        return product.code;
      case "name":
        return product.name;
      case "category":
        return product.category?.name || "-";
      case "variant":
        return product.variant?.name || "-";
      case "retailPrice":
        return product.retailPrice.toLocaleString("vi-VN") + " ₫";
      case "purchasePrice":
        return product.purchasePrice.toLocaleString("vi-VN") + " ₫";
      case "stockQuantity":
        return product.minStockAlert;
      case "createdAt":
        return new Date(product.createdAt).toLocaleDateString("vi-VN");
      case "isActive":
        return product.isActive ? (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Đang bán
          </span>
        ) : (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            Ngừng bán
          </span>
        );
      default:
        return "-";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  const hierarchicalCategories = getCategoryHierarchy(categories);

  return (
    <div className="flex gap-6 h-full">
      <div className="w-64 shrink-0 space-y-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow p-4 sticky top-6">
          <h3 className="font-semibold text-gray-900 mb-4">Bộ lọc</h3>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Nhóm hàng
              </label>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Tạo mới
              </button>
            </div>
            <select
              value={filters.categoryId || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  categoryId: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Chọn nhóm hàng</option>
              {renderCategoryOptions(hierarchicalCategories)}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tồn kho
            </label>
            <select
              value={filters.stockFilter}
              onChange={(e) =>
                setFilters({ ...filters, stockFilter: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Tất cả</option>
              <option value="in-stock">Còn hàng</option>
              <option value="low-stock">Sắp hết</option>
              <option value="out-of-stock">Hết hàng</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kho hàng
            </label>
            <select
              value={filters.warehouse}
              onChange={(e) =>
                setFilters({ ...filters, warehouse: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Tất cả kho</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dự kiến hết hàng
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="stockExpected"
                  defaultChecked
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Toàn thời gian</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="stockExpected" className="mr-2" />
                <span className="text-sm text-gray-700">Tùy chỉnh</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời gian tạo
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="createdTime"
                  defaultChecked
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Toàn thời gian</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="createdTime" className="mr-2" />
                <span className="text-sm text-gray-700">Tùy chỉnh</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thuộc tính
            </label>
            <input
              type="text"
              placeholder="Ví"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhà cung cấp
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Chọn nhà cung cấp</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thương hiệu
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Chọn thương hiệu</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vị trí
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Chọn vị trí</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại hàng
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Chọn loại hàng</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tích điểm
            </label>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setFilters({ ...filters, isRewardPoint: undefined })
                }
                className={`flex-1 px-3 py-2 text-sm rounded-md ${
                  filters.isRewardPoint === undefined
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                Tất cả
              </button>
              <button
                onClick={() => setFilters({ ...filters, isRewardPoint: true })}
                className={`flex-1 px-3 py-2 text-sm rounded-md ${
                  filters.isRewardPoint === true
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                Có
              </button>
              <button
                onClick={() => setFilters({ ...filters, isRewardPoint: false })}
                className={`flex-1 px-3 py-2 text-sm rounded-md ${
                  filters.isRewardPoint === false
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                Không
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bán trực tiếp
            </label>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm rounded-md bg-blue-600 text-white">
                Tất cả
              </button>
              <button className="flex-1 px-3 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">
                Có
              </button>
              <button className="flex-1 px-3 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">
                Không
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Liên kết kênh bán
            </label>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm rounded-md bg-blue-600 text-white">
                Tất cả
              </button>
              <button className="flex-1 px-3 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">
                Có
              </button>
              <button className="flex-1 px-3 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">
                Không
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái hàng hóa
            </label>
            <select
              value={
                filters.isActive !== undefined
                  ? filters.isActive
                    ? "active"
                    : "inactive"
                  : "all"
              }
              onChange={(e) => {
                const value = e.target.value;
                setFilters({
                  ...filters,
                  isActive: value === "all" ? undefined : value === "active",
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Tất cả</option>
              <option value="active">Hàng đang kinh doanh</option>
              <option value="inactive">Hàng ngừng kinh doanh</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Danh sách hàng hóa
          </h1>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowColumnModal(!showColumnModal)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Tùy chỉnh cột
              </button>
              {showColumnModal && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Hiển thị cột
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {columns.map((col) => (
                      <label key={col.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={col.visible}
                          onChange={() => toggleColumn(col.key)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {col.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Thêm hàng hóa
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-500">Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns.map((col) => (
                      <th
                        key={col.key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      {visibleColumns.map((col) => (
                        <td
                          key={col.key}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderCellValue(product, col.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Tạo nhóm hàng
              </h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory}>
              <div className="mb-4 text-black">
                <label className="block text-sm font-medium text-black mb-2">
                  Tên nhóm
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4 text-black">
                <label className="block text-sm font-medium mb-2">
                  Nhóm cha
                </label>
                <select
                  value={categoryForm.parentId || ""}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      parentId: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Chọn nhóm hàng</option>
                  {renderCategoryOptions(hierarchicalCategories)}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  disabled={categoryLoading || !categoryForm.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {categoryLoading ? "Đang tạo..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
