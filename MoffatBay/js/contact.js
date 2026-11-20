
document.addEventListener("DOMContentLoaded", () => {

    const contactForm = document.getElementById("contactForm");

    if (!contactForm) {
        return;
    }

    contactForm.addEventListener("submit", function(event) {

        event.preventDefault();

        // The form's Information
        const contactData = {
            name: document.getElementById("contactName").value.trim(),
            email: document.getElementById("contactEmail").value.trim(),
            message: document.getElementById("contactMessage").value.trim()
        };

        // Putting in some validation that the fields are filled out
        if (!contactData.name || !contactData.email || !contactData.message) {
            alert("Please complete all fields.");
            return;
        }

        // Store the contact information temporarily
        sessionStorage.setItem(
            "contactPreview",
            JSON.stringify(contactData)
        );

        // As this is being ran locally this is a temp preview file that would be replaced with the logic to send the email directly to PR team
        window.location.href = "contact-preview.html";

    });

});
