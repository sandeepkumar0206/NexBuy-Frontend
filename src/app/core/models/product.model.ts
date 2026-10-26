import { Category } from './category.model';

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountedPrice: number;
  stock: number;
  inStock: boolean;
  description: string | null;
  images: string[];
  category: Category | null;
}

export interface ProductPage {
  content: Product[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name';

export interface ProductQuery {
  page?: number;
  size?: number;
  sort?: ProductSort;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}
