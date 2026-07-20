export interface Category {
  id: string;
  name: string;
  slug: string;
  sort: number | null;
  image: string | null;
}

export interface ProductAttribute {
  id: string;
  product: string;
  label: string;
  value: string;
  group: string | null;
  sort: number | null;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string | null;
  category: string | Category | null;
  price: number | null;
  price_note: string | null;
  short_description: string | null;
  description: string | null;
  image: string | null;
  gallery: string[] | null;
  attributes?: ProductAttribute[];
  status: "published" | "draft" | "archived";
  sort: number | null;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
}

export type LeadSource = "site" | "telegram" | "max";

export interface Lead {
  id?: string;
  name: string;
  phone: string;
  message?: string | null;
  product?: string | null;
  source: LeadSource;
  status?: "new" | "processed";
  date_created?: string;
}

export interface Settings {
  company_name: string;
  phone: string;
  phone_landline: string;
  whatsapp: string;
  email: string;
  address: string;
  work_hours: string;
  telegram_manager_username: string;
  max_manager_link: string;
}

export interface KamsnabSchema {
  categories: Category[];
  products: Product[];
  product_attributes: ProductAttribute[];
  pages: Page[];
  leads: Lead[];
  settings: Settings;
}
