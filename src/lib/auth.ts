const AUTH_KEY = "auth_logged_in";

export function isLoggedIn(): boolean {
  try {
    return localStorage.getItem(AUTH_KEY) === "true";
  } catch {
    return false;
  }
}

export function login(username: string, password: string): boolean {
  // Simple demo: any non-empty credentials succeed
  const DEMO_USER: { username: string; password: string } = {
    username: "admin",
    password: "123456",
  };
  const ok =
    username.trim().length > 0 &&
    password.trim().length > 0 &&
    username === DEMO_USER.username &&
    password === DEMO_USER.password;
  if (ok) {
    localStorage.setItem(AUTH_KEY, "true");
  }
  return ok;
}

export function logout(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {}
}
