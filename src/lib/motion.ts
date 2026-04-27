/**
 * Bootstraps Lenis smooth-scroll, GSAP ScrollTrigger reveal animations,
 * and a magnetic-cursor effect. Respects prefers-reduced-motion.
 *
 * Loaded once from the base layout via a client script. Idempotent.
 */
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let booted = false;

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export function bootMotion() {
  if (booted) return;
  booted = true;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reveal-on-scroll fallback for any element marked .reveal — even if GSAP fails
  // we still get a graceful CSS transition driven by IntersectionObserver.
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
  );
  document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => io.observe(el));

  if (reducedMotion) {
    // Mark sticky stats visible and bail out of GSAP/Lenis
    document.documentElement.dataset["motion"] = "reduced";
    return;
  }

  // Lenis smooth scroll
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    wheelMultiplier: 1.0,
    touchMultiplier: 1.4,
    syncTouch: false,
  });
  window.__lenis = lenis;

  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Wire Lenis ↔ ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Sticky stats bar visibility
  const stickyStats = document.querySelector<HTMLElement>("[data-sticky-stats]");
  if (stickyStats) {
    ScrollTrigger.create({
      trigger: "[data-hero]",
      start: "bottom top+=80",
      onEnter: () => stickyStats.classList.add("is-pinned"),
      onLeaveBack: () => stickyStats.classList.remove("is-pinned"),
    });
  }

  // Story scrollytelling — pin-and-reveal on the description block
  const story = document.querySelector<HTMLElement>("[data-story]");
  if (story) {
    const lines = story.querySelectorAll<HTMLElement>("[data-story-line]");
    if (lines.length) {
      gsap.set(lines, { opacity: 0.18, y: 14 });
      gsap.to(lines, {
        opacity: 1,
        y: 0,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: story,
          start: "top 75%",
          end: "bottom 50%",
          scrub: 0.6,
        },
      });
    }
    // Cross-fade hero images on the right
    const images = story.querySelectorAll<HTMLElement>("[data-story-image]");
    if (images.length > 1) {
      images.forEach((img, i) => {
        if (i === 0) gsap.set(img, { opacity: 1 });
        else gsap.set(img, { opacity: 0 });
      });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: story,
          start: "top 60%",
          end: "bottom 30%",
          scrub: 0.6,
        },
      });
      images.forEach((_, i) => {
        if (i === 0) return;
        const prev = images[i - 1];
        const cur = images[i];
        if (prev) tl.to(prev, { opacity: 0, ease: "none" }, i - 1);
        if (cur) tl.to(cur, { opacity: 1, ease: "none" }, i - 1);
      });
    }
  }

  // Hero parallax — gentle Ken-Burns-ish scale as you scroll past
  const heroMedia = document.querySelector<HTMLElement>("[data-hero-media]");
  if (heroMedia) {
    gsap.to(heroMedia, {
      yPercent: 14,
      scale: 1.06,
      ease: "none",
      scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
    });
  }

  // Magnetic effect for primary CTAs
  document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
    const strength = 14;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${(x / r.width) * strength}px, ${
        (y / r.height) * strength
      }px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "translate(0,0)";
    });
  });

  // Smooth in-page anchor scrolling via Lenis
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector<HTMLElement>(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -72, duration: 1.1 });
    });
  });
}
