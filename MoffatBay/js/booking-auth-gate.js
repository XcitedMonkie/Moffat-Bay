(() => {
    fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' })
        .then(r => { if (!r.ok)
        throw new Error('Session unavailable'); return r.json(); })
        .then(s => {
        if (s.loggedIn)
            document.documentElement.classList.remove('booking-auth-pending');
        else
            location.replace('/login.html?booking=1&next=' + encodeURIComponent(location.pathname + location.search));
    })
        .catch(() => { location.replace('/login.html?booking=1&next=' + encodeURIComponent(location.pathname + location.search)); });
})();
