import { showLogin } from "./auth.js";
import { showFeed } from "./feed.js";
import { showProfile } from "./profile.js";
import { isAuthenticated } from "./authState.js";
import { showRegister } from "./register.js";
import {showSearchPage} from "./showSearchResults.js";

const routes = {
  login: showLogin,
  register: showRegister,
  feed: showFeed,
  profile: showProfile,
  search: showSearchPage,
};

const privatePages = ["profile", "settings"];

function navigate(page, params = {}) {
  history.pushState({ page, params }, "", `#${page}`);
  render(page, params);
}

function render(page = "feed", params = {}) {
  if (!isAuthenticated() && privatePages.includes(page)) {
    return routes.login(params, navigate);
  }

  const fn = routes[page] || showLogin;
  fn(params, navigate);
}

window.addEventListener("DOMContentLoaded", () => {
  let page = window.location.hash.replace("#", "") || "feed";
  history.replaceState({ page }, "", `#${page}`);
  render(page);
});

window.addEventListener("popstate", () => {
  const page = window.location.hash.replace("#", "") || "feed";
  render(page);
});

export { navigate };
