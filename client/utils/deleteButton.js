export function createDeleteButton(onClick) {
  const btn = document.createElement("img");
  btn.src = "/assets/images/container.svg";
  btn.alt = "Удалить";
  btn.classList.add("delete-btn");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!confirm("Удалить?")) return;
    onClick();
  });
  return btn;
}
