const squiggleLine = document.getElementById("squiggleLine");
const squiggleWrap = document.querySelector(".squiggle-wrap");
const fundraisingProgress = document.getElementById("squiggleProgress");
const fundraisingGoal = 50000;
const fundraisingCurrency = "NZD";
const fundraisingSheetUrl =
  "https://docs.google.com/spreadsheets/d/1PCS5-EEhQ_InzL-0DR8b07jGTD4Ugvkp6EgN6dqRTa8/gviz/tq";
const fundraisingSheetCallback = "handleMtiFundraisingResponse";

const formatFundraisingAmount = (amount, currency, compact = false) => {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard"
  }).format(amount);
};

const parseFundraisingAmount = value => {
  const textValue = String(value ?? "").trim();

  if (!textValue || !/\d/.test(textValue)) {
    throw new Error("Fundraising amount is missing");
  }

  const parsedValue = typeof value === "number"
    ? value
    : Number(textValue.replace(/[^0-9.-]/g, ""));

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error("Fundraising amount is invalid");
  }

  return parsedValue;
};

const getFundraisingAmountFromSheet = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Google Sheets request timed out"));
    }, 8000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      script.remove();
      delete window[fundraisingSheetCallback];
    };

    window[fundraisingSheetCallback] = response => {
      try {
        if (response?.status !== "ok") {
          throw new Error("Google Sheets returned an error");
        }

        const value = response.table?.rows?.[0]?.c?.[0]?.v;
        const raised = parseFundraisingAmount(value);
        cleanup();
        resolve(raised);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error("Google Sheets could not be reached"));
    };
    script.src = `${fundraisingSheetUrl}?tqx=responseHandler:${fundraisingSheetCallback}&gid=0&range=A1`;
    document.head.append(script);
  });
};

const getFallbackFundraisingAmount = async () => {
  const response = await fetch("fundraising.json", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Fallback fundraising data returned ${response.status}`);
  }

  const data = await response.json();
  return parseFundraisingAmount(data.raised);
};

const displayFundraisingData = (raised, updatedAt = null) => {
  const percentage = Math.min((raised / fundraisingGoal) * 100, 100);
  const raisedLabel = formatFundraisingAmount(raised, fundraisingCurrency, true);
  const goalLabel = formatFundraisingAmount(fundraisingGoal, fundraisingCurrency, true);
  const fullRaisedLabel = formatFundraisingAmount(raised, fundraisingCurrency);
  const fullGoalLabel = formatFundraisingAmount(fundraisingGoal, fundraisingCurrency);
  const description = `raised of ${goalLabel} goal for men’s health`;

  document.querySelectorAll("[data-fundraising-raised]").forEach(element => {
    const unit = element.querySelector(".fundraising-unit");
    if (unit) {
      const hasThousandsUnit = raisedLabel.endsWith("K");
      unit.textContent = hasThousandsUnit ? "k" : "";
      element.replaceChildren(hasThousandsUnit ? raisedLabel.slice(0, -1) : raisedLabel, unit);
    } else {
      element.textContent = raisedLabel;
    }
  });

  document.querySelectorAll("[data-fundraising-description]").forEach(element => {
    element.textContent = description;
  });

  if (updatedAt) {
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
    meter.max = fundraisingGoal;
    meter.value = Math.min(raised, fundraisingGoal);
    meter.textContent = `${fullRaisedLabel} raised of ${fullGoalLabel} goal`;
    meter.setAttribute("aria-label", `${fullRaisedLabel} raised of ${fullGoalLabel} goal`);
    meter.hidden = false;
  }

  fundraisingProgress?.style.setProperty("--fundraising-progress", percentage);
  squiggleWrap?.classList.add("has-fundraising-data");
};

const loadFundraisingData = async () => {
  try {
    const raised = await getFundraisingAmountFromSheet();
    displayFundraisingData(raised, new Date());
  } catch (error) {
    console.warn("Unable to load the Google Sheet; trying the local fallback:", error);

    try {
      const raised = await getFallbackFundraisingAmount();
      displayFundraisingData(raised);
    } catch (fallbackError) {
      console.warn("Using the fundraising fallback content from the page:", fallbackError);
    }
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

// Enhance native event disclosures into one shared, animated reading panel.
const setupEventPanel = () => {
  const panel = document.getElementById("event-panel");
  if (!panel) return;

  const grid = panel.closest(".event-cards");
  const cards = Array.from(grid.querySelectorAll(".event-card"));
  const title = panel.querySelector("h3");
  const meta = panel.querySelector("[data-event-panel-meta]");
  const when = panel.querySelector("[data-event-panel-when]");
  const content = panel.querySelector("[data-event-panel-content]");
  const closeButton = panel.querySelector(".event-panel-close");
  let activeEvent = null;
  let animation = null;

  const positionPanel = () => {
    if (!activeEvent) return;
    const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    const row = Math.floor(cards.indexOf(activeEvent.card) / columns);
    const lastCardInRow = cards[Math.min((row + 1) * columns, cards.length) - 1];
    if (panel.previousElementSibling !== lastCardInRow) lastCardInRow.after(panel);
  };

  const finishAnimation = () => {
    animation?.cancel();
    animation = null;
    panel.classList.remove("is-animating");
    panel.hidden = !activeEvent;
    panel.inert = !activeEvent;
  };

  const revealPanel = () => {
    if (!activeEvent) return;
    const bounds = title.getBoundingClientRect();
    const headerBottom = document.querySelector(".site-header")?.getBoundingClientRect().bottom || 0;
    if (bounds.top < headerBottom + 16 || bounds.bottom > window.innerHeight) {
      panel.scrollIntoView({ behavior: reducedMotionQuery.matches ? "instant" : "smooth", block: "start" });
    }
  };

  const animatePanel = (startHeight, reveal = false) => {
    animation?.cancel();
    if (reducedMotionQuery.matches) {
      finishAnimation();
      if (reveal) revealPanel();
      return;
    }

    const endHeight = activeEvent ? panel.getBoundingClientRect().height : 0;
    panel.classList.add("is-animating");
    animation = panel.animate([
      { height: `${startHeight}px`, opacity: startHeight ? 1 : 0 },
      { height: `${endHeight}px`, opacity: activeEvent ? 1 : 0 }
    ], {
      duration: 420,
      easing: "cubic-bezier(0.2, 0.72, 0.22, 1)",
      fill: "both"
    });
    const currentAnimation = animation;
    animation.onfinish = () => {
      if (animation !== currentAnimation) return;
      finishAnimation();
      if (reveal) revealPanel();
    };
  };

  const closePanel = () => {
    if (!activeEvent) return;
    const startHeight = panel.getBoundingClientRect().height;
    const previousEvent = activeEvent;
    previousEvent.button.setAttribute("aria-expanded", "false");
    previousEvent.card.classList.remove("is-active");
    if (panel.contains(document.activeElement)) previousEvent.button.focus({ preventScroll: true });
    activeEvent = null;
    panel.inert = true;
    animatePanel(startHeight);
  };

  const showEvent = event => {
    if (activeEvent === event) {
      closePanel();
      return;
    }

    const startHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height;
    animation?.cancel();
    animation = null;
    if (activeEvent) {
      activeEvent.button.setAttribute("aria-expanded", "false");
      activeEvent.card.classList.remove("is-active");
    }
    activeEvent = event;
    event.button.setAttribute("aria-expanded", "true");
    event.card.classList.add("is-active");
    panel.dataset.event = event.card.dataset.event;
    title.textContent = event.card.querySelector("h3").textContent;
    meta.textContent = Array.from(event.card.querySelectorAll(".event-meta > span"), span => span.textContent).join(" / ");
    when.replaceChildren(event.card.querySelector(".event-when").cloneNode(true));
    content.replaceChildren(
      event.card.querySelector(".event-overview > p:last-child").cloneNode(true),
      ...Array.from(event.details.querySelector(".event-description").children, paragraph => paragraph.cloneNode(true))
    );
    closeButton.setAttribute("aria-label", `Close details for ${title.textContent}`);
    const previousSibling = panel.previousElementSibling;
    positionPanel();
    panel.hidden = false;
    panel.inert = false;
    title.focus({ preventScroll: true });
    animatePanel(panel.previousElementSibling === previousSibling ? startHeight : 0, true);
  };

  cards.forEach(card => {
    const details = card.querySelector(".event-disclosure");
    if (!details) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button event-action";
    button.dataset.eventToggle = card.dataset.event;
    button.innerHTML = details.querySelector("summary").innerHTML;
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", panel.id);
    details.before(button);
    details.hidden = true;
    const event = { card, details, button };
    button.addEventListener("click", () => showEvent(event));
  });

  closeButton.addEventListener("click", closePanel);
  panel.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
    }
  });
  window.addEventListener("resize", () => {
    finishAnimation();
    positionPanel();
  });
  reducedMotionQuery.addEventListener("change", finishAnimation);
};

setupEventPanel();

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

    closeButton.className = "card-close-icon expanded-card-close";
    closeButton.type = "button";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", `Close expanded ${title?.textContent || "activity"} card`);
    expandedCard.querySelector(".card-close-icon")?.replaceWith(closeButton);
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
