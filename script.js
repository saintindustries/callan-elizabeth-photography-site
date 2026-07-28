const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");
const contactEmail = "hello@callanelizabethphotography.com";
const albumDialog = document.querySelector("[data-album-dialog]");
const albumClose = document.querySelector("[data-album-close]");
const albumPhotoFrame = document.querySelector(".album-photo-frame");
const albumImage = document.querySelector("[data-album-image]");
const albumKicker = document.querySelector("[data-album-kicker]");
const albumTitle = document.querySelector("[data-album-title]");
const albumDescription = document.querySelector("[data-album-description]");
const albumIndex = document.querySelector("[data-album-index]");
const albumTotal = document.querySelector("[data-album-total]");
const albumControls = document.querySelector("[data-album-controls]");
const albumPrevious = document.querySelector("[data-album-previous]");
const albumNext = document.querySelector("[data-album-next]");
const albumInquiry = document.querySelector("[data-album-inquiry]");
const albumTriggers = document.querySelectorAll("[data-album]");

function buildAlbumImages(directory, total, altLabel) {
  return Array.from({ length: total }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      src: `/assets/galleries/${directory}/${number}.jpg`,
      alt: `${altLabel}, photograph ${index + 1} of ${total}`,
    };
  });
}

const albums = {
  families: {
    kicker: "Family sessions",
    title: "Families",
    description: "The closeness, the movement, and the small in-between moments that make this season unmistakably yours.",
    inquiry: "Inquire about a family session",
    images: buildAlbumImages("families", 34, "A warm, candid family session"),
  },
  couples: {
    kicker: "Couples sessions",
    title: "Couples",
    description: "Honest photographs with room for affection, laughter, and all the quiet ways you already know one another.",
    inquiry: "Inquire about a couples session",
    images: buildAlbumImages("couples", 21, "A natural, affectionate couples session"),
  },
  portraits: {
    kicker: "Portrait sessions",
    title: "Portraits",
    description: "Relaxed, expressive portraits shaped by natural light and the confidence that comes from feeling like yourself.",
    inquiry: "Inquire about a portrait session",
    images: buildAlbumImages("portraits", 25, "An expressive natural-light portrait"),
  },
  pets: {
    kicker: "Pet sessions",
    title: "Pets",
    description: "The familiar expressions and faithful companionship that deserve a permanent place in your family story.",
    inquiry: "Inquire about a pet session",
    images: buildAlbumImages("pets", 15, "A heartfelt pet session"),
  },
};

let activeAlbum = null;
let activeImageIndex = 0;
let lastAlbumTrigger = null;
let swipeStartX = null;
let swipeStartY = null;

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

function formatAlbumNumber(value) {
  return String(value).padStart(2, "0");
}

function renderAlbumImage() {
  if (!activeAlbum) {
    return;
  }

  const image = activeAlbum.images[activeImageIndex];
  albumImage.classList.add("is-changing");
  albumPhotoFrame.style.setProperty("--album-image", `url("${image.src}")`);
  albumImage.src = image.src;
  albumImage.alt = image.alt;
  albumIndex.textContent = formatAlbumNumber(activeImageIndex + 1);
  albumTotal.textContent = formatAlbumNumber(activeAlbum.images.length);
  albumControls.hidden = activeAlbum.images.length < 2;

  if (albumImage.complete) {
    albumImage.classList.remove("is-changing");
  }

  [-1, 1].forEach((offset) => {
    const preloadIndex = (activeImageIndex + offset + activeAlbum.images.length) % activeAlbum.images.length;
    const preloadImage = new Image();
    preloadImage.src = activeAlbum.images[preloadIndex].src;
  });
}

function openAlbum(albumKey, trigger) {
  const selectedAlbum = albums[albumKey];

  if (!selectedAlbum) {
    return;
  }

  activeAlbum = selectedAlbum;
  activeImageIndex = 0;
  lastAlbumTrigger = trigger;
  albumKicker.textContent = selectedAlbum.kicker;
  albumTitle.textContent = selectedAlbum.title;
  albumDescription.textContent = selectedAlbum.description;
  albumInquiry.textContent = selectedAlbum.inquiry;
  renderAlbumImage();

  document.body.classList.add("album-is-open");
  albumDialog.showModal();
  albumClose.focus();
}

function closeAlbum() {
  if (albumDialog.open) {
    albumDialog.close();
  }
}

function stepAlbum(direction) {
  if (!activeAlbum || activeAlbum.images.length < 2) {
    return;
  }

  const totalImages = activeAlbum.images.length;
  activeImageIndex = (activeImageIndex + direction + totalImages) % totalImages;
  renderAlbumImage();
}

albumTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    openAlbum(trigger.dataset.album, trigger);
  });
});

albumImage.addEventListener("load", () => {
  albumImage.classList.remove("is-changing");
});

albumClose.addEventListener("click", closeAlbum);
albumPrevious.addEventListener("click", () => stepAlbum(-1));
albumNext.addEventListener("click", () => stepAlbum(1));

albumPhotoFrame.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  swipeStartX = touch.clientX;
  swipeStartY = touch.clientY;
}, { passive: true });

albumPhotoFrame.addEventListener("touchend", (event) => {
  if (swipeStartX === null || swipeStartY === null) {
    return;
  }

  const touch = event.changedTouches[0];
  const horizontalDistance = touch.clientX - swipeStartX;
  const verticalDistance = touch.clientY - swipeStartY;
  swipeStartX = null;
  swipeStartY = null;

  if (Math.abs(horizontalDistance) > 48 && Math.abs(horizontalDistance) > Math.abs(verticalDistance)) {
    stepAlbum(horizontalDistance > 0 ? -1 : 1);
  }
}, { passive: true });

albumInquiry.addEventListener("click", (event) => {
  event.preventDefault();
  lastAlbumTrigger = null;
  closeAlbum();
  window.location.hash = "contact";
  document.querySelector("#contact")?.scrollIntoView();
});

albumDialog.addEventListener("click", (event) => {
  if (event.target === albumDialog) {
    closeAlbum();
  }
});

albumDialog.addEventListener("close", () => {
  document.body.classList.remove("album-is-open");
  activeAlbum = null;
  activeImageIndex = 0;

  if (lastAlbumTrigger) {
    lastAlbumTrigger.focus();
  }
});

document.addEventListener("keydown", (event) => {
  if (!albumDialog.open) {
    return;
  }

  if (event.key === "ArrowLeft") {
    stepAlbum(-1);
  }

  if (event.key === "ArrowRight") {
    stepAlbum(1);
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
