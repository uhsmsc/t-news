export function generateId(length: number = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let userId = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    userId += chars[randomIndex];
  }

  return userId;
}
