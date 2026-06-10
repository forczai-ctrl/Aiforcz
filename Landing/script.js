document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const body = document.body;
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelectorAll(".main-nav a, .nav-actions a");

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      const isOpen = body.classList.toggle("nav-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      body.classList.remove("nav-open");
      if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  const demoModal = document.getElementById("demoModal");
  const demoOpenButtons = document.querySelectorAll(".js-open-demo");
  const demoCloseButton = document.querySelector(".demo-close");
  let lastDemoTrigger = null;

  const clearDemoStatus = () => {
    const form = demoModal ? demoModal.querySelector("[data-demo-form], .demo-form") : null;
    if (form && window.AIFORCZDemoForms) {
      window.AIFORCZDemoForms.clearStatus(form);
    }
  };

  const openDemoModal = (trigger) => {
    if (!demoModal) return;

    lastDemoTrigger = trigger;
    demoModal.classList.add("is-open");
    demoModal.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("modal-open");
    body.classList.add("modal-open");
    clearDemoStatus();

    const firstInput = demoModal.querySelector(".demo-form input, .demo-form select, .demo-form textarea");
    if (firstInput) {
      firstInput.focus();
    }
  };

  const closeDemoModal = () => {
    if (!demoModal) return;

    demoModal.classList.remove("is-open");
    demoModal.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("modal-open");
    body.classList.remove("modal-open");

    if (lastDemoTrigger) {
      lastDemoTrigger.focus();
    }
  };

  demoOpenButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openDemoModal(button);
    });
  });

  if (demoCloseButton) {
    demoCloseButton.addEventListener("click", closeDemoModal);
  }

  if (demoModal) {
    demoModal.addEventListener("click", (event) => {
      if (event.target === demoModal) {
        closeDemoModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && demoModal && demoModal.classList.contains("is-open")) {
      closeDemoModal();
    }
  });

  const counters = document.querySelectorAll("[data-count]");
  counters.forEach((counter) => {
    counter.textContent = counter.dataset.count || counter.textContent;
  });
});
