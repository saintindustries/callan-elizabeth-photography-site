const reviewEndpoint = "https://callan-elizabeth-reviews.new-clock-7578.chatgpt.site/api/reviews";
const reviewDraftKey = "callan-elizabeth-review-draft-v1";
const allowedSessionTypes = new Set([
  "Family Session",
  "Couples Session",
  "Portrait Session",
  "Pets & Animals",
  "Other",
]);
const reviewForm = document.querySelector("[data-review-form]");
const reviewStatus = document.querySelector("[data-form-status]");
const submitButton = document.querySelector("[data-submit-button]");
const ratingOptions = document.querySelector("[data-rating-options]");
const characterCount = document.querySelector("[data-character-count]");

function getSubmission() {
  const data = new FormData(reviewForm);

  return {
    displayName: String(data.get("displayName") || "").trim(),
    email: String(data.get("email") || "").trim(),
    sessionType: String(data.get("sessionType") || "").trim(),
    sessionDate: String(data.get("sessionDate") || "").trim(),
    rating: Number(data.get("rating") || 0),
    review: String(data.get("review") || "").trim(),
    consent: data.get("consent") === "on",
    companyWebsite: String(data.get("companyWebsite") || "").trim(),
  };
}

function validateSubmission(submission) {
  const errors = new Map();

  if (!submission.displayName) {
    errors.set("displayName", "Please fill out your name before submitting.");
  } else if (submission.displayName.length < 2) {
    errors.set("displayName", "Please enter at least two characters for your name.");
  }

  if (!submission.email) {
    errors.set("email", "Please fill out the email section before submitting.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
    errors.set("email", "Please enter a complete email address, such as name@example.com.");
  }

  if (!submission.sessionType) {
    errors.set("sessionType", "Please choose the type of photography session you had.");
  } else if (!allowedSessionTypes.has(submission.sessionType)) {
    errors.set("sessionType", "Please choose one of the available session types.");
  }

  if (submission.sessionDate && !/^\d{4}-\d{2}-\d{2}$/.test(submission.sessionDate)) {
    errors.set("sessionDate", "Please enter a valid session date or leave this optional field blank.");
  }

  if (!Number.isInteger(submission.rating) || submission.rating < 1 || submission.rating > 5) {
    errors.set("rating", "Please choose a rating from one to five stars.");
  }

  if (!submission.review) {
    errors.set("review", "Please write your review before submitting.");
  } else if (submission.review.length < 40) {
    errors.set("review", `Please add ${40 - submission.review.length} more characters to your review.`);
  } else if (submission.review.length > 1200) {
    errors.set("review", "Please shorten your review to 1,200 characters or fewer.");
  } else if (/https?:\/\/|www\./i.test(submission.review)) {
    errors.set("review", "Please remove website links from your review before submitting.");
  }

  if (!submission.consent) {
    errors.set("consent", "Please confirm that Callan may share your review on the website.");
  }

  return errors;
}

function clearFieldError(fieldName) {
  const wrapper = reviewForm.querySelector(`[data-field-wrapper="${fieldName}"]`);
  const error = reviewForm.querySelector(`[data-field-error="${fieldName}"]`);
  const control = reviewForm.elements.namedItem(fieldName);

  wrapper?.classList.remove("has-error");
  if (error) error.textContent = "";
  if (control instanceof HTMLElement) control.removeAttribute("aria-invalid");
}

function clearValidationErrors() {
  ["displayName", "email", "sessionType", "sessionDate", "rating", "review", "consent"]
    .forEach(clearFieldError);
}

function showValidationErrors(errors) {
  clearValidationErrors();

  errors.forEach((message, fieldName) => {
    const wrapper = reviewForm.querySelector(`[data-field-wrapper="${fieldName}"]`);
    const error = reviewForm.querySelector(`[data-field-error="${fieldName}"]`);
    const control = reviewForm.elements.namedItem(fieldName);

    wrapper?.classList.add("has-error");
    if (error) error.textContent = message;
    if (control instanceof HTMLElement) control.setAttribute("aria-invalid", "true");
  });

  const firstField = errors.keys().next().value;
  const firstControl = reviewForm.elements.namedItem(firstField);
  const focusTarget = firstControl instanceof RadioNodeList ? firstControl[0] : firstControl;

  if (focusTarget instanceof HTMLElement) {
    focusTarget.focus({ preventScroll: true });
    focusTarget.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  reviewStatus.textContent = errors.size === 1
    ? "Please correct the highlighted field, then submit again."
    : `Please correct the ${errors.size} highlighted fields, then submit again.`;
  reviewStatus.classList.remove("is-success");
  reviewStatus.classList.add("is-error");
}

function inferServerField(message) {
  const normalized = String(message || "").toLowerCase();
  if (normalized.includes("name")) return "displayName";
  if (normalized.includes("email")) return "email";
  if (normalized.includes("session type")) return "sessionType";
  if (normalized.includes("rating") || normalized.includes("star")) return "rating";
  if (normalized.includes("character") || normalized.includes("link")) return "review";
  if (normalized.includes("permission")) return "consent";
  return null;
}

function saveDraft() {
  try {
    const submission = getSubmission();
    const hasMeaningfulDraft = Boolean(
      submission.displayName ||
      submission.email ||
      submission.sessionType ||
      submission.sessionDate ||
      submission.review ||
      submission.consent ||
      submission.rating !== 5
    );

    if (!hasMeaningfulDraft) {
      localStorage.removeItem(reviewDraftKey);
      return;
    }

    localStorage.setItem(reviewDraftKey, JSON.stringify({
      displayName: submission.displayName,
      email: submission.email,
      sessionType: submission.sessionType,
      sessionDate: submission.sessionDate,
      rating: submission.rating || 5,
      review: submission.review,
      consent: submission.consent,
      savedAt: new Date().toISOString(),
    }));
  } catch {
    // Some private-browsing settings disable local storage; submission still works normally.
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(reviewDraftKey);
  } catch {
    // Nothing else is required when local storage is unavailable.
  }
}

function updateCharacterCount() {
  const review = reviewForm.elements.namedItem("review");
  if (review instanceof HTMLTextAreaElement && characterCount) {
    characterCount.textContent = `${review.value.length.toLocaleString()} / 1,200`;
  }
}

function restoreDraft() {
  try {
    const stored = localStorage.getItem(reviewDraftKey);
    if (!stored) return;

    const draft = JSON.parse(stored);
    ["displayName", "email", "sessionType", "sessionDate", "review"].forEach((fieldName) => {
      const control = reviewForm.elements.namedItem(fieldName);
      if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) {
        control.value = String(draft[fieldName] || "");
      }
    });

    const rating = Number(draft.rating) || 5;
    const ratingControl = reviewForm.querySelector(`input[name="rating"][value="${rating}"]`);
    if (ratingControl instanceof HTMLInputElement) ratingControl.checked = true;
    const consent = reviewForm.elements.namedItem("consent");
    if (consent instanceof HTMLInputElement) consent.checked = Boolean(draft.consent);
    setRating(rating);
    updateCharacterCount();
    reviewStatus.textContent = "Your saved answers have been restored. Review them, then submit when ready.";
  } catch {
    clearDraft();
  }
}

async function notifyCallanFromBrowser(submission) {
  const submittedAtEastern = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date());
  const response = await fetch("https://formsubmit.co/ajax/Callan.sovik@gmail.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      Name: submission.displayName,
      Email: submission.email,
      "Session Type": submission.sessionType,
      "Session Date": submission.sessionDate || "Not provided",
      Rating: `${submission.rating} out of 5`,
      Review: submission.review,
      "Submitted (Eastern Time)": submittedAtEastern,
      _replyto: submission.email,
      _subject: `New website review — ${submission.displayName}`,
      _template: "basic",
      _url: "https://callanelizabethphotography.com/reviews/",
    }),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false || result.success === "false") {
    throw new Error("Browser notification failed");
  }
}

function setRating(value) {
  const rating = Number(value);
  ratingOptions.setAttribute("aria-label", `${rating} out of 5 stars`);
  ratingOptions.querySelectorAll("label").forEach((label, index) => {
    label.classList.toggle("is-active", index < rating);
  });
}

ratingOptions.addEventListener("change", (event) => {
  if (event.target.matches('input[name="rating"]')) {
    setRating(event.target.value);
    clearFieldError("rating");
    saveDraft();
  }
});

reviewForm.addEventListener("input", (event) => {
  const fieldName = event.target.name;
  if (fieldName && fieldName !== "companyWebsite") clearFieldError(fieldName);
  if (fieldName === "review") updateCharacterCount();
  saveDraft();
});

reviewForm.addEventListener("change", (event) => {
  const fieldName = event.target.name;
  if (fieldName && fieldName !== "companyWebsite") clearFieldError(fieldName);
  saveDraft();
});

reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submission = getSubmission();
  const validationErrors = validateSubmission(submission);
  saveDraft();

  if (validationErrors.size) {
    showValidationErrors(validationErrors);
    return;
  }

  clearValidationErrors();
  submitButton.disabled = true;
  submitButton.textContent = "Saving…";
  reviewStatus.textContent = "Saving your review securely…";
  reviewStatus.classList.remove("is-success", "is-error");

  try {
    const response = await fetch(reviewEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(submission),
    });
    const result = await response.json().catch(() => ({}));

    if (response.status === 409) {
      clearDraft();
      reviewStatus.textContent = "A review from this email was already safely received today.";
      reviewStatus.classList.add("is-success");
      return;
    }

    if (!response.ok) {
      const fieldName = inferServerField(result.error);
      if (fieldName) {
        showValidationErrors(new Map([[fieldName, result.error]]));
      } else {
        reviewStatus.textContent = `${result.error || "The review service could not be reached."} Your answers are saved on this device—please try again.`;
        reviewStatus.classList.add("is-error");
      }
      return;
    }

    if (result.review && result.notificationSent === false) {
      try {
        await notifyCallanFromBrowser(submission);
      } catch {
        // The review is already safely stored and published. Email can be retried separately.
      }
    }

    clearDraft();
    reviewForm.reset();
    reviewForm.querySelector('input[name="rating"][value="5"]').checked = true;
    setRating(5);
    updateCharacterCount();
    reviewStatus.textContent = "Thank you. Your review has been safely received and added to Callan’s website.";
    reviewStatus.classList.add("is-success");
  } catch {
    reviewStatus.textContent = "The review service could not be reached. Your answers are saved on this device—please try again.";
    reviewStatus.classList.add("is-error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Review";
  }
});

setRating(5);
updateCharacterCount();
restoreDraft();
