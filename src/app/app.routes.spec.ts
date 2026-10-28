import { routes } from './app.routes';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { PRODUCT_ROUTES } from './features/products/products.routes';
import { ProductList } from './features/products/product-list/product-list';

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
    expect(table.length).toBe(5);
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
