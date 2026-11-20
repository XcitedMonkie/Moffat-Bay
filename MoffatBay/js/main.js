const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        mainNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
    }
});
window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
        mainNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
    }
});
document.addEventListener("click", (event) => {
    if (mainNav.classList.contains("is-open") &&
        !event.target.closest(".site-header")) {
        mainNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
    }
});
/* ========================================
   ROOM DETAILS POPUP
======================================== */
const roomPresentation = {
    morel: {
        name: "The Morel the Merrier",
        type: "Double Full Beds",
        image: "images/room-double-full.png",
        alt: "Cozy lodge room featuring two full beds",
        beds: "2 Full Beds",
        size: "300 sq. ft.",
    },
    pine: {
        name: "The Knotty Pine",
        type: "Queen",
        image: "images/room-queen.png",
        alt: "Comfortable queen room with a cozy bedspread",
        beds: "1 Queen Bed",
        size: "260 sq. ft.",
    },
    hoots: {
        name: "The Two Hoots",
        type: "Double Queen Beds",
        image: "images/room-double-queen.png",
        alt: "Spacious lodge room featuring two queen beds",
        beds: "2 Queen Beds",
        size: "380 sq. ft.",
    },
    suite: {
        name: "The Unbe-leaf-able Suite",
        type: "King",
        image: "images/room-king.png",
        alt: "Rustic lodge suite featuring a king bed",
        beds: "1 King Bed",
        size: "340 sq. ft.",
    }
};
// Room names link the existing visual assets to the team's database rows.
const rooms = {};
const roomStatus = document.querySelector("#room-status");
async function loadRooms() {
    try {
        const response = await fetch("/api/room-types");
        if (!response.ok)
            throw new Error("Room catalog unavailable");
        const catalog = await response.json();
        const priceFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
        for (const button of roomButtons) {
            const key = button.dataset.room;
            const presentation = roomPresentation[key];
            const row = catalog.find(item => item.typeName === presentation.name);
            const card = button.closest(".room-card");
            if (!row) {
                card.hidden = true;
                card.style.display = "none";
                continue;
            }
            const price = priceFormat.format(row.basePrice) + " / night";
            rooms[key] = { ...presentation, name: row.typeName, description: row.description ?? "", guests: `Up to ${row.maxGuest} Guests`, price, roomTypeId: row.roomTypeId };
            card.querySelector(".room-name").textContent = row.typeName.toUpperCase();
            card.querySelector(".room-card-content p").textContent = price;
            button.disabled = false;
        }
        roomStatus.textContent = Object.keys(rooms).length ? "" : "No accommodations are currently listed.";
    }
    catch (error) {
        roomStatus.textContent = "Room details are temporarily unavailable. Please try refreshing the page.";
        console.error(error);
    }
}
const roomModal = document.querySelector("#room-modal");
const roomButtons = document.querySelectorAll(".room-details-btn");
const closeRoomModal = document.querySelector(".room-modal-close");
roomButtons.forEach(button => { button.disabled = true; });
loadRooms();
// open the popup when view details is clicked
roomButtons.forEach((button) => {
    button.addEventListener("click", () => {
        // find which room was clicked
        const roomId = button.dataset.room;
        const room = rooms[roomId];
        if (!room)
            return;
        // update the popup with that room's information
        document.querySelector("#modal-room-name").textContent = room.name;
        document.querySelector("#modal-room-type").textContent = room.type;
        document.querySelector("#modal-room-description").textContent = room.description;
        document.querySelector("#modal-room-beds").textContent = room.beds;
        document.querySelector("#modal-room-guests").textContent = room.guests;
        document.querySelector("#modal-room-size").textContent = room.size;
        document.querySelector("#modal-room-price").textContent = room.price;
        // update the room photo
        const roomImage = document.querySelector("#modal-room-image");
        roomImage.src = room.image;
        roomImage.alt = room.alt;
        // Pass the real database ID to the booking page. The prototype also needs its legacy key.
        const bookingKey = roomId === "pine" ? "knotty" : roomId;
        document.querySelector(".room-modal-book").href = `reservation-test/reservation.html?roomTypeId=${encodeURIComponent(room.roomTypeId)}&room=${encodeURIComponent(bookingKey)}`;
        roomModal.showModal();
    });
});
closeRoomModal.addEventListener("click", () => {
    roomModal.close();
});
roomModal.addEventListener("click", (event) => {
    if (event.target === roomModal) {
        roomModal.close();
    }
});
