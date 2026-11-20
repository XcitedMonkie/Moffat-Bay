
document.addEventListener("DOMContentLoaded", () => {

    // Contact group
    const recipients = [
        "dfryer@my365.bellevue.edu",
        "abrock@my365.bellevue.edu",
        "vespino@my365.bellevue.edu",
        "jfontus@my365.bellevue.edu"
    ];

    const savedData = sessionStorage.getItem("contactPreview");

    if (!savedData) {
        document.getElementById("previewMessage").textContent =
            "No contact message was found.";
        return;
    }

    const contactData = JSON.parse(savedData);

    document.getElementById("previewTo").textContent =
        recipients.join(", ");

    // Get the current date and time
    const now = new Date();

    document.getElementById("currentDateTime").textContent =
        now.toLocaleString();

    document.getElementById("previewName").textContent =
        contactData.name;

    document.getElementById("previewEmail").textContent =
        contactData.email;

    document.getElementById("previewMessage").textContent =
        contactData.message;

});
