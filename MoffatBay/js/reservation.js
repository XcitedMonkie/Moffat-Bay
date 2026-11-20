/**
 * The reservation form, native on-page review <dialog>, and confirmation view.
 * All three stages live in reservation.html. The lookup has its OWN lookup.html.
 */
(() => {
    'use strict';
    const { $, rooms, currency, escapeHtml, daysFromToday, nextDay, formatDate, numberOfNights, datesText } = window.MBL;
    const dialog = $('#reviewDialog');
    const form = $('#bookingForm');
    let pendingBooking = null;
    let isSubmitting = false;
    function readForm() {
        const roomKey = $('#room').value;
        const room = rooms[roomKey];
        const checkin = $('#checkin').value;
        const checkout = $('#checkout').value;
        const nights = numberOfNights(checkin, checkout);
        return {
            roomKey,
            checkin,
            checkout,
            nights,
            guests: Number($('#guests').value),
            first: $('#first').value.trim(),
            last: $('#last').value.trim(),
            email: $('#email').value.trim().toLowerCase(),
            notes: '',
            total: room.price * nights
        };
    }
    function validate(booking) {
        const room = rooms[booking.roomKey];
        if (!booking.first)
            return 'Please enter your first name.';
        if (!booking.last)
            return 'Please enter your last name.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) {
            return 'Please enter a valid email address.';
        }
        if (!booking.checkin || !booking.checkout) {
            return 'Please choose both check-in and check-out dates.';
        }
        if (booking.checkin < daysFromToday(0)) {
            return 'Check-in cannot be in the past.';
        }
        if (booking.nights < 1) {
            return 'Check-out must be after check-in.';
        }
        if (booking.guests < 1 || booking.guests > room.maxGuests) {
            return `This room accommodates 1–${room.maxGuests} guests.`;
        }
        return '';
    }
    function showError(message) {
        const error = $('#formError');
        error.textContent = message;
        error.classList.remove('hidden');
        error.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    function setProgress(stage) {
        const activeStep = stage === 'booking' ? 1 : stage === 'review' ? 2 : 3;
        ['step1', 'step2', 'step3'].forEach((id, i) => {
            const element = $(`#${id}`);
            element.classList.toggle('on', i + 1 === activeStep);
            element.classList.toggle('done', i + 1 < activeStep);
            if (i + 1 === activeStep)
                element.setAttribute('aria-current', 'step');
            else
                element.removeAttribute('aria-current');
        });
    }
    // Crossfade between two images rather than flashing the sidebar blank.
    const photoLayers = [$('#asidePhotoA'), $('#asidePhotoB')];
    let visibleLayer = 1;
    let currentRoomPhoto = null;
    function updateRoomPhoto(roomKey) {
        if (roomKey === currentRoomPhoto)
            return;
        currentRoomPhoto = roomKey;
        const nextLayerIndex = 1 - visibleLayer;
        const nextPhoto = photoLayers[nextLayerIndex];
        nextPhoto.src = rooms[roomKey].photo;
        nextPhoto.alt = `Photo of ${rooms[roomKey].title}`;
        nextPhoto.classList.add('is-visible');
        photoLayers[visibleLayer].classList.remove('is-visible');
        visibleLayer = nextLayerIndex;
        $('#asidePhotoCaption').textContent = rooms[roomKey].title;
    }
    function updateSidebar() {
        const booking = readForm();
        const room = rooms[booking.roomKey];
        $('#capacityHelp').textContent =
            `Sleeps up to ${room.maxGuests} guests · Pet-friendly`;
        $('#asideRoom').textContent = room.title;
        $('#asideDates').textContent = datesText(booking);
        $('#asideGuests').textContent =
            `${booking.guests} ${booking.guests === 1 ? 'guest' : 'guests'}`;
        $('#asideNights').textContent = booking.nights > 0
            ? `${booking.nights} ${booking.nights === 1 ? 'night' : 'nights'}`
            : 'Check your dates';
        $('#asideRate').textContent = `${currency(room.price)} / night`;
        $('#asideTotal').textContent = booking.nights > 0
            ? currency(booking.total) : '—';
        updateRoomPhoto(booking.roomKey);
    }
    function updateGuestLimit() {
        const guestSelect = $('#guests');
        const room = rooms[$('#room').value];
        const previousCount = Number(guestSelect.value) || 2;
        guestSelect.replaceChildren();
        for (let guests = 1; guests <= room.maxGuests; guests++) {
            const option = new Option(`${guests} ${guests === 1 ? 'guest' : 'guests'}`, String(guests));
            guestSelect.add(option);
        }
        guestSelect.value = String(Math.min(previousCount, room.maxGuests));
        updateSidebar();
    }
    function detail(label, value) {
        return `
            <div>
                <div class="detail-label">${escapeHtml(label)}</div>
                <div class="detail-value">${escapeHtml(value)}</div>
            </div>
        `;
    }
    function reviewMarkup(booking) {
        const room = rooms[booking.roomKey];
        const guestText = `${booking.guests} ${booking.guests === 1 ? 'guest' : 'guests'}`;
        return `
            <span class="eyebrow">Step two · review your stay</span>
            <h2 id="dialogTitle" tabindex="-1">Before you unpack…</h2>
            <p class="review-intro">
                Take a final look before confirming. Your room hasn't been reserved yet.
            </p>

            <div class="review-hero">
                <img src="../images/icons/room-bed.svg" alt="" class="review-bed-icon">

                <div class="review-room-details">
                    <span class="eyebrow">Your chosen hideaway</span>
                    <h3>${escapeHtml(room.title)}</h3>
                    <p class="small muted">
                        ${escapeHtml(room.type)} · Pet-friendly · Up to ${room.maxGuests} guests
                    </p>
                </div>
            </div>

            <div class="summary-grid">
                ${detail('Check-in', formatDate(booking.checkin))}
                ${detail('Check-out', formatDate(booking.checkout))}
                ${detail('Length of stay', `${booking.nights} nights`)}
                ${detail('Guests', guestText)}
                ${detail('Reservation under', `${booking.first} ${booking.last}`)}
                ${detail('Email address', booking.email)}
                ${booking.notes ? detail('Special requests', booking.notes) : ''}
            </div>

            <div class="total-row">
                <div>
                    <div class="detail-label">Estimated subtotal</div>
                    <div class="small muted">
                        ${booking.nights} nights × ${currency(room.price)} / night
                    </div>
                </div>
                <strong>${currency(booking.total)}</strong>
            </div>

            <div class="review-actions">
                <button class="btn-quiet" id="editDetails" type="button">
                    ← Edit my details
                </button>
                <button class="btn btn-primary" id="confirmBooking" type="button">
                    Confirm reservation →
                </button>
            </div>

            <p class="dialog-processing hidden" id="dialogProcessing" role="status">
                <span class="spinner" aria-hidden="true"></span>
                Saving your reservation…
            </p>
        `;
    }
    function showReview(event) {
        event.preventDefault();
        const booking = readForm();
        const problem = validate(booking);
        if (problem) {
            showError(problem);
            return;
        }
        $('#formError').classList.add('hidden');
        pendingBooking = booking;
        $('#reviewModalCard').innerHTML = reviewMarkup(booking);
        dialog.showModal();
        setProgress('review');
        dialog.scrollTop = 0;
        $('#dialogTitle').focus({ preventScroll: true });
    }
    function closeReview() {
        if (!isSubmitting && dialog.open)
            dialog.close();
    }
    // Change banner CONTENT only. Its original classes, colors, fonts, and
    // torn-paper decoration remain controlled by the shared CSS.
    function updateBookingBanner(stage) {
        const confirmed = stage === 'confirmed';
        $('#bannerEyebrow').textContent = confirmed
            ? 'YOUR ISLAND ADVENTURE AWAITS'
            : 'A LITTLE MORE TIME AWAY';
        $('#pageTitle').textContent = confirmed
            ? 'Your stay is confirmed!'
            : 'Make yourself at home.';
        $('#bannerDescription').textContent = confirmed
            ? "Your getaway to Moffat Bay is officially on the calendar. We can't wait to welcome you!"
            : 'Choose your dates, review the little details, and find your place among the trees.';
        // Remove any state-specific inline styling before changing stages.
        for (const element of [$('#bannerEyebrow'), $('#pageTitle'), $('#bannerDescription')]) {
            element.removeAttribute('style');
        }
    }
    function showConfirmation(booking) {
        const room = rooms[booking.roomKey];
        $('#confirmationReference').textContent = booking.id;
        $('#confirmedGuest').textContent = `${booking.first} ${booking.last}`;
        $('#confirmedRoom').textContent = room.title;
        $('#confirmedStay').textContent = datesText(booking);
        $('#confirmedTotal').textContent = currency(booking.total);
        $('#bookingView').classList.add('hidden');
        $('#confirmationView').classList.remove('hidden');
        document.body.classList.add('confirmed-page');
        updateBookingBanner('confirmed');
        document.title = 'Reservation Confirmed | Moffat Bay Lodge';
        setProgress('confirmed');
        window.scrollTo({ top: 0, behavior: 'instant' });
        $('#confirmationTitle').focus({ preventScroll: true });
    }
    async function confirmReservation() {
        if (!pendingBooking || isSubmitting || !dialog.open)
            return;
        const current = readForm();
        const issue = validate(current);
        if (issue) {
            closeReview();
            showError(issue);
            return;
        }
        if (JSON.stringify(current) !== JSON.stringify(pendingBooking)) {
            closeReview();
            showError('Reservation details changed. Please review again.');
            return;
        }
        isSubmitting = true;
        $('#confirmBooking').disabled = true;
        $('#editDetails').disabled = true;
        $('#closeDialog').disabled = true;
        $('#confirmBooking').textContent = 'Confirming…';
        $('#dialogProcessing').classList.remove('hidden');
        dialog.setAttribute('aria-busy', 'true');
        try {
            const result = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    roomId: pendingBooking.roomKey,
                    guests: pendingBooking.guests,
                    checkIn: pendingBooking.checkin,
                    checkOut: pendingBooking.checkout
                })
            });
            const data = await result.json();
            if (!result.ok)
                throw new Error(data.error || 'Could not confirm your reservation.');
            const r = data.reservation;
            const confirmation = {
                ...pendingBooking,
                id: r.confirmationCode,
                total: Number(r.totalPrice),
                status: r.status
            };
            dialog.close();
            showConfirmation(confirmation);
        }
        catch (err) {
            dialog.close();
            showError(err.message || 'Reservation could not be saved.');
        }
        finally {
            isSubmitting = false;
            dialog.removeAttribute('aria-busy');
            $('#confirmBooking').disabled = false;
            $('#editDetails').disabled = false;
            $('#closeDialog').disabled = false;
            $('#confirmBooking').textContent = 'Confirm Reservation';
            $('#dialogProcessing').classList.add('hidden');
        }
    }
    function resetReservation() {
        if (isSubmitting)
            return;
        closeReview();
        form.reset();
        $('#checkin').value = daysFromToday(14);
        $('#checkout').value = daysFromToday(17);
        $('#checkin').min = daysFromToday(0);
        $('#checkout').min = nextDay($('#checkin').value);
        $('#formError').classList.add('hidden');
        $('#confirmationView').classList.add('hidden');
        $('#bookingView').classList.remove('hidden');
        document.body.classList.remove('confirmed-page');
        updateBookingBanner('booking');
        document.title = 'Book Your Stay | Moffat Bay Lodge';
        pendingBooking = null;
        updateGuestLimit();
        setProgress('booking');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function updateCheckoutMinimum() {
        const checkin = $('#checkin').value;
        $('#checkout').min = checkin ? nextDay(checkin) : daysFromToday(1);
        if ($('#checkout').value <= checkin) {
            $('#checkout').value = $('#checkout').min;
        }
        updateSidebar();
    }
    function initializePage() {
        const selectedRoom = new URLSearchParams(window.location.search).get("room");
        if (selectedRoom && Object.hasOwn(rooms, selectedRoom))
            $("#room").value = selectedRoom;
        $('#checkin').min = daysFromToday(0);
        $('#checkin').value = daysFromToday(14);
        $('#checkout').min = nextDay($('#checkin').value);
        $('#checkout').value = daysFromToday(17);
        updateGuestLimit();
        setProgress('booking');
        $('#room').addEventListener('change', updateGuestLimit);
        $('#checkin').addEventListener('change', updateCheckoutMinimum);
        ['checkout', 'guests', 'first', 'last', 'email'].forEach(id => $(`#${id}`).addEventListener('input', updateSidebar));
        form.addEventListener('submit', showReview);
        $('#closeDialog').addEventListener('click', closeReview);
        $('#confirmationRestart').addEventListener('click', resetReservation);
        $('#confirmationLookup').addEventListener('click', () => {
            const id = $('#confirmationReference').textContent;
            window.location.href = `lookup.html?reference=${encodeURIComponent(id)}`;
        });
        // Click outside the card to close. Esc never closes while saving.
        dialog.addEventListener('click', event => {
            if (event.target === dialog)
                closeReview();
        });
        dialog.addEventListener('cancel', event => {
            if (isSubmitting)
                event.preventDefault();
        });
        dialog.addEventListener('close', () => {
            if (!document.body.classList.contains('confirmed-page')) {
                setProgress('booking');
            }
        });
        $('#reviewModalCard').addEventListener('click', event => {
            if (event.target.closest('#editDetails')) {
                closeReview();
                $('#checkin').focus({ preventScroll: true });
                $('#formSheet').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            if (event.target.closest('#confirmBooking'))
                confirmReservation();
        });
    }
    initializePage();
})();
