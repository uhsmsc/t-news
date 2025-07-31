import { renderHeader } from "./header.js";
import { showFeed } from "./feed.js";

export async function startApp() {
  const app = document.getElementById("app");
  
  renderHeader(app);

  const main = document.createElement("main");
  app.appendChild(main);

  await showFeed(main);
}

startApp();
