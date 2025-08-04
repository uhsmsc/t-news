const BASE_URL = "http://localhost:3000/api";

async function request(path, method = "GET", body) {
  const token = localStorage.getItem("token");

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw errorData || new Error("Network error");
  }

  const text = await res.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  // Аутентификация
  login: (data) => request("/auth/login", "POST", data),
  register: (data) => request("/users", "POST", data),

  // Пользователи
  getUser: (id) => request(`/users/${id}`),
  updateUser: (id, data) => request(`/users/${id}`, "PATCH", data),

  // Подписки
  followUser: (targetId) => request(`/users/${targetId}/follow`, "POST"),
  unfollowUser: (targetId) => request(`/users/${targetId}/unfollow`, "POST"),
  isFollowing: (targetId) => request(`/users/${targetId}/is-following`),

  // Посты
  getUserPosts: (userId) => request(`/users/${userId}/posts`),
  getFeed: () => request("/posts"),
  getPost: (id) => request(`/posts/${id}`),
  createPost: (data) => request("/posts", "POST", data),
  deletePost: (id) => request(`/posts/${id}`, "DELETE"),
  likePost: (id) => request(`/posts/${id}/like`, "POST"),
  unlikePost: (id) => request(`/posts/${id}/like`, "DELETE"),

  // Комментарии
  getComments: (postId) => request(`/posts/${postId}/comments`),
  addComment: (postId, data) =>
    request(`/posts/${postId}/comments`, "POST", data),
  deleteComment: (commentId, postId) =>
    request(`/comments/${commentId}?postId=${postId}`, "DELETE"),

  // Поиск
  search: (query, type) =>
    request(
      `/search?query=${encodeURIComponent(query)}&type=${encodeURIComponent(
        type
      )}`
    ),
};
