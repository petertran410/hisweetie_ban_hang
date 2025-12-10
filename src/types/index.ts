export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  roleId?: number;
  role?: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  resource: string;
  action: string;
  description?: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  slug: string;
  categoryId?: number;
  category?: Category;
  variantId?: number;
  variant?: ProductVariant;
  purchasePrice: number;
  retailPrice: number;
  collaboratorPrice: number;
  stockQuantity: number;
  minStockAlert: number;
  image?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  parent?: Category;
  children?: Category[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customerTypeId?: number;
  customerType?: CustomerType;
  totalPurchased: number;
  totalDebt: number;
  isWalkIn: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerType {
  id: number;
  name: string;
  description?: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchased: number;
  totalDebt: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  code: string;
  customerId: number;
  customer?: Customer;
  orderDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  grandTotal: number;
  paidAmount: number;
  debtAmount: number;
  orderStatus: "pending" | "processing" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "partial" | "paid";
  note?: string;
  items?: OrderItem[];
  payments?: OrderPayment[];
  creatorId: number;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  total: number;
}

export interface OrderPayment {
  id: number;
  orderId: number;
  order?: Order;
  amount: number;
  paymentDate: string;
  paymentMethod: "cash" | "bank_transfer" | "card" | "e_wallet" | "other";
  note?: string;
  createdById: number;
  createdBy?: User;
  createdAt: string;
}

export interface PurchaseOrder {
  id: number;
  code: string;
  supplierId: number;
  supplier?: Supplier;
  purchaseDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  grandTotal: number;
  paidAmount: number;
  debtAmount: number;
  paymentStatus: "unpaid" | "partial" | "paid";
  note?: string;
  items?: PurchaseOrderItem[];
  creatorId: number;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  productId: number;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  total: number;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  status: "draft" | "published";
  publishedAt?: string;
  authorId: number;
  author?: User;
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
}
