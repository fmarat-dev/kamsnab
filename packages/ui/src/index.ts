export { Button } from "./components/Button";
export type { ButtonProps } from "./components/Button";

export { ProductCard } from "./components/ProductCard";
export type { ProductCardData, ProductCardProps } from "./components/ProductCard";

export { CategoryFilters } from "./components/CategoryFilters";
export type { CategoryOption, CategoryFiltersProps } from "./components/CategoryFilters";

export { LeadForm } from "./components/LeadForm";
export type { LeadFormValues, LeadFormProps } from "./components/LeadForm";

export { Header } from "./components/Header";
export type { HeaderProps } from "./components/Header";

export { Footer } from "./components/Footer";
export type { FooterProps } from "./components/Footer";

export { Container } from "./components/Container";

export {
  COMPARE_LIMIT,
  useCompareSlugs,
  toggleCompareSlug,
  removeCompareSlug,
  clearCompareSlugs
} from "./lib/compare";

export {
  useFavoriteSlugs,
  toggleFavoriteSlug,
  removeFavoriteSlug,
  clearFavoriteSlugs
} from "./lib/favorites";

export { Breadcrumbs } from "./components/Breadcrumbs";
export type { BreadcrumbItem, BreadcrumbsProps } from "./components/Breadcrumbs";
