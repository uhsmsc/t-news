const BASE_URL = "http://localhost:3001/api";

async function request(path, method = "GET", body) {
  const token = localStorage.getItem("token");

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
  };

  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) throw await res.json();
  return res.json();
}

export const api = {
  login: (data) => request("/auth/login", "POST", data),
  register: (data) => request("/auth/register", "POST", data),
  getUser: (id) => request(`/users/${id}`),
  getUserPosts: (authorId) => request(`/posts?authorId=${authorId}`),
  getFeed: () => request("/posts"),
  getPost: (id) => request(`/posts/${id}`),
  createPost: (data) => request("/posts", "POST", data),
  likePost: (id, userId) => request(`/posts/${id}/like`, "POST", { userId }),
  deletePost: (id, userId) => request(`/posts/${id}?userId=${userId}`, "DELETE"),
  follow: (id, followerId) => request(`/users/${id}/follow`, "POST", { followerId }),
  search: (query, type) => request(`/search?query=${query}&type=${type}`),
  getComments: (postId) => request(`/comments/${postId}`),
  addComment: (data) => request("/comments", "POST", data),
  deleteComment: (id, userId) => request(`/comments/${id}?userId=${userId}`, "DELETE"),
  updateUser: (id, data) => request(`/users/${id}`, "PUT", data),
};
