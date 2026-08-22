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

// Flip the Take Part cards on tap or keyboard activation.
document.querySelectorAll(".flip-card-toggle").forEach(card => {
  card.addEventListener("click", () => {
    const isFlipped = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", String(isFlipped));
  });
});
