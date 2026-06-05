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
  const demoForm = document.querySelector(".demo-form");
  const demoStatus = document.querySelector(".demo-status");
  const demoSubmit = document.querySelector(".demo-submit");
  let lastDemoTrigger = null;

  const setDemoStatus = (message, type = "success") => {
    if (!demoStatus) return;

    demoStatus.textContent = message;
    demoStatus.hidden = false;
    demoStatus.classList.toggle("is-error", type === "error");
    demoStatus.classList.toggle("is-success", type === "success");
  };

  const clearDemoStatus = () => {
    if (!demoStatus) return;

    demoStatus.textContent = "";
    demoStatus.hidden = true;
    demoStatus.classList.remove("is-error", "is-success");
  };

  const getDemoValue = (formData, key) => {
    const value = formData.get(key);
    return typeof value === "string" && value.trim() ? value.trim() : "Not provided";
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

  if (demoForm) {
    demoForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!demoForm.checkValidity()) {
        demoForm.reportValidity();
        setDemoStatus("Please enter a valid email address before sending.", "error");
        return;
      }

      const formData = new FormData(demoForm);
      const recipient = (demoForm.dataset.demoEmail || "contact@aiforcz.com").trim();
      const firstName = getDemoValue(formData, "firstName");
      const lastName = getDemoValue(formData, "lastName");
      const email = getDemoValue(formData, "email");
      const company = getDemoValue(formData, "company");
      const employees = getDemoValue(formData, "employees");
      const message = getDemoValue(formData, "message");
      const fullName = [firstName, lastName].filter((value) => value !== "Not provided").join(" ");

      const subject = `Book demo request${company !== "Not provided" ? ` - ${company}` : ""}`;
      const bodyLines = [
        "Hello AIFORCZ team,",
        "",
        "A visitor submitted a Book demo request from the landing page.",
        "",
        `Name: ${fullName || "Not provided"}`,
        `Email: ${email}`,
        `Company: ${company}`,
        `Employees: ${employees}`,
        "",
        "Message:",
        message,
        "",
        "Please follow up with them to schedule the demo."
      ];
      const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

      if (demoSubmit) {
        demoSubmit.textContent = "Opening email...";
      }

      window.location.href = mailtoLink;
      setDemoStatus(`Your email app should open now. Send the prepared email to ${recipient}.`, "success");

      window.setTimeout(() => {
        if (demoSubmit) {
          demoSubmit.textContent = "Book demo";
        }
      }, 900);
    });
  }

  const counters = document.querySelectorAll("[data-count]");
  counters.forEach((counter) => {
    counter.textContent = counter.dataset.count || counter.textContent;
  });
});
