export function getCurrentUser() {
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;
  return JSON.parse(userJson);
}

export function setAuthData(user, token) {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", token);
}

export function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}
