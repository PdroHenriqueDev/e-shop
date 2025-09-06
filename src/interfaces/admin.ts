/**
 * Admin-specific interfaces for the e-commerce application
 */

/**
 * Admin user interface
 * Represents user data in the admin user management system
 */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Admin user form data interface
 */
export interface AdminUserFormData {
  name: string;
  email: string;
  role: string;
}

/**
 * Admin order item interface
 */
export interface AdminOrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image: string;
  };
}

/**
 * Admin order interface
 * Represents order data in the admin order management system
 */
export interface AdminOrder {
  id: string;
  userId: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
  };
  items: AdminOrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

/**
 * Admin product interface
 * Represents product data in the admin product management system
 */
export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  };
}

/**
 * Admin category interface
 */
export interface AdminCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Admin dashboard statistics interface
 * Contains key metrics displayed on the admin dashboard overview
 */
export interface AdminDashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

/**
 * Recent order interface for admin dashboard
 * Represents order data shown in the recent orders table
 */
export interface AdminRecentOrder {
  id: string;
  user: {
    name: string;
  };
  total: number;
  status: string;
  createdAt: string;
}

/**
 * Admin layout props interface
 */
export interface AdminLayoutProps {
  children: React.ReactNode;
}
