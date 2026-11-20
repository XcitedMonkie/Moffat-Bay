/** Authenticated guest history*/
(() => {
    'use strict';
    const { $, escapeHtml, formatDate, currency } = window.MBL;
    let all = [];
    function renderCard(r) {
        const reference = r.confirmationCode || `Reservation #${r.reservationId}`;
        const today = new Date().toISOString().slice(0, 10);
        const past = r.checkOut < today;
        const label = r.status === 'Cancelled' ? 'Cancelled' : past ? 'Past stay' : r.status;
        return `<article class="my-res-card">
     <div class="my-res-head"><div><span class="eyebrow">${escapeHtml(reference)}</span><h3>${escapeHtml(r.roomName)}</h3></div>
     <span class="lookup-status">${escapeHtml(label)}</span></div>
     <div class="lookup-detail-grid"><p><strong>Check-in</strong><span>${escapeHtml(formatDate(r.checkIn))}</span></p>
     <p><strong>Check-out</strong><span>${escapeHtml(formatDate(r.checkOut))}</span></p>
     <p><strong>Room size</strong><span>${escapeHtml(r.roomSize || 'See room details')}</span></p>
     <p><strong>Guests</strong><span>${Number(r.guests)}</span></p></div>
     <div class="my-res-foot"><span>Reservation total</span><strong>${currency(Number(r.totalPrice))}</strong></div>
   </article>`;
    }
    function render() {
        const filter = $('#historySearch').value.trim().toLowerCase();
        const results = all.filter(r => !filter || String(r.confirmationCode || '').toLowerCase().includes(filter) || String(r.reservationId).includes(filter));
        const today = new Date().toISOString().slice(0, 10);
        const future = results.filter(r => r.checkOut >= today);
        const past = results.filter(r => r.checkOut < today);
        // Only display headings for categories that actually have reservations.
        $('#upcomingSection').hidden = future.length === 0;
        $('#previousSection').hidden = past.length === 0;
        $('#upcomingList').innerHTML = future.map(renderCard).join('');
        $('#previousList').innerHTML = past.map(renderCard).join('');
        $('#historyCount').textContent = `${results.length} ${results.length === 1 ? 'reservation' : 'reservations'}`;
        // Differentiate a genuinely empty account from a search with no matches.
        $('#historyEmpty').hidden = all.length > 0;
        $('#historyNoMatch').hidden = all.length === 0 || results.length > 0;
    }
    async function init() {
        try {
            const response = await fetch('/api/reservations/mine', { credentials: 'same-origin', cache: 'no-store' });
            if (response.status === 401) {
                location.replace('/login.html?next=' + encodeURIComponent('/reservation-test/my-reservations.html'));
                return;
            }
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || 'Unable to load bookings.');
            all = Array.isArray(data.reservations) ? data.reservations : [];
            $('#historyLoading').hidden = true;
            $('#historyContent').hidden = false;
            render();
        }
        catch (err) {
            $('#historyLoading').textContent = err.message || 'Unable to load bookings.';
        }
    }
    $('#historySearch').addEventListener('input', render);
    init();
})();
