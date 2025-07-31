export function createUserCard(user) {
  return `
    <div class="user-card">
      <img src="${user.avatarUrl || "../assets/images/default.svg"}" alt="${user.name}" class="user-card__avatar" />
      <div class="user-card__name">${user.name}</div>
    </div>
  `;
}
