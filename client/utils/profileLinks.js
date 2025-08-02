export function attachProfileLinks(container, navigate) {
  container.querySelectorAll("[data-user-id]").forEach((el) => {
    el.style.cursor = "pointer";
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const userId = el.dataset.userId;
      if (userId) {
        navigate("profile", { userId });
      }
    });
  });
}
