import { routes } from './app.routes';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { PRODUCT_ROUTES } from './features/products/products.routes';
import { ProductList } from './features/products/product-list/product-list';
import { ProductDetail } from './features/products/product-detail/product-detail';
import { CATEGORY_ROUTES } from './features/categories/categories.routes';
import { CategoryProducts } from './features/categories/category-products/category-products';

/** Unit tests for routes. */
describe('routes', () => {
  it('maps home, login and register to their components', async () => {
    // Arrange
    const table = routes;

    // Act
    const byPath = new Map(table.map((r) => [r.path, r]));

    // Assert
    expect(byPath.get('')?.component).toBe(Home);
    expect(byPath.get('login')?.component).toBe(Login);
    expect(byPath.get('register')?.component).toBe(Register);
    expect(table.length).toBe(6);
  });

  it('loads the category routes on demand and opens the category page at /categories/:slug', async () => {
    // Arrange
    const categories = routes.find((r) => r.path === 'categories');

    // Act
    const loaded = await categories?.loadChildren?.();
    const slugRoute = CATEGORY_ROUTES.find((r) => r.path === ':slug');
    const component = await (slugRoute?.loadComponent as () => Promise<unknown>)();

    // Assert
    expect(categories?.component).toBeUndefined();
    expect(loaded).toBe(CATEGORY_ROUTES);
    expect(component).toBe(CategoryProducts);
  });

  it('loads the products routes on demand', async () => {
    // Arrange
    const products = routes.find((r) => r.path === 'products');

    // Act
    const loaded = await products?.loadChildren?.();

    // Assert
    expect(products?.component).toBeUndefined();
    expect(loaded).toBe(PRODUCT_ROUTES);
  });

  it('opens the product list at /products', async () => {
    // Arrange
    const listRoute = PRODUCT_ROUTES.find((r) => r.path === '');

    // Act
    const component = await (listRoute?.loadComponent as () => Promise<unknown>)();

    // Assert
    expect(component).toBe(ProductList);
  });

  it('opens the product detail at /products/:slug', async () => {
    // Arrange
    const detailRoute = PRODUCT_ROUTES.find((r) => r.path === ':slug');

    // Act
    const component = await (detailRoute?.loadComponent as () => Promise<unknown>)();

    // Assert
    expect(component).toBe(ProductDetail);
  });

  it('unknown paths redirect to the home route', async () => {
    // Arrange
    const table = routes;

    // Act
    const wildcard = table.find((r) => r.path === '**');

    // Assert
    expect(wildcard).toBeDefined();
    expect(wildcard?.redirectTo).toBe('');
    expect(table[table.length - 1]).toBe(wildcard);
  });
});
