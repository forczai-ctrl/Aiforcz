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

  const isConfiguredValue = (value) => {
    return value && !value.startsWith("YOUR_");
  };

  const buildDemoEmailParams = ({ recipient, firstName, lastName, email, company, employees, message }) => {
    const fullName = [firstName, lastName].filter((value) => value !== "Not provided").join(" ");
    const submittedAt = new Date().toLocaleString();
    const subjectParts = [
      "Book Demo Request",
      fullName || email,
      company !== "Not provided" ? company : ""
    ].filter(Boolean);
    const subject = subjectParts.join(" | ");
    const bodyLines = [
      "BOOK DEMO REQUEST",
      "=================",
      "",
      `Submitted At: ${submittedAt}`,
      "Source: AIFORCZ Landing Page",
      "",
      "VISITOR DETAILS",
      "---------------",
      `Name: ${fullName || "Not provided"}`,
      `Email: ${email}`,
      `Company: ${company}`,
      `Employees: ${employees}`,
      "",
      "REQUEST MESSAGE",
      "---------------",
      message,
      "",
      "NEXT ACTION",
      "-----------",
      `Reply to the visitor at: ${email}`,
      "Schedule a demo call and share the meeting details."
    ];

    return {
      to_email: recipient,
      subject,
      from_name: fullName || email,
      first_name: firstName,
      last_name: lastName,
      user_email: email,
      reply_to: email,
      company_name: company,
      employees,
      user_message: message,
      submitted_at: submittedAt,
      email_body: bodyLines.join("\n")
    };
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
    demoForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!demoForm.checkValidity()) {
        demoForm.reportValidity();
        setDemoStatus("Please enter a valid email address before sending.", "error");
        return;
      }

      const formData = new FormData(demoForm);
      const recipient = (demoForm.dataset.demoEmail || "contact@aiforcz.com").trim();
      const publicKey = (demoForm.dataset.emailjsPublicKey || "").trim();
      const serviceId = (demoForm.dataset.emailjsServiceId || "").trim();
      const templateId = (demoForm.dataset.emailjsTemplateId || "").trim();
      const firstName = getDemoValue(formData, "firstName");
      const lastName = getDemoValue(formData, "lastName");
      const email = getDemoValue(formData, "email");
      const company = getDemoValue(formData, "company");
      const employees = getDemoValue(formData, "employees");
      const message = getDemoValue(formData, "message");

      if (!window.emailjs || !isConfiguredValue(publicKey) || !isConfiguredValue(serviceId) || !isConfiguredValue(templateId)) {
        setDemoStatus("EmailJS is not configured yet. Please add your EmailJS public key, service ID and template ID in this form.", "error");
        return;
      }

      const templateParams = buildDemoEmailParams({
        recipient,
        firstName,
        lastName,
        email,
        company,
        employees,
        message
      });

      if (demoSubmit) {
        demoSubmit.disabled = true;
        demoSubmit.textContent = "Sending...";
      }

      try {
        await window.emailjs.send(serviceId, templateId, templateParams, { publicKey });
        demoForm.reset();
        setDemoStatus("Thanks for requesting a demo. Our team will contact you soon.", "success");
      } catch (error) {
        setDemoStatus("Sorry, we could not send your request right now. Please try again or contact us directly.", "error");
      } finally {
        if (demoSubmit) {
          demoSubmit.disabled = false;
          demoSubmit.textContent = "Book demo";
        }
      }
    });
  }

  const counters = document.querySelectorAll("[data-count]");
  counters.forEach((counter) => {
    counter.textContent = counter.dataset.count || counter.textContent;
  });
});
