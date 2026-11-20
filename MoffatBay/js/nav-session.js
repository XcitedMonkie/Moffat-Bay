(() => {
    'use strict';
    async function init() {
        const anchor = document.getElementById('loginLink');
        if (!anchor)
            return;
        try {
            const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
            if (!response.ok)
                return;
            const s = await response.json();
            if (!s.loggedIn || !s.firstName)
                return;
            const wrap = document.createElement('div');
            wrap.className = 'account-nav';
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'account-nav-toggle';
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-haspopup', 'true');
            button.textContent = `Welcome, ${s.firstName}! ▾`;
            const menu = document.createElement('div');
            menu.className = 'account-nav-dropdown';
            menu.hidden = true;
            const mine = document.createElement('a');
            mine.href = '/reservation-test/my-reservations.html';
            mine.textContent = 'My Reservations';
            const lookup = document.createElement('a');
            lookup.href = '/reservation-test/lookup.html';
            lookup.textContent = 'Find a Reservation';
            const logout = document.createElement('button');
            logout.type = 'button';
            logout.textContent = 'Log Out';
            const err = document.createElement('p');
            err.setAttribute('role', 'alert');
            err.hidden = true;
            menu.append(mine, lookup, logout, err);
            wrap.append(button, menu);
            anchor.replaceWith(wrap);
            const close = () => { menu.hidden = true; button.setAttribute('aria-expanded', 'false'); };
            button.addEventListener('click', () => { const show = menu.hidden; menu.hidden = !show; button.setAttribute('aria-expanded', String(show)); });
            document.addEventListener('pointerdown', e => { if (!wrap.contains(e.target))
                close(); });
            wrap.addEventListener('keydown', e => { if (e.key === 'Escape') {
                close();
                button.focus();
            } });
            logout.addEventListener('click', async () => {
                logout.disabled = true;
                logout.textContent = 'Logging out…';
                try {
                    const res = await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
                    if (!res.ok)
                        throw new Error('Failed');
                    sessionStorage.removeItem('mbl-current-user');
                    location.assign('/index.html');
                }
                catch (_) {
                    err.textContent = 'Could not log out. Please try again.';
                    err.hidden = false;
                    logout.disabled = false;
                    logout.textContent = 'Log Out';
                }
            });
        }
        catch (_) { /* Keep Login link visible when session service is unreachable. */ }
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
