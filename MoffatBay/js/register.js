/* Moffat Bay Lodge — user registration logic.
*
* Depends on window.MBL from shared.js.
* Sends credentials to the Java REST API (/api/guests/register)
* and stores the returned profile in sessionStorage for checkout auto-fill.
*/
(() => {
    'use strict';
    const { $, escapeHtml } = window.MBL;
    const redirect = window.MBLBookingRedirect;
    if (redirect?.booking) {
        $('#bookingNotice').hidden = false;
        document.querySelector('.auth-switch a[href="login.html"]').href = redirect.loginUrl;
    }
    function showStatus(message, isError = true) {
        const box = $('#regStatus');
        if (!box)
            return;
        box.className = `status-box ${isError ? 'is-error' : 'is-success'}`;
        box.innerHTML = message;
    }
    function validateForm({ first, last, email, phone, password, confirm }) {
        if (!first || !last)
            return 'Please enter both your first and last name.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return 'Please enter a valid email address.';
        if (phone.replace(/\D/g, '').length < 10)
            return 'Please enter a valid 10-digit phone number.';
        if (password.length < 8)
            return 'Password must be at least 8 characters long.';
        if (password !== confirm)
            return 'Passwords do not match.';
        return null;
    }
    function initRegistration() {
        const form = $('#registrationForm');
        if (!form)
            return;
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const payload = {
                first: $('#firstName').value.trim(),
                last: $('#lastName').value.trim(),
                email: $('#email').value.trim(),
                phone: $('#phone').value.trim(),
                password: $('#password').value,
                confirm: $('#confirmPassword').value
            };
            const error = validateForm(payload);
            if (error) {
                showStatus(escapeHtml(error), true);
                return;
            }
            try {
                const response = await fetch('/api/guests/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        first: payload.first,
                        last: payload.last,
                        email: payload.email,
                        phone: payload.phone,
                        password: payload.password
                    })
                });
                const data = await response.json();
                if (!response.ok) {
                    showStatus(escapeHtml(data.error || 'Registration failed.'), true);
                    return;
                }
                // Save the real database guest profile for checkout auto-fill
                if (window.MBL.setCurrentUser) {
                    window.MBL.setCurrentUser({
                        id: data.guestId,
                        first: data.first,
                        last: data.last,
                        email: data.email,
                        phone: data.phone
                    });
                }
                window.location.replace(redirect?.returning ? redirect.next : '/index.html');
            }
            catch (err) {
                showStatus('Unable to reach the server. Please check your connection and try again.', true);
                console.error(err);
            }
        });
    }
    initRegistration();
})();
