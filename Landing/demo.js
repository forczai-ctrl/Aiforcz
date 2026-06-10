(() => {
  const DEFAULT_SUBMIT_TEXT = "Submit Request";

  const getValue = (formData, key) => {
    const value = formData.get(key);
    return typeof value === "string" && value.trim() ? value.trim() : "Not provided";
  };

  const isConfiguredValue = (value) => value && !value.startsWith("YOUR_");

  const findStatus = (form) => form.querySelector("[data-demo-status], .demo-status");

  const findSubmit = (form) => form.querySelector("[data-demo-submit], .demo-submit, button[type='submit']");

  const setStatus = (form, message, type = "success") => {
    const status = findStatus(form);
    if (!status) return;

    status.textContent = message;
    status.hidden = false;
    status.classList.toggle("is-error", type === "error");
    status.classList.toggle("is-success", type === "success");
  };

  const clearStatus = (form) => {
    const status = findStatus(form);
    if (!status) return;

    status.textContent = "";
    status.hidden = true;
    status.classList.remove("is-error", "is-success");
  };

  const buildTemplateParams = (form, formData) => {
    const firstName = getValue(formData, "firstName");
    const lastName = getValue(formData, "lastName");
    const fullName = [firstName, lastName]
      .filter((value) => value !== "Not provided")
      .join(" ");
    const email = getValue(formData, "email");
    const company = getValue(formData, "company");
    const message = getValue(formData, "message");

    return {
      name: fullName || email,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: getValue(formData, "phone"),
      company,
      company_name: company,
      country: getValue(formData, "country"),
      job_title: getValue(formData, "jobTitle"),
      industry: getValue(formData, "industry"),
      interest: getValue(formData, "interest"),
      employees: getValue(formData, "employees"),
      consent: formData.get("consent") ? "Yes" : "Not provided",
      message,
      user_message: message,
      submitted_at: new Date().toLocaleString(),
      form_source: form.dataset.formSource || "Book Demo",
      admin_email: (form.dataset.adminEmail || "forczai@gmail.com").trim(),
      to_email: email,
      reply_to: email,
      user_email: email
    };
  };

  const setupForm = (form) => {
    if (!form || form.dataset.demoReady === "true") return;

    const submit = findSubmit(form);
    const defaultHtml = submit ? submit.innerHTML.trim() || DEFAULT_SUBMIT_TEXT : DEFAULT_SUBMIT_TEXT;
    form.dataset.demoReady = "true";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        setStatus(form, "Please fill all required fields before sending.", "error");
        return;
      }

      const publicKey = (form.dataset.emailjsPublicKey || "").trim();
      const serviceId = (form.dataset.emailjsServiceId || "").trim();
      const adminTemplateId = (form.dataset.adminTemplateId || "").trim();
      const customerTemplateId = (form.dataset.customerTemplateId || "").trim();

      if (
        !window.emailjs ||
        !isConfiguredValue(publicKey) ||
        !isConfiguredValue(serviceId) ||
        !isConfiguredValue(adminTemplateId) ||
        !isConfiguredValue(customerTemplateId)
      ) {
        setStatus(
          form,
          "EmailJS is not configured yet. Please check public key, service ID, admin template ID and customer template ID.",
          "error"
        );
        return;
      }

      const templateParams = buildTemplateParams(form, new FormData(form));

      if (submit) {
        submit.disabled = true;
        submit.textContent = "Sending...";
      }

      setStatus(form, "Sending your demo request...", "success");

      try {
        await window.emailjs.send(serviceId, adminTemplateId, templateParams, { publicKey });
        await window.emailjs.send(serviceId, customerTemplateId, templateParams, { publicKey });

        form.reset();
        setStatus(form, "Thanks for requesting a demo. Our team will contact you soon.", "success");
      } catch (error) {
        console.error("EmailJS Error:", error);
        setStatus(
          form,
          "Sorry, we could not send your request right now. Please try again or contact us directly.",
          "error"
        );
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.innerHTML = defaultHtml;
          if (window.lucide) {
            window.lucide.createIcons();
          }
        }
      }
    });
  };

  const setupAll = () => {
    document.querySelectorAll("[data-demo-form], #bookDemoForm, .demo-form").forEach(setupForm);
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) {
      window.lucide.createIcons();
    }

    setupAll();
  });

  window.AIFORCZDemoForms = {
    clearStatus,
    setupAll,
    setupForm
  };
})();
