/** Lookup runs only on lookup.html. The page does not book or modify stays. */
(() => {
    'use strict';

    const {
        $, rooms, currency, escapeHtml, datesText,
        getReservations, sampleReservation
    } = window.MBL;

    function findReservation(event) {
        event.preventDefault();

        const reference = $('#lookupNumber').value.trim().toUpperCase();
        const email = $('#lookupEmail').value.trim().toLowerCase();
        const results = [...getReservations(), sampleReservation()];

        $('#lookupError').classList.add('hidden');
        $('#lookupResult').classList.add('hidden');

        if (!reference || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('Please enter your confirmation number and a valid email address.');
            return;
        }

        const booking = results.find(item =>
            item.id.toUpperCase() === reference && item.email.toLowerCase() === email
        );

        if (!booking) {
            showError('No matching reservation was found. Check your details.');
            return;
        }

        // Escape guest-provided text before constructing the result panel.
        $('#lookupResult').innerHTML = `
            <span class="lookup-status">✓ ${escapeHtml(booking.status)}</span>
            <h3>Found your island getaway!</h3>
            <p><strong>Reference:</strong> ${escapeHtml(booking.id)}</p>
            <p><strong>Guest:</strong> ${escapeHtml(`${booking.first} ${booking.last}`)}</p>
            <p><strong>Room:</strong> ${escapeHtml(rooms[booking.roomKey].title)}</p>
            <p><strong>Dates:</strong> ${escapeHtml(datesText(booking))}</p>
            <p><strong>Guests:</strong> ${Number(booking.guests)}</p>
            <p><strong>Subtotal:</strong> ${currency(booking.total)}</p>
        `;
        $('#lookupResult').classList.remove('hidden');
    }

    function showError(message) {
        $('#lookupError').textContent = message;
        $('#lookupError').classList.remove('hidden');
        $('#lookupResult').classList.add('hidden');
    }

    function fillSample() {
        const sample = sampleReservation();
        $('#lookupNumber').value = sample.id;
        $('#lookupEmail').value = sample.email;
        $('#lookupNumber').focus();
    }

    function initializePage() {
        $('#lookupForm').addEventListener('submit', findReservation);
        $('#fillLookup').addEventListener('click', fillSample);

        // Coming from the confirmation screen: prefill ONLY the reference from
        // the URL. Email is taken from tab-scoped demo storage when available.
        const reference = new URLSearchParams(location.search).get('reference');
        if (!reference) return;

        $('#lookupNumber').value = reference.toUpperCase();
        const saved = getReservations().find(item =>
            item.id.toUpperCase() === reference.toUpperCase()
        );
        if (saved) $('#lookupEmail').value = saved.email;
    }

    initializePage();
})();
