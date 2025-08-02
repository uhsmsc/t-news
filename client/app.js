import { showLogin } from "./pages/auth.js";
import { showFeed } from "./pages/feed.js";
import { showProfile } from "./pages/profile.js";
import { showRegister } from "./pages/register.js";
import { showSearchPage } from "./pages/search.js";

const routes = {
  login: showLogin,
  register: showRegister,
  feed: showFeed,
  profile: showProfile,
  search: showSearchPage,
};

function navigate(page, params = {}) {
  history.pushState({ page, params }, "", `#${page}`);
  render(page, params);
}

function render(page = "feed", params = {}) {
  const fn = routes[page] || showFeed;
  fn(params, navigate);
}

window.addEventListener("DOMContentLoaded", () => {
  const page = window.location.hash.replace("#", "") || "feed";
  history.replaceState({ page }, "", `#${page}`);
  render(page);
});

window.addEventListener("popstate", () => {
  const page = window.location.hash.replace("#", "") || "feed";
  render(page);
});

export { navigate };
