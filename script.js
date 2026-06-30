const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");
const contactEmail = "hello@callanelizabethphotography.com";

function syncHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
}

window.addEventListener("scroll", syncHeader, { passive: true });
syncHeader();

menuToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

nav.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    header.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const sessionType = String(data.get("sessionType") || "").trim();
  const message = String(data.get("message") || "").trim();
  const subject = `Photography inquiry from ${name || "a new client"}`;
  const body = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Session type: ${sessionType}`,
    "",
    "Message:",
    message || "I would love to learn more about booking a session.",
  ].join("\n");

  formNote.textContent = "Your email draft is opening now. If it does not open, email hello@callanelizabethphotography.com directly.";
  formNote.setAttribute("role", "status");
  window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
