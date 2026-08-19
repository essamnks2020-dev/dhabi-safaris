(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const light = touch || reduceMotion;

  const loader = document.getElementById("loader");

  const finishLoader = () => {
    if (!loader) return;
    loader.style.pointerEvents = "none";
    loader.style.display = "none";
    document.body.classList.add("is-ready");
    const nav = document.querySelector(".nav");
    if (nav) nav.style.transform = "translateY(0)";
  };

  let scrollLockY = 0;

  const menu = {
    open: false,
    overlay: document.getElementById("menu"),
    toggle(force) {
      this.open = typeof force === "boolean" ? force : !this.open;
      this.overlay?.classList.toggle("open", this.open);
      document.body.classList.toggle("menu-open", this.open);
      if (this.open) {
        scrollLockY = window.scrollY;
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollLockY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
      } else {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollLockY);
      }
    },
  };

  const smooth = () => {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (menu.open) menu.toggle(false);
        target.scrollIntoView({ behavior: reduceMotion || touch ? "auto" : "smooth" });
      });
    });
  };

  const progress = () => {
    const barEl = document.querySelector(".scroll-progress");
    if (!barEl) return;
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      barEl.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  };

  const cursor = () => {
    if (light) return;
    const ring = document.querySelector(".cursor");
    const dot = document.querySelector(".cursor-dot");
    if (!ring || !dot) return;

    const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { x: mouse.x, y: mouse.y };
    const dotPos = { x: mouse.x, y: mouse.y };

    window.addEventListener(
      "mousemove",
      (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      },
      { passive: true }
    );

    const move = () => {
      ringPos.x += (mouse.x - ringPos.x) * 0.13;
      ringPos.y += (mouse.y - ringPos.y) * 0.13;
      dotPos.x += (mouse.x - dotPos.x) * 0.32;
      dotPos.y += (mouse.y - dotPos.y) * 0.32;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;
      dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(move);
    };
    requestAnimationFrame(move);

    document.querySelectorAll("[data-hover], a, button, input, textarea").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });
  };

  const scenes = () => {
    if (light || typeof gsap === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils
      .toArray(
        ".statement h2, .statement p, .about h2, .about-copy p, .circuit-head h2, .circuit-head p, .fleet-head h2, .fleet-head p, .contact-panel h2, .contact-form h3"
      )
      .forEach((el) => {
        gsap.from(el, {
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });

    gsap.from(".quote blockquote, .quote cite", {
      y: 24,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: ".quote", start: "top 75%", once: true },
    });

    document.querySelectorAll(".stat b").forEach((el) => {
      const raw = el.textContent.trim();
      const num = parseFloat(raw);
      if (Number.isNaN(num)) return;
      const obj = { n: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            n: num,
            duration: 1.4,
            ease: "expo.out",
            onUpdate: () => {
              el.textContent = String(Math.round(obj.n));
            },
          });
        },
      });
    });
  };

  const circuit = () => {
    const pin = document.querySelector(".circuit-pin");
    const track = document.querySelector(".circuit-track");
    if (!pin || !track || light || innerWidth < 981 || typeof gsap === "undefined") return;

    const distance = () => Math.max(0, track.scrollWidth - innerWidth);

    gsap.to(track, {
      x: () => Math.min(0, innerWidth - track.scrollWidth),
      ease: "none",
      scrollTrigger: {
        trigger: pin,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
        end: () => `+=${distance()}`,
      },
    });
  };

  const chrome = () => {
    document.querySelector(".menu-btn")?.addEventListener("click", () => menu.toggle(true));
    document.querySelector(".menu-close")?.addEventListener("click", () => menu.toggle(false));
    menu.overlay?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => menu.toggle(false)));

    const form = document.getElementById("enquiry");
    const note = document.getElementById("formNote");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      if (!name || !email) {
        note.textContent = "Please add your name and email.";
        return;
      }
      const subject = encodeURIComponent(`Safari enquiry — ${name}`);
      const body = encodeURIComponent(
        [`Name: ${name}`, `Email: ${email}`, `Dates: ${form.dates.value}`, "", form.message.value].join("\n")
      );
      window.location.href = `mailto:info@dhabisafaris.com?subject=${subject}&body=${body}`;
      note.textContent = "Opening your email client…";
    });

    const marquee = document.querySelector(".marquee-track");
    if (marquee && !touch) {
      const wrap = marquee.closest(".marquee");
      const io = new IntersectionObserver(([entry]) => {
        marquee.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
      });
      if (wrap) io.observe(wrap);
    }
  };

  const tintNav = () => {
    const navEl = document.querySelector(".nav");
    const lightZones = [...document.querySelectorAll(".about, .fleet, .contact-form")];
    if (!navEl) return;
    const y = 36;
    navEl.classList.toggle(
      "on-light",
      lightZones.some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= y && r.bottom >= y;
      })
    );
  };

  window.addEventListener("scroll", tintNav, { passive: true });
  window.addEventListener("resize", tintNav, { passive: true });

  cursor();
  chrome();
  smooth();
  progress();

  const boot = async () => {
    finishLoader();
    tintNav();
    if (light) return;

    const loadScript = (src) =>
      new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = resolve;
        document.body.appendChild(s);
      });

    await loadScript("https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js");
    await loadScript("https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/ScrollTrigger.min.js");
    if (typeof gsap === "undefined") return;

    scenes();
    circuit();
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
  };

  boot();
})();
