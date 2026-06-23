export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ProductVariant {
  _id?: string;
  size?: string;
  color?: string;
  material?: string;
  barcode?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  weight?: number;
  inventory?: {
    quantity: number;
    trackQuantity: boolean;
  };
}

export interface ProductImage {
  url: string;
  altText: string;
  isPrimary: boolean;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;
  hsnCode?: string;
  brand: string;
  category: Category;
  subCategory?: string;
  basePrice: number;
  comparePrice?: number;
  images: ProductImage[];
  variants: ProductVariant[];
  tags?: string[];
  isFeatured: boolean;
  isActive?: boolean;
  inventory?: {
    quantity: number;
    trackQuantity: boolean;
  };
  ratings?: {
    average: number;
    count: number;
  };
}

export interface PaginatedProducts {
  success: boolean;
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  products: Product[];
}
