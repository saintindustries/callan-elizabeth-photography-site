const reviewEndpoint = "https://callan-elizabeth-reviews.new-clock-7578.chatgpt.site/api/reviews";
const reviewForm = document.querySelector("[data-review-form]");
const reviewStatus = document.querySelector("[data-form-status]");
const submitButton = document.querySelector("[data-submit-button]");
const ratingOptions = document.querySelector("[data-rating-options]");

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
  }
});

reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(reviewForm);

  submitButton.disabled = true;
  submitButton.textContent = "Sending…";
  reviewStatus.textContent = "Sending your review…";
  reviewStatus.classList.remove("is-success", "is-error");

  try {
    const submission = {
      displayName: String(data.get("displayName") || ""),
      email: String(data.get("email") || ""),
      sessionType: String(data.get("sessionType") || ""),
      sessionDate: String(data.get("sessionDate") || ""),
      rating: Number(data.get("rating") || 5),
      review: String(data.get("review") || ""),
      consent: data.get("consent") === "on",
      companyWebsite: String(data.get("companyWebsite") || ""),
    };
    const response = await fetch(reviewEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(submission),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Your review could not be submitted.");
    }

    if (result.review && result.notificationSent === false) {
      try {
        await notifyCallanFromBrowser(submission);
      } catch (notificationError) {
        // The review is already safely stored and published. Email can be retried separately.
      }
    }

    reviewForm.reset();
    reviewForm.querySelector('input[name="rating"][value="5"]').checked = true;
    setRating(5);
    reviewStatus.textContent = "Thank you. Your kind words have been received and added to Callan’s reviews.";
    reviewStatus.classList.add("is-success");
  } catch (error) {
    reviewStatus.textContent = error instanceof Error
      ? error.message
      : "Your review could not be submitted. Please try again.";
    reviewStatus.classList.add("is-error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Review";
  }
});
