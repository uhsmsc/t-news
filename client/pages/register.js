import { api } from "../services/api.js";
import { renderHeader } from "../components/header.js";

export function showRegister(_, navigate) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  renderHeader({ minimal: true });

  const main = document.createElement("main");
  main.className = "main";
  main.innerHTML = `
    <div class="container">
      <div class="login-form">
        <h3 class="login-form__title">Регистрация</h3>
        <form class="login-form__fields" id="registerForm">
          <input type="text" id="username" class="input input--large" placeholder="Логин" required autocomplete="username" />
          <input type="password" id="password" class="input input--large" placeholder="Пароль" required autocomplete="new-password" />
          <input type="password" id="passwordRepeat" class="input input--large" placeholder="Повторите пароль" required autocomplete="new-password" />
        </form>
        <div class="login-form__actions">
          <button id="loginBtn" class="button" type="button">Войти</button>
          <button id="registerBtn" class="button button--accent" type="submit" form="registerForm">Зарегистрироваться</button>
        </div>
        <div class="form-error" id="registerError"></div>
      </div>
    </div>
  `;

  app.appendChild(main);

  const errorEl = document.getElementById("registerError");

  const errorMessagesMap = {
    "User already exists": "Пользователь с таким логином уже существует",
    "Password must be at least 4 characters":
      "Пароль должен содержать минимум 4 символов",
    "Username must be a string with at least 3 characters":
      "Логин должен содержать минимум 3 символа",
  };

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.add("form-error--visible");
  }

  function mapErrorMessage(serverMessage) {
    return (
      errorMessagesMap[serverMessage] ||
      "Ошибка регистрации. Проверьте введённые данные."
    );
  }

  document
    .getElementById("registerForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      const passwordRepeat = document
        .getElementById("passwordRepeat")
        .value.trim();

      if (!username || !password) {
        showError("Заполните все поля");
        return;
      }

      if (password !== passwordRepeat) {
        showError("Пароли не совпадают");
        return;
      }

      try {
        await api.register({ username, password });
        navigate("login");
      } catch (err) {
        const serverMessage = err?.error || err?.message || "";
        showError(mapErrorMessage(serverMessage));
      }
    });

  document.getElementById("loginBtn").addEventListener("click", () => {
    navigate("login");
  });
}
