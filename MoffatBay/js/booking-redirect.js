(() => {
    const search = new URLSearchParams(location.search);
    const requested = search.get('next') || '';
    let next = '/reservation-test/reservation.html';
    try {
        const parsed = new URL(requested, location.origin);
        if (parsed.origin === location.origin && ['/reservation-test/reservation.html', '/reservation-test/my-reservations.html'].includes(parsed.pathname))
            next = parsed.pathname + parsed.search;
    }
    catch (_) { /* use safe default */ }
    window.MBLBookingRedirect = Object.freeze({
        booking: search.get('booking') === '1', returning: !!requested, next,
        loginUrl: '/login.html?booking=1&next=' + encodeURIComponent(next),
        registerUrl: '/register.html?booking=1&next=' + encodeURIComponent(next)
    });
})();
