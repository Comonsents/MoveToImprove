const squiggleLine = document.getElementById("squiggleLine");
const squiggleWrap = document.querySelector(".squiggle-wrap");
const fundraisingProgress = document.getElementById("squiggleProgress");

const formatFundraisingAmount = (amount, currency, compact = false) => {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard"
  }).format(amount);
};

const loadFundraisingData = async () => {
  try {
    const response = await fetch("fundraising.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Fundraising data returned ${response.status}`);
    }

    const data = await response.json();
    const raised = Number(data.raised);
    const goal = Number(data.goal);
    const currency = typeof data.currency === "string" ? data.currency.toUpperCase() : "NZD";

    if (
      !Number.isFinite(raised) ||
      raised < 0 ||
      !Number.isFinite(goal) ||
      goal <= 0 ||
      !/^[A-Z]{3}$/.test(currency)
    ) {
      throw new Error("Fundraising data contains invalid values");
    }

    const percentage = Math.min((raised / goal) * 100, 100);
    const raisedLabel = formatFundraisingAmount(raised, currency, true);
    const goalLabel = formatFundraisingAmount(goal, currency, true);
    const fullRaisedLabel = formatFundraisingAmount(raised, currency);
    const fullGoalLabel = formatFundraisingAmount(goal, currency);
    const description = `raised of ${goalLabel} goal for men’s health`;
    const updatedAt = new Date(data.updatedAt);
    const hasUpdatedAt = data.updatedAt && !Number.isNaN(updatedAt.getTime());

    document.querySelectorAll("[data-fundraising-raised]").forEach(element => {
      element.textContent = raisedLabel;
    });

    document.querySelectorAll("[data-fundraising-description]").forEach(element => {
      element.textContent = description;
    });

    if (hasUpdatedAt) {
      const updatedLabel = new Intl.DateTimeFormat("en-NZ", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(updatedAt);

      document.querySelectorAll("[data-fundraising-updated]").forEach(element => {
        element.textContent = `Updated ${updatedLabel}`;
        element.hidden = false;
      });
    }

    const status = document.querySelector("[data-fundraising-status]");
    if (status) {
      status.textContent = `${fullRaisedLabel} raised of ${fullGoalLabel} goal.`;
    }

    const meter = document.querySelector("[data-fundraising-meter]");
    if (meter) {
      meter.max = goal;
      meter.value = Math.min(raised, goal);
      meter.textContent = `${fullRaisedLabel} raised of ${fullGoalLabel} goal`;
      meter.setAttribute("aria-label", `${fullRaisedLabel} raised of ${fullGoalLabel} goal`);
      meter.hidden = false;
    }

    fundraisingProgress?.style.setProperty("--fundraising-progress", percentage);
    squiggleWrap?.classList.add("has-fundraising-data");
  } catch (error) {
    console.warn("Using the fundraising fallback content:", error);
  }
};

loadFundraisingData();

const sectionColors = [
  { selector: "#hero", color: "#D92525" },
  { selector: "#about", color: "#F2AC29" },
  { selector: "#work", color: "#326A33" },
  { selector: "#events", color: "#D92525" },
  { selector: "#flagship", color: "#1E6196" },
  { selector: "#impact", color: "#1E6196" },
  { selector: "#partners", color: "#326A33" },
  { selector: "#support", color: "#3F3F40" }
];

const sections = sectionColors
  .map(item => ({ ...item, el: document.querySelector(item.selector) }))
  .filter(item => item.el);

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        squiggleLine.style.color = entry.target.dataset.squiggleColor;
      }
    });
  },
  {
    root: null,
    threshold: 0.45
  }
);

sections.forEach(({ el, color }) => {
  el.dataset.squiggleColor = color;
  observer.observe(el);
});

// Small parallax nudge: the line drifts very slightly as the page scrolls,
// unless the visitor has requested reduced motion.
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let ticking = false;

const updateSquiggleParallax = () => {
  if (ticking) return;
  ticking = true;

  requestAnimationFrame(() => {
    const offset = window.scrollY * 0.035;
    squiggleLine.style.transform = `translateY(${offset}px)`;
    ticking = false;
  });
};

const syncParallaxPreference = () => {
  window.removeEventListener("scroll", updateSquiggleParallax);

  if (reducedMotionQuery.matches) {
    squiggleLine.style.transform = "none";
    return;
  }

  window.addEventListener("scroll", updateSquiggleParallax, { passive: true });
  updateSquiggleParallax();
};

syncParallaxPreference();
reducedMotionQuery.addEventListener("change", syncParallaxPreference);

// Expand and flip the Take Part cards into a focused modal view.
const cardDialog = document.getElementById("expanded-card-dialog");
const expandedCardShell = cardDialog?.querySelector(".expanded-card-shell");
const cardToggles = document.querySelectorAll(".flip-card-toggle");
const cardThemeClasses = ["card-a", "card-b", "card-c", "card-d", "card-e"];
let activeCardToggle = null;
let cardDialogAnimation = null;
let isCardDialogClosing = false;
let lockedPageScrollY = 0;

const lockPageScroll = () => {
  lockedPageScrollY = window.scrollY;
  document.body.style.top = `-${lockedPageScrollY}px`;
  document.documentElement.classList.add("card-dialog-open");
  document.body.classList.add("card-dialog-open");
};

const unlockPageScroll = () => {
  document.body.classList.remove("card-dialog-open");
  document.body.style.top = "";
  window.scrollTo(0, lockedPageScrollY);
  document.documentElement.classList.remove("card-dialog-open");
};

const animateCardDialog = (fromRect, toRect, reverse = false) => {
  if (reducedMotionQuery.matches) return null;

  const offsetX = fromRect.left + fromRect.width / 2 - (toRect.left + toRect.width / 2);
  const offsetY = fromRect.top + fromRect.height / 2 - (toRect.top + toRect.height / 2);
  const scaleX = fromRect.width / toRect.width;
  const scaleY = fromRect.height / toRect.height;
  const compactTransform = `translate(${offsetX}px, ${offsetY}px) scale(${scaleX}, ${scaleY})`;
  const keyframes = reverse
    ? [{ transform: "none", opacity: 1 }, { transform: compactTransform, opacity: 0.5 }]
    : [{ transform: compactTransform, opacity: 0.5 }, { transform: "none", opacity: 1 }];

  return cardDialog.animate(keyframes, {
    duration: reverse ? 360 : 480,
    easing: "cubic-bezier(0.2, 0.72, 0.22, 1)",
    fill: "both"
  });
};

const closeExpandedCard = async () => {
  if (!cardDialog?.open || !activeCardToggle || isCardDialogClosing) return;
  isCardDialogClosing = true;

  cardDialog.classList.remove("is-flipped");
  cardDialogAnimation?.cancel();

  const expandedRect = cardDialog.getBoundingClientRect();
  const compactRect = activeCardToggle.getBoundingClientRect();
  cardDialogAnimation = animateCardDialog(compactRect, expandedRect, true);

  if (cardDialogAnimation) {
    try {
      await cardDialogAnimation.finished;
    } catch {
      // Closing should still complete if the animation is interrupted.
    }
  }

  cardDialog.close();
};

cardToggles.forEach(card => {
  card.addEventListener("click", () => {
    if (!cardDialog || !expandedCardShell || cardDialog.open) return;

    const sourceCard = card.closest(".feature-card");
    const expandedCard = card.querySelector(".flip-card-inner").cloneNode(true);
    const title = expandedCard.querySelector(".card-title");
    const closeButton = document.createElement("button");

    closeButton.className = "card-arrow expanded-card-close";
    closeButton.type = "button";
    closeButton.textContent = "↻";
    closeButton.setAttribute("aria-label", `Close expanded ${title?.textContent || "activity"} card`);
    expandedCard.querySelector(".card-arrow")?.replaceWith(closeButton);
    expandedCard.removeAttribute("aria-hidden");
    expandedCard.querySelector(".card-front")?.setAttribute("aria-hidden", "true");

    if (title) {
      title.id = "expanded-card-title";
      cardDialog.setAttribute("aria-labelledby", title.id);
    }

    expandedCardShell.replaceChildren(expandedCard);
    cardDialog.classList.remove(...cardThemeClasses);
    const themeClass = cardThemeClasses.find(className => sourceCard?.classList.contains(className));
    if (themeClass) cardDialog.classList.add(themeClass);

    activeCardToggle = card;
    activeCardToggle.setAttribute("aria-expanded", "true");

    const compactRect = card.getBoundingClientRect();
    cardDialog.showModal();
    lockPageScroll();
    const expandedRect = cardDialog.getBoundingClientRect();
    cardDialogAnimation = animateCardDialog(compactRect, expandedRect);

    requestAnimationFrame(() => {
      cardDialog.classList.add("is-flipped");
      closeButton.focus({ preventScroll: true });
    });

    closeButton.addEventListener("click", closeExpandedCard);
  });
});

cardDialog?.addEventListener("cancel", event => {
  event.preventDefault();
  closeExpandedCard();
});

cardDialog?.addEventListener("click", event => {
  if (event.target !== cardDialog) return;

  const bounds = cardDialog.getBoundingClientRect();
  const clickedOutside = event.clientX < bounds.left
    || event.clientX > bounds.right
    || event.clientY < bounds.top
    || event.clientY > bounds.bottom;

  if (clickedOutside) closeExpandedCard();
});

cardDialog?.addEventListener("close", () => {
  cardDialogAnimation?.cancel();
  cardDialogAnimation = null;
  cardDialog.classList.remove("is-flipped", ...cardThemeClasses);

  if (activeCardToggle) {
    activeCardToggle.setAttribute("aria-expanded", "false");
    activeCardToggle.focus({ preventScroll: true });
  }

  activeCardToggle = null;
  isCardDialogClosing = false;
  unlockPageScroll();
  expandedCardShell?.replaceChildren();
});
