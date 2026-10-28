import { ParamMap, Params } from '@angular/router';
import { ProductSort } from '../../../core/models/product.model';

export const PAGE_SIZES = [12, 24, 48];
export const DEFAULT_SIZE = 12;
export const DEFAULT_SORT: ProductSort = 'newest';

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A to Z' },
];

/** What the list page shows. `page` starts at 1 here, the API starts at 0. */
export interface ListQuery {
  page: number;
  size: number;
  sort: ProductSort;
}

/** Reads the URL and falls back to defaults for anything missing or invalid, so the API never gets bad input. */
export function parseListQuery(params: ParamMap): ListQuery {
  const page = Number.parseInt(params.get('page') ?? '', 10);
  const size = Number.parseInt(params.get('size') ?? '', 10);
  const sort = params.get('sort');
  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    size: PAGE_SIZES.includes(size) ? size : DEFAULT_SIZE,
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? (sort as ProductSort) : DEFAULT_SORT,
  };
}

/** Builds URL params and leaves out values that match the defaults, so the default page has a clean URL. */
export function toQueryParams(query: ListQuery): Params {
  const params: Params = {};
  if (query.page > 1) {
    params['page'] = query.page;
  }
  if (query.size !== DEFAULT_SIZE) {
    params['size'] = query.size;
  }
  if (query.sort !== DEFAULT_SORT) {
    params['sort'] = query.sort;
  }
  return params;
}
