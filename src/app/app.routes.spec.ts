import { routes } from './app.routes';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';

/** Unit tests for routes. */
describe('routes', () => {
  it('maps home, login and register to their components', async () => {
    // Arrange
    // route table
    const table = routes;

    // Act
    // index by path
    const byPath = new Map(table.map((r) => [r.path, r]));

    // Assert
    // components
    expect(byPath.get('')?.component).toBe(Home);
    expect(byPath.get('login')?.component).toBe(Login);
    expect(byPath.get('register')?.component).toBe(Register);
    expect(table.length).toBe(4);
  });

  it('unknown paths redirect to the home route', async () => {
    // Arrange
    // route table
    const table = routes;

    // Act
    // find the wildcard
    const wildcard = table.find((r) => r.path === '**');

    // Assert
    // redirect to '' and last in the list
    expect(wildcard).toBeDefined();
    expect(wildcard?.redirectTo).toBe('');
    expect(table[table.length - 1]).toBe(wildcard);
  });
});
