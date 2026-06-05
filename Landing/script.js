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
        setDemoStatus("Please fill all required fields before sending.", "error");
        return;
      }

      const formData = new FormData(demoForm);

      const adminEmail = (demoForm.dataset.adminEmail || "forczai@gmail.com").trim();
      const publicKey = (demoForm.dataset.emailjsPublicKey || "").trim();
      const serviceId = (demoForm.dataset.emailjsServiceId || "").trim();

      const adminTemplateId = (demoForm.dataset.adminTemplateId || "").trim();
      const customerTemplateId = (demoForm.dataset.customerTemplateId || "").trim();

      const firstName = getDemoValue(formData, "firstName");
      const lastName = getDemoValue(formData, "lastName");
      const fullName = [firstName, lastName]
        .filter((value) => value !== "Not provided")
        .join(" ");

      const email = getDemoValue(formData, "email");
      const phone = getDemoValue(formData, "phone");
      const company = getDemoValue(formData, "company");
      const employees = getDemoValue(formData, "employees");
      const message = getDemoValue(formData, "message");
      const submittedAt = new Date().toLocaleString();

      if (
        !window.emailjs ||
        !isConfiguredValue(publicKey) ||
        !isConfiguredValue(serviceId) ||
        !isConfiguredValue(adminTemplateId) ||
        !isConfiguredValue(customerTemplateId)
      ) {
        setDemoStatus(
          "EmailJS is not configured yet. Please check public key, service ID, admin template ID and customer template ID.",
          "error"
        );
        return;
      }

      const templateParams = {
        // common fields
        name: fullName || email,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        company: company,
        employees: employees,
        message: message,
        submitted_at: submittedAt,

        // admin template TO field
        admin_email: adminEmail,

        // customer template TO field
        to_email: email,

        // reply option
        reply_to: email,

        // optional aliases for your old template
        user_email: email,
        company_name: company,
        user_message: message
      };

      if (demoSubmit) {
        demoSubmit.disabled = true;
        demoSubmit.textContent = "Sending...";
      }

      setDemoStatus("Sending your demo request...", "success");

      try {
        // 1. Send alert mail to admin team
        await window.emailjs.send(
          serviceId,
          adminTemplateId,
          templateParams,
          { publicKey }
        );

        // 2. Send thank-you mail to customer
        await window.emailjs.send(
          serviceId,
          customerTemplateId,
          templateParams,
          { publicKey }
        );

        demoForm.reset();
        setDemoStatus("Thanks for requesting a demo. Our team will contact you soon.", "success");
      } catch (error) {
        console.error("EmailJS Error:", error);
        setDemoStatus(
          "Sorry, we could not send your request right now. Please try again or contact us directly.",
          "error"
        );
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