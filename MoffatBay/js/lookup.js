/** Public lookup: exact confirmation code and matching booking email. */
(() => {
    'use strict';
    const { $, escapeHtml, currency, formatDate, rooms } = window.MBL;
    function display(r) {
        const reference = r.confirmationCode || r.id;
        const name = r.roomName || rooms[r.roomKey]?.title || 'Moffat Bay Lodge room';
        const size = r.roomSize || rooms[r.roomKey]?.size || 'See room details';
        const checkIn = r.checkIn || r.checkin, checkOut = r.checkOut || r.checkout;
        $('#lookupResult').innerHTML = `<span class="lookup-status">${escapeHtml(r.status || 'Confirmed')}</span>
      <h3>${escapeHtml(name)}</h3><p><strong>Confirmation:</strong> ${escapeHtml(reference)}</p>
      <div class="lookup-detail-grid"><p><strong>Room size</strong><span>${escapeHtml(size)}</span></p>
      <p><strong>Guests</strong><span>${Number(r.guests)}</span></p>
      <p><strong>Check-in</strong><span>${escapeHtml(formatDate(checkIn))}</span></p>
      <p><strong>Check-out</strong><span>${escapeHtml(formatDate(checkOut))}</span></p></div>
      <p><strong>Total:</strong> ${currency(Number(r.totalPrice ?? r.total))}</p>`;
        $('#lookupResult').classList.remove('hidden');
    }
    function error(text) { $('#lookupError').textContent = text; $('#lookupError').classList.remove('hidden'); $('#lookupResult').classList.add('hidden'); }
    async function submit(ev) {
        ev.preventDefault();
        $('#lookupError').classList.add('hidden');
        $('#lookupResult').classList.add('hidden');
        const reference = $('#lookupNumber').value.trim().toUpperCase();
        const email = $('#lookupEmail').value.trim().toLowerCase();
        if (!reference || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return error('Enter your confirmation number and booking email address.');
        const button = $('#lookupForm button[type="submit"]');
        button.disabled = true;
        button.textContent = 'Searching…';
        try {
            const res = await fetch('/api/reservations/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference, email })
            });
            const json = await res.json();
            if (!res.ok)
                throw new Error(json.error || 'Reservation not found');
            display(json.reservation);
        }
        catch (err) {
            error(err.message || 'Unable to complete lookup.');
        }
        finally {
            button.disabled = false;
            button.textContent = 'Find reservation →';
        }
    }
    $('#lookupForm').addEventListener('submit', submit);
    const q = new URLSearchParams(location.search);
    if (q.has('reference'))
        $('#lookupNumber').value = q.get('reference').slice(0, 50);
})();
