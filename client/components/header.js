import { getCurrentUser, logout } from "../services/authState.js";
import { navigate } from "../app.js";

export function renderHeader({
  auth = false,
  minimal = false,
  onSearch = null,
} = {}) {
  const user = getCurrentUser();
  const app = document.getElementById("app");

  const existingHeader = app.querySelector("header.header--public");
  if (existingHeader) {
    existingHeader.remove();
  }

  const header = document.createElement("header");
  header.className = "header header--public";

  const logoHTML = minimal
    ? `
      <div class="header__left">
        <img src="../assets/images/t-bank.svg" alt="t-bank" class="header__logo" />
      </div>
    `
    : `
      <div class="header__left">
        <img src="../assets/images/t-bank.svg" alt="t-bank" class="header__logo" />
        <input
          type="search"
          class="header__search input input--medium"
          placeholder="Поиск по T-News"
          id="headerSearchInput"
          autocomplete="off"
        />
      </div>
    `;

  let rightHTML = "";

  if (minimal) {
    rightHTML = "";
  } else if (auth && user) {
    rightHTML = `
    <div class="header__right">
      <button id="logoutBtn" class="header__button header__button--logout">
        Выйти
        <img src="../assets/images/login.svg" alt="" class="header__icon" />
      </button>
      <a href="#profile" class="header__icon-button header__icon-button--desktop">
        <img src="../assets/images/default.svg" alt="Профиль" />
      </a>
      <div class="header__burger header__burger--mobile" id="burgerContainer">
        <img src="../assets/images/default.svg" alt="Меню" id="burgerIcon" />
        <div class="header__burger-menu" id="burgerMenu">
          <a href="#profile" class="burger-menu__item">Профиль</a>
          <button id="burgerLogout" class="burger-menu__item">Выйти</button>
        </div>
      </div>
    </div>
  `;
  } else {
    rightHTML = `
      <div class="header__right">
        <a href="#register" class="header__button header__button--register">
          Зарегистрироваться
          <img src="../assets/images/login.svg" alt="" class="header__icon" />
        </a>
        <a href="#login" class="header__button header__button--login">
          Войти
          <img src="../assets/images/login.svg" alt="" class="header__icon" />
        </a>
        <a href="#login" class="header__icon-button">
          <img src="../assets/images/login.svg" alt="Вход" />
        </a>
      </div>
    `;
  }

  header.innerHTML = `
    <div class="container container--bordered">
      ${logoHTML}
      ${rightHTML}
    </div>
  `;

  const searchInput = header.querySelector("#headerSearchInput");
  if (searchInput && typeof onSearch === "function") {
    let debounceTimeout = null;
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();

      if (debounceTimeout) clearTimeout(debounceTimeout);

      debounceTimeout = setTimeout(() => {
        onSearch(query);
      }, 300);
    });
  }

  app.prepend(header);

  const logoutBtn = header.querySelector("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
      navigate("feed");
    });
  }

  const logo = header.querySelector(".header__logo");
  if (logo) {
    logo.style.cursor = "pointer";
    logo.addEventListener("click", () => {
      navigate("feed");
    });
  }

  const burgerIcon = header.querySelector("#burgerIcon");
  const burgerMenu = header.querySelector("#burgerMenu");
  const burgerContainer = header.querySelector("#burgerContainer");

  if (burgerIcon && burgerMenu && burgerContainer) {
    burgerIcon.addEventListener("click", () => {
      burgerMenu.classList.toggle("header__burger-menu--open");
    });

    document.addEventListener("click", (event) => {
      if (
        !burgerContainer.contains(event.target) &&
        burgerMenu.classList.contains("header__burger-menu--open")
      ) {
        burgerMenu.classList.remove("header__burger-menu--open");
      }
    });
  }

  const burgerLogout = header.querySelector("#burgerLogout");
  if (burgerLogout) {
    burgerLogout.addEventListener("click", () => {
      logout();
      navigate("feed");
    });
  }

  return searchInput;
}
