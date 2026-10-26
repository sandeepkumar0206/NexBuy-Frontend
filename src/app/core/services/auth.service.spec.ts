import { API_URL, authResponse, seedSession, setupAuthService } from '../../../testing/shared-test-setup';

/** Day 3 | AC: register/login/refresh/logout with persisted session | BR: tokens + user in localStorage, user signal in sync */
describe('AuthService', () => {
  describe('register', () => {
    // CRITICAL
    it('register posts the payload and persists the returned session', async () => {
      // Arrange
      // signed-out service on the HTTP testing backend
      const { auth, http } = setupAuthService();
      const payload = { name: 'Sam', email: 'sam@example.com', password: 'secret1' };

      // Act
      // register and answer with a session
      auth.register(payload).subscribe();
      const req = http.expectOne(`${API_URL}/auth/register`);
      req.flush(authResponse());

      // Assert
      // request shape and persisted state
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      expect(localStorage.getItem('token')).toBe('access-1');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-1');
      expect(auth.user()).toEqual({ userId: 7, name: 'Sam', email: 'sam@example.com', role: 'USER' });
      http.verify();
    });

    // CRITICAL
    it('register leaves the session empty when the server rejects it', async () => {
      // Arrange
      // signed-out service
      const { auth, http } = setupAuthService();
      let status = 0;

      // Act
      // register and answer with a 400
      auth.register({ name: 'Sam', email: 'sam@example.com', password: 'secret1' }).subscribe({
        error: (e) => (status = e.status),
      });
      http.expectOne(`${API_URL}/auth/register`).flush({ message: 'Email is already registered' }, { status: 400, statusText: 'Bad Request' });

      // Assert
      // error surfaced, nothing stored
      expect(status).toBe(400);
      expect(localStorage.getItem('token')).toBeNull();
      expect(auth.user()).toBeNull();
      expect(auth.isLoggedIn()).toBe(false);
    });
  });

  describe('login', () => {
    // CRITICAL
    it('login posts the credentials and persists the returned session', async () => {
      // Arrange
      // signed-out service
      const { auth, http } = setupAuthService();
      const payload = { email: 'sam@example.com', password: 'secret1' };

      // Act
      // login and answer with an admin session
      auth.login(payload).subscribe();
      const req = http.expectOne(`${API_URL}/auth/login`);
      req.flush(authResponse({ role: 'ADMIN' }));

      // Assert
      // request shape and persisted state
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      expect(localStorage.getItem('token')).toBe('access-1');
      expect(auth.user()?.role).toBe('ADMIN');
      expect(JSON.parse(localStorage.getItem('authUser') as string)).toEqual(auth.user());
    });

    // CRITICAL
    it('login leaves the session empty when the credentials are wrong', async () => {
      // Arrange
      // signed-out service
      const { auth, http } = setupAuthService();
      let status = 0;

      // Act
      // login and answer with a 400
      auth.login({ email: 'sam@example.com', password: 'wrong' }).subscribe({ error: (e) => (status = e.status) });
      http.expectOne(`${API_URL}/auth/login`).flush({ message: 'Invalid email or password' }, { status: 400, statusText: 'Bad Request' });

      // Assert
      // still signed out
      expect(status).toBe(400);
      expect(auth.user()).toBeNull();
      expect(localStorage.getItem('authUser')).toBeNull();
      expect(auth.getAccessToken()).toBeNull();
    });
  });

  describe('refresh', () => {
    // CRITICAL
    it('refresh sends the stored refresh token and replaces the stored tokens', async () => {
      // Arrange
      // signed-in service
      seedSession();
      const { auth, http } = setupAuthService(true);

      // Act
      // refresh and answer with rotated tokens
      auth.refresh().subscribe();
      const req = http.expectOne(`${API_URL}/auth/refresh`);
      req.flush(authResponse({ accessToken: 'access-2', refreshToken: 'refresh-2' }));

      // Assert
      // body used the old token; storage holds the new ones
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'refresh-1' });
      expect(localStorage.getItem('token')).toBe('access-2');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-2');
      expect(auth.getAccessToken()).toBe('access-2');
    });

    // CRITICAL
    it('refresh sends a null token when none is stored', async () => {
      // Arrange
      // signed-out service
      const { auth, http } = setupAuthService();

      // Act
      // refresh
      auth.refresh().subscribe({ error: () => undefined });
      const req = http.expectOne(`${API_URL}/auth/refresh`);
      req.flush({ message: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });

      // Assert
      // null in body, no session created
      expect(req.request.body).toEqual({ refreshToken: null });
      expect(auth.user()).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('logout', () => {
    // CRITICAL
    it('logout clears all stored session data and the user signal', async () => {
      // Arrange
      // signed-in service
      seedSession();
      const { auth } = setupAuthService(true);

      // Act
      // logout
      auth.logout();

      // Assert
      // everything gone
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('authUser')).toBeNull();
      expect(auth.user()).toBeNull();
      expect(auth.isLoggedIn()).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    // CRITICAL
    it('getAccessToken returns the stored token', async () => {
      // Arrange
      // signed-in service
      seedSession();
      const { auth } = setupAuthService(true);

      // Act
      // read the token
      const token = auth.getAccessToken();

      // Assert
      // stored value
      expect(token).toBe('access-1');
      expect(token).toBe(localStorage.getItem('token'));
      expect(typeof token).toBe('string');
    });

    // CRITICAL
    it('getAccessToken returns null when signed out', async () => {
      // Arrange
      // signed-out service
      const { auth } = setupAuthService();

      // Act
      // read the token
      const token = auth.getAccessToken();

      // Assert
      // nothing stored
      expect(token).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(auth.user()).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    // CRITICAL
    it('isLoggedIn is true when an access token is stored', async () => {
      // Arrange
      // signed-in service
      seedSession();
      const { auth } = setupAuthService(true);

      // Act
      // check
      const loggedIn = auth.isLoggedIn();

      // Assert
      // true and consistent with the token
      expect(loggedIn).toBe(true);
      expect(auth.getAccessToken()).toBe('access-1');
      expect(auth.user()).not.toBeNull();
    });

    // CRITICAL
    it('isLoggedIn is false when no access token is stored', async () => {
      // Arrange
      // signed-out service
      const { auth } = setupAuthService();

      // Act
      // check
      const loggedIn = auth.isLoggedIn();

      // Assert
      // false and consistent with storage
      expect(loggedIn).toBe(false);
      expect(auth.getAccessToken()).toBeNull();
      expect(localStorage.length).toBe(0);
    });
  });

  describe('hasRole', () => {
    // CRITICAL
    it('hasRole matches the signed-in user\'s role only', async () => {
      // Arrange
      // signed-in regular user
      seedSession('USER');
      const { auth } = setupAuthService(true);

      // Act
      // check both roles
      const isUser = auth.hasRole('USER');
      const isAdmin = auth.hasRole('ADMIN');

      // Assert
      // only USER matches
      expect(isUser).toBe(true);
      expect(isAdmin).toBe(false);
      expect(auth.user()?.role).toBe('USER');
    });

    // CRITICAL
    it('hasRole is false when signed out', async () => {
      // Arrange
      // signed-out service
      const { auth } = setupAuthService();

      // Act
      // check both roles
      const isUser = auth.hasRole('USER');
      const isAdmin = auth.hasRole('ADMIN');

      // Assert
      // neither matches
      expect(isUser).toBe(false);
      expect(isAdmin).toBe(false);
      expect(auth.user()).toBeNull();
    });
  });

  describe('constructor', () => {
    // CRITICAL
    it('the service restores the user from storage on creation', async () => {
      // Arrange
      // stored admin session before the service exists
      seedSession('ADMIN');

      // Act
      // create the service
      const { auth } = setupAuthService(true);

      // Assert
      // signal initialised from storage
      expect(auth.user()).toEqual({ userId: 7, name: 'Sam', email: 'sam@example.com', role: 'ADMIN' });
      expect(auth.hasRole('ADMIN')).toBe(true);
      expect(auth.isLoggedIn()).toBe(true);
    });

    // CRITICAL
    it('the service ignores a corrupt stored user', async () => {
      // Arrange
      // invalid JSON in storage
      localStorage.clear();
      localStorage.setItem('authUser', '{not json');
      localStorage.setItem('token', 'access-1');

      // Act
      // create the service
      const { auth } = setupAuthService(true);

      // Assert
      // no crash and no user, but the token is still readable
      expect(auth.user()).toBeNull();
      expect(auth.hasRole('USER')).toBe(false);
      expect(auth.getAccessToken()).toBe('access-1');
    });
  });
});
