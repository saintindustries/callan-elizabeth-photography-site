const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");
const formButton = form.querySelector(".form-button");
const contactEndpoint = "https://formsubmit.co/ajax/Callan.sovik@gmail.com";
const contactEmail = "Callan.sovik@gmail.com";
const albumDialog = document.querySelector("[data-album-dialog]");
const albumClose = document.querySelector("[data-album-close]");
const albumBrowser = document.querySelector("[data-album-browser]");
const albumScroll = document.querySelector("[data-album-scroll]");
const albumMosaic = document.querySelector("[data-album-mosaic]");
const albumPhotoFrame = document.querySelector(".album-photo-frame");
const albumImage = document.querySelector("[data-album-image]");
const albumKicker = document.querySelector("[data-album-kicker]");
const albumTitle = document.querySelector("[data-album-title]");
const albumDescription = document.querySelector("[data-album-description]");
const albumCount = document.querySelector("[data-album-count]");
const photoViewer = document.querySelector("[data-photo-viewer]");
const photoBack = document.querySelector("[data-photo-back]");
const photoKicker = document.querySelector("[data-photo-kicker]");
const photoTitle = document.querySelector("[data-photo-title]");
const photoDescription = document.querySelector("[data-photo-description]");
const albumIndex = document.querySelector("[data-album-index]");
const albumTotal = document.querySelector("[data-album-total]");
const albumControls = document.querySelector("[data-album-controls]");
const albumPrevious = document.querySelector("[data-album-previous]");
const albumNext = document.querySelector("[data-album-next]");
const albumInquiryLinks = document.querySelectorAll("[data-album-inquiry]");
const albumTriggers = document.querySelectorAll("[data-album]");

function buildAlbumImages(directory, total, altLabel, descriptions = []) {
  return Array.from({ length: total }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      src: `/assets/galleries/${directory}/${number}.jpg`,
      alt: `${altLabel}, photograph ${index + 1} of ${total}`,
      description: descriptions[index] || "",
    };
  });
}

const imageDescriptions = {
  families: [],
  couples: [],
  portraits: [],
  pets: [],
};

const albums = {
  families: {
    kicker: "Family sessions",
    title: "Families",
    description: "The closeness, the movement, and the small in-between moments that make this season unmistakably yours.",
    inquiry: "Inquire about a family session",
    images: buildAlbumImages("families", 34, "A warm, candid family session", imageDescriptions.families),
  },
  couples: {
    kicker: "Couples sessions",
    title: "Couples",
    description: "Honest photographs with room for affection, laughter, and all the quiet ways you already know one another.",
    inquiry: "Inquire about a couples session",
    images: buildAlbumImages("couples", 21, "A natural, affectionate couples session", imageDescriptions.couples),
  },
  portraits: {
    kicker: "Portrait sessions",
    title: "Portraits",
    description: "Relaxed, expressive portraits shaped by natural light and the confidence that comes from feeling like yourself.",
    inquiry: "Inquire about a portrait session",
    images: buildAlbumImages("portraits", 25, "An expressive natural-light portrait", imageDescriptions.portraits),
  },
  pets: {
    kicker: "Pet sessions",
    title: "Pets",
    description: "The familiar expressions and faithful companionship that deserve a permanent place in your family story.",
    inquiry: "Inquire about a pet session",
    images: buildAlbumImages("pets", 15, "A heartfelt pet session", imageDescriptions.pets),
  },
};

let activeAlbum = null;
let activeImageIndex = 0;
let lastAlbumTrigger = null;
let lastAlbumTile = null;
let albumScrollPosition = 0;
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

function sizeAlbumTile(tile, image) {
  if (!image.naturalWidth || !image.naturalHeight) {
    return;
  }

  const mosaicStyles = window.getComputedStyle(albumMosaic);
  const rowHeight = Number.parseFloat(mosaicStyles.gridAutoRows);
  const rowGap = Number.parseFloat(mosaicStyles.rowGap);
  const renderedHeight = tile.clientWidth * (image.naturalHeight / image.naturalWidth);
  const rowSpan = Math.ceil((renderedHeight + rowGap) / (rowHeight + rowGap));

  tile.style.gridRowEnd = `span ${rowSpan}`;
  tile.classList.add("is-laid-out");
}

function layoutAlbumMosaic() {
  albumMosaic.querySelectorAll(".album-tile").forEach((tile) => {
    const image = tile.querySelector("img");

    if (image?.complete) {
      sizeAlbumTile(tile, image);
    }
  });
}

function renderAlbumMosaic() {
  if (!activeAlbum) {
    return;
  }

  const fragment = document.createDocumentFragment();
  albumMosaic.replaceChildren();

  activeAlbum.images.forEach((image, index) => {
    const tile = document.createElement("button");
    const tileImage = document.createElement("img");
    const tileLabel = document.createElement("span");
    const tileNumber = formatAlbumNumber(index + 1);

    tile.className = "album-tile";
    tile.type = "button";
    tile.dataset.imageIndex = String(index);
    tile.setAttribute("aria-label", `Open photograph ${index + 1} of ${activeAlbum.images.length}`);
    tile.style.setProperty("--tile-index", String(index));

    tileImage.src = image.src;
    tileImage.alt = image.alt;
    tileImage.loading = index < 6 ? "eager" : "lazy";
    tileImage.decoding = "async";
    tileImage.addEventListener("load", () => sizeAlbumTile(tile, tileImage));

    tileLabel.className = "album-tile-label";
    tileLabel.innerHTML = `<span>${tileNumber}</span><span>View photograph</span>`;

    tile.append(tileImage, tileLabel);
    fragment.append(tile);
  });

  albumMosaic.append(fragment);
  requestAnimationFrame(layoutAlbumMosaic);
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
  photoKicker.textContent = activeAlbum.kicker;
  photoTitle.textContent = `Photograph ${formatAlbumNumber(activeImageIndex + 1)}`;
  photoDescription.textContent = image.description || activeAlbum.description;
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

function openPhoto(imageIndex, tile) {
  if (!activeAlbum) {
    return;
  }

  activeImageIndex = imageIndex;
  lastAlbumTile = tile;
  albumScrollPosition = albumScroll.scrollTop;
  renderAlbumImage();
  albumBrowser.hidden = true;
  photoViewer.hidden = false;
  photoBack.focus();
}

function closePhoto() {
  if (photoViewer.hidden) {
    return;
  }

  photoViewer.hidden = true;
  albumBrowser.hidden = false;

  requestAnimationFrame(() => {
    albumScroll.scrollTop = albumScrollPosition;
    lastAlbumTile?.focus({ preventScroll: true });
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
  lastAlbumTile = null;
  albumScrollPosition = 0;
  albumKicker.textContent = selectedAlbum.kicker;
  albumTitle.textContent = selectedAlbum.title;
  albumDescription.textContent = selectedAlbum.description;
  albumCount.textContent = `${selectedAlbum.images.length} photographs`;
  albumInquiryLinks.forEach((link) => {
    link.textContent = selectedAlbum.inquiry;
  });
  albumScroll.setAttribute("aria-label", `${selectedAlbum.title} album photographs`);
  renderAlbumMosaic();
  photoViewer.hidden = true;
  albumBrowser.hidden = false;

  document.body.classList.add("album-is-open");
  albumDialog.showModal();
  albumScroll.scrollTop = 0;
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

albumMosaic.addEventListener("click", (event) => {
  const tile = event.target.closest("[data-image-index]");

  if (!tile) {
    return;
  }

  openPhoto(Number(tile.dataset.imageIndex), tile);
});

albumImage.addEventListener("load", () => {
  albumImage.classList.remove("is-changing");
});

albumClose.addEventListener("click", closeAlbum);
photoBack.addEventListener("click", closePhoto);
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

albumInquiryLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    lastAlbumTrigger = null;
    closeAlbum();
    window.location.hash = "contact";
    document.querySelector("#contact")?.scrollIntoView();
  });
});

albumDialog.addEventListener("click", (event) => {
  if (event.target === albumDialog) {
    closeAlbum();
  }
});

albumDialog.addEventListener("cancel", (event) => {
  if (!photoViewer.hidden) {
    event.preventDefault();
    closePhoto();
  }
});

albumDialog.addEventListener("close", () => {
  document.body.classList.remove("album-is-open");
  photoViewer.hidden = true;
  albumBrowser.hidden = false;
  activeAlbum = null;
  activeImageIndex = 0;
  lastAlbumTile = null;
  albumScrollPosition = 0;

  if (lastAlbumTrigger) {
    lastAlbumTrigger.focus();
  }
});

document.addEventListener("keydown", (event) => {
  if (!albumDialog.open || photoViewer.hidden) {
    return;
  }

  if (event.key === "ArrowLeft") {
    stepAlbum(-1);
  }

  if (event.key === "ArrowRight") {
    stepAlbum(1);
  }
});

let mosaicResizeFrame = null;

window.addEventListener("resize", () => {
  window.cancelAnimationFrame(mosaicResizeFrame);
  mosaicResizeFrame = window.requestAnimationFrame(layoutAlbumMosaic);
}, { passive: true });

const inquiryStatus = new URLSearchParams(window.location.search).get("inquiry");

if (inquiryStatus === "sent") {
  formNote.textContent = "Thank you — your inquiry was sent to Callan. She will be in touch soon.";
  formNote.classList.add("is-success");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const sessionType = String(data.get("sessionType") || "").trim();
  const message = String(data.get("message") || "").trim();
  const honeypot = String(data.get("_honey") || "").trim();

  if (honeypot) {
    form.reset();
    formNote.textContent = "Thank you — your inquiry was sent to Callan. She will be in touch soon.";
    formNote.classList.remove("is-error");
    formNote.classList.add("is-success");
    return;
  }

  formButton.disabled = true;
  formButton.textContent = "Sending…";
  formNote.textContent = "Sending your inquiry securely…";
  formNote.classList.remove("is-success", "is-error");

  try {
    const response = await fetch(contactEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        "Session type": sessionType,
        message,
        _subject: `New ${sessionType} inquiry from ${name}`,
        _template: "table",
        _url: "https://callanelizabethphotography.com/#contact",
      }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false || result.success === "false") {
      throw new Error("Form delivery failed");
    }

    form.reset();
    formNote.textContent = "Thank you — your inquiry was sent to Callan. She will be in touch soon.";
    formNote.classList.add("is-success");
  } catch (error) {
    formNote.textContent = `We could not send your inquiry. Please try again, or email Callan directly at ${contactEmail}.`;
    formNote.classList.add("is-error");
  } finally {
    formButton.disabled = false;
    formButton.textContent = "Send Inquiry";
  }
});
