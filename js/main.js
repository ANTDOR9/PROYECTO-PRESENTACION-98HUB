/* =========================================================
   BT-98LKT HUB — Propuesta UNSA · main.js
========================================================= */
(function () {
  "use strict";

  /* ---------- Nav: solid background on scroll ---------- */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("navBurger");
  const navMobile = document.getElementById("navMobile");

  function onScroll() {
    if (window.scrollY > 40) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu toggle ---------- */
  if (burger && navMobile) {
    burger.addEventListener("click", () => {
      const isOpen = navMobile.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(isOpen));
    });
    navMobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navMobile.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Scroll cue button ---------- */
  const scrollCue = document.getElementById("scrollCue");
  if (scrollCue) {
    scrollCue.addEventListener("click", () => {
      const next = document.getElementById("contexto");
      if (next) next.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------- Reveal-on-scroll ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Carousel: coverflow (centered slide scales up) ---------- */
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector("[data-carousel-track]");
    const prevBtn = carousel.querySelector("[data-carousel-prev]");
    const nextBtn = carousel.querySelector("[data-carousel-next]");
    if (!track) return;
    const slides = Array.from(track.querySelectorAll(".carousel__slide"));

    // Slow, eased scroll (native "smooth" is too quick/linear for the
    // effect we want) — custom easeInOutCubic over ~900ms. Scroll-snap
    // is temporarily disabled during the animation because the browser's
    // own snapping was fighting our manual scroll and causing jank.
    function smoothScrollTo(target, duration) {
      track.classList.add("is-animating");
      const start = track.scrollLeft;
      const change = target - start;
      const startTime = performance.now();
      function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
      function step(now) {
        const elapsed = Math.min((now - startTime) / duration, 1);
        track.scrollLeft = start + change * ease(elapsed);
        if (elapsed < 1) {
          requestAnimationFrame(step);
        } else {
          track.classList.remove("is-animating");
        }
      }
      requestAnimationFrame(step);
    }

    function updateActiveSlide() {
      const trackRect = track.getBoundingClientRect();
      const center = trackRect.left + trackRect.width / 2;
      let closest = null;
      let closestDist = Infinity;
      slides.forEach((slide) => {
        const r = slide.getBoundingClientRect();
        const dist = Math.abs(r.left + r.width / 2 - center);
        if (dist < closestDist) {
          closestDist = dist;
          closest = slide;
        }
      });
      slides.forEach((s) => s.classList.toggle("is-active", s === closest));
    }

    function updateArrows() {
      if (!prevBtn || !nextBtn) return;
      const maxScroll = track.scrollWidth - track.clientWidth - 4;
      prevBtn.disabled = track.scrollLeft <= 4;
      nextBtn.disabled = track.scrollLeft >= maxScroll;
    }

    function goTo(direction) {
      const active = slides.find((s) => s.classList.contains("is-active")) || slides[0];
      const index = slides.indexOf(active);
      const targetIndex = Math.min(Math.max(index + direction, 0), slides.length - 1);
      const target = slides[targetIndex];
      const trackRect = track.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const delta = (targetRect.left + targetRect.width / 2) - (trackRect.left + trackRect.width / 2);
      smoothScrollTo(track.scrollLeft + delta, 900);
    }

    if (prevBtn) prevBtn.addEventListener("click", () => goTo(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => goTo(1));

    let scrollTicking = false;
    track.addEventListener(
      "scroll",
      () => {
        if (!scrollTicking) {
          requestAnimationFrame(() => {
            updateActiveSlide();
            updateArrows();
            scrollTicking = false;
          });
          scrollTicking = true;
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", () => {
      updateActiveSlide();
      updateArrows();
    });

    updateActiveSlide();
    updateArrows();
  });

  /* ---------- Media placeholder fallback ----------
     Every media-frame starts WITHOUT the .is-loaded class, so the
     styled placeholder shows by default. As soon as the real image
     or video finishes loading, we add .is-loaded and the real media
     appears. If the file is missing (404), it silently stays as
     the placeholder. This means: just drop files into /assets/
     with the exact filenames referenced in index.html and reload —
     no code changes needed.
  ------------------------------------------------- */
  document.querySelectorAll("[data-media-frame]").forEach((frame) => {
    const img = frame.querySelector("img");
    const video = frame.querySelector("video");

    if (img) {
      if (img.complete && img.naturalWidth > 0) {
        frame.classList.add("is-loaded");
      } else {
        img.addEventListener("load", () => frame.classList.add("is-loaded"));
        img.addEventListener("error", () => frame.classList.remove("is-loaded"));
      }
    }

    if (video) {
      const source = video.querySelector("source");
      video.addEventListener("loadeddata", () => frame.classList.add("is-loaded"));
      video.addEventListener("error", () => frame.classList.remove("is-loaded"));
      if (source) {
        source.addEventListener("error", () => frame.classList.remove("is-loaded"));
      }
      // Pause the hero video when it scrolls out of view, resume when back —
      // saves resources without any visible effect on playback.
      if ("IntersectionObserver" in window) {
        const vio = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        });
        vio.observe(video);
      }
    }
  });
})();