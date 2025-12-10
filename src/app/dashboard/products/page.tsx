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
  { key: "minStockAlert", label: "Tồn kho tối thiểu", visible: true },
  { key: "createdAt", label: "Thời gian tạo", visible: false },
  { key: "updatedAt", label: "Thời gian cập nhật", visible: false },
  { key: "isActive", label: "Trạng thái", visible: false },
  { key: "isRewardPoint", label: "Tích điểm", visible: false },
];

const STORAGE_KEY = "products_columns_config";

const STOCK_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "below-min", label: "Dưới định mức tồn" },
  { value: "above-max", label: "Vượt định mức tồn" },
  { value: "in-stock", label: "Còn hàng trong kho" },
  { value: "out-of-stock", label: "Hết hàng trong kho" },
];

const LIMIT_OPTIONS = [15, 20, 30, 50, 100];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const [showLimitDropdown, setShowLimitDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
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
    limit: 15,
  });

  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const savedColumns = JSON.parse(saved);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !target.closest(".category-dropdown") &&
        !target.closest(".stock-dropdown") &&
        !target.closest(".limit-dropdown")
      ) {
        setShowCategoryDropdown(false);
        setShowStockDropdown(false);
        setShowLimitDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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
      setTotal(response.data.total || 0);
    } catch (error) {
      setProducts([]);
      setTotal(0);
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

      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || undefined,
          parentId: categoryForm.parentId,
        });
      } else {
        await categoriesAPI.create({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || undefined,
          parentId: categoryForm.parentId,
        });
      }

      setCategoryForm({ name: "", description: "", parentId: undefined });
      setEditingCategory(null);
      setShowCategoryModal(false);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId || undefined,
    });
    setShowCategoryModal(true);
  };

  const handleCreateNew = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", description: "", parentId: undefined });
    setShowCategoryModal(true);
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

  const toggleCategoryExpand = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleCategorySelect = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategories(categories.map((cat) => cat.id));
  };

  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  const applyCategoryFilter = () => {
    setFilters({
      ...filters,
      categoryId:
        selectedCategories.length > 0 ? selectedCategories[0] : undefined,
      page: 1,
    });
    setShowCategoryDropdown(false);
  };

  const getFilteredCategories = (categories: Category[]): Category[] => {
    if (!categorySearch) return categories;

    const filterRecursive = (cats: Category[]): Category[] => {
      return cats
        .filter((cat) => {
          const nameMatch = cat.name
            .toLowerCase()
            .includes(categorySearch.toLowerCase());
          const hasMatchingChildren =
            cat.children && filterRecursive(cat.children).length > 0;

          if (nameMatch || hasMatchingChildren) {
            return {
              ...cat,
              children: cat.children ? filterRecursive(cat.children) : [],
            };
          }
          return false;
        })
        .map((cat) => ({
          ...cat,
          children: cat.children ? filterRecursive(cat.children) : [],
        }));
    };

    return filterRecursive(categories);
  };

  const renderCategoryTree = (categories: Category[], level = 0) => {
    const categoriesToRender =
      level === 0 ? getFilteredCategories(hierarchicalCategories) : categories;

    return categoriesToRender.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.includes(category.id);
      const isSelected = selectedCategories.includes(category.id);

      return (
        <div key={category.id}>
          <div className="flex items-center py-1 hover:bg-gray-50 group">
            <div
              className="flex items-center flex-1"
              style={{ paddingLeft: `${level * 16}px` }}>
              <div className="w-4 h-4 flex items-center justify-center mr-1">
                {hasChildren ? (
                  <button
                    onClick={() => toggleCategoryExpand(category.id)}
                    className="text-gray-400 hover:text-gray-600">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={isExpanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"}
                      />
                    </svg>
                  </button>
                ) : (
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                )}
              </div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCategorySelect(category.id)}
                className="w-4 h-4 mr-2"
              />
              <span className="text-sm text-gray-700">{category.name}</span>
            </div>
            <button
              onClick={() => handleEditCategory(category)}
              className="opacity-0 group-hover:opacity-100 mr-2 p-1 text-gray-400 hover:text-gray-600 transition-opacity">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderCategoryTree(category.children || [], level + 1)}</div>
          )}
        </div>
      );
    });
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
        return Number(product.retailPrice).toLocaleString("en-US") + " ₫";
      case "purchasePrice":
        return Number(product.purchasePrice).toLocaleString("en-US") + " ₫";

      case "stockQuantity":
        return product.stockQuantity;
      case "minStockAlert":
        return product.minStockAlert;
      case "createdAt":
        return new Date(product.createdAt).toLocaleDateString("vi-VN");
      case "updatedAt":
        return new Date(product.updatedAt).toLocaleDateString("vi-VN");
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

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(total / filters.limit);
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters({ ...filters, page: newPage });
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters({ ...filters, limit: newLimit, page: 1 });
    setShowLimitDropdown(false);
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
  const selectedStockOption = STOCK_OPTIONS.find(
    (option) => option.value === filters.stockFilter
  );

  const totalPages = Math.ceil(total / filters.limit);
  const startIndex = (filters.page - 1) * filters.limit + 1;
  const endIndex = Math.min(filters.page * filters.limit, total);

  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)] overflow-hidden">
      <div className="w-64 shrink-0 overflow-y-auto pr-2">
        <div className="bg-white rounded-lg shadow p-2">
          <h3 className="font-semibold text-gray-900 mb-4">Bộ lọc</h3>

          <div className="mb-4 relative">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Nhóm hàng
              </label>
              <button
                onClick={handleCreateNew}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                + Tạo mới
              </button>
            </div>
            <div className="category-dropdown relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left bg-white hover:bg-gray-50 flex items-center justify-between">
                <span className="text-gray-500">Chọn nhóm hàng</span>
                <svg
                  className="w-4 h-4"
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

              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-hidden">
                  <div className="flex">
                    <div className="w-full p-3 border-b border-gray-200">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Tìm kiếm"
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        />
                        <svg
                          className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400"
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
                  </div>

                  <div className="max-h-40 overflow-y-auto p-2">
                    {renderCategoryTree(hierarchicalCategories)}
                  </div>

                  <div className="p-3 border-t border-gray-200 flex items-center justify-between">
                    <button
                      onClick={clearAllCategories}
                      className="text-sm text-blue-600 hover:text-blue-800">
                      Chọn tất cả
                    </button>
                    <button
                      onClick={applyCategoryFilter}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                      Áp dụng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tồn kho
            </label>
            <div className="stock-dropdown relative">
              <button
                onClick={() => setShowStockDropdown(!showStockDropdown)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left bg-white hover:bg-gray-50 flex items-center justify-between">
                <span>{selectedStockOption?.label}</span>
                <svg
                  className="w-4 h-4"
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

              {showStockDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {STOCK_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilters({ ...filters, stockFilter: option.value });
                        setShowStockDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                        filters.stockFilter === option.value
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700"
                      }`}>
                      <span>{option.label}</span>
                      {filters.stockFilter === option.value && (
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
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

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
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
          <div className="bg-white shadow rounded-lg flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
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

            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-black">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Hiển thị</span>
                <div className="limit-dropdown relative">
                  <button
                    onClick={() => setShowLimitDropdown(!showLimitDropdown)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 flex items-center gap-1">
                    <span>{filters.limit} dòng</span>
                    <svg
                      className="w-3 h-3"
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

                  {showLimitDropdown && (
                    <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      {LIMIT_OPTIONS.map((limit) => (
                        <button
                          key={limit}
                          onClick={() => handleLimitChange(limit)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                            filters.limit === limit
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700"
                          }`}>
                          <span>{limit} dòng</span>
                          {filters.limit === limit && (
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  {startIndex} - {endIndex} trong {total} hàng hóa
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={filters.page === 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={filters.page}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value)) {
                        handlePageChange(value);
                      }
                    }}
                    className="w-12 px-2 py-1 text-center border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={filters.page === totalPages}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-lg p-6 w-96 max-w-90vw shadow-xl border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCategory ? "Chỉnh sửa nhóm hàng" : "Tạo nhóm hàng"}
              </h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory}>
              <div className="mb-4 text-black">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên nhóm
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>

              <div className="mb-4 text-black">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  {renderCategoryOptions(
                    hierarchicalCategories.filter(
                      (cat) => cat.id !== editingCategory?.id
                    )
                  )}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  disabled={categoryLoading || !categoryForm.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {categoryLoading ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
