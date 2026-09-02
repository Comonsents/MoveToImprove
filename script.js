const path = document.getElementById("squigglePath");

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
        path.style.stroke = entry.target.dataset.squiggleColor;
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
    path.style.transform = `translateY(${offset}px)`;
    ticking = false;
  });
};

const syncParallaxPreference = () => {
  window.removeEventListener("scroll", updateSquiggleParallax);

  if (reducedMotionQuery.matches) {
    path.style.transform = "none";
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
