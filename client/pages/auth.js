import { api } from "../services/api.js";
import { renderHeader } from "../components/header.js";

export function showLogin(_, navigate) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  renderHeader({ minimal: true });

  const main = document.createElement("main");
  main.className = "main";
  main.innerHTML = `
    <div class="container">
      <div class="login-form">
        <h3 class="login-form__title">Вход</h3>
        <form class="login-form__fields" id="loginForm">
          <input type="text" id="username" class="input input--large" placeholder="Логин" required autocomplete="username" />
          <input type="password" id="password" class="input input--large" placeholder="Пароль" required autocomplete="current-password" />
        </form>
        <div class="login-form__actions">
          <button id="registerBtn" class="button" type="button">Зарегистрироваться</button>
          <button id="loginBtn" class="button button--accent" type="submit" form="loginForm">Войти</button>
        </div>
        <div class="form-error" id="loginError"></div>
      </div>
    </div>
  `;

  app.appendChild(main);

  const errorEl = document.getElementById("loginError");

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.add("form-error--visible");
  }

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const { token, user } = await api.login({ username, password });
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("feed");
    } catch (err) {
      showError(err.error || "Ошибка входа");
    }
  });

  document.getElementById("registerBtn").addEventListener("click", () => {
    navigate("register");
  });
}
