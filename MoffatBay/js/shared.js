/**
 * Moffat Bay Lodge — shared page utilities and guest form helpers.
 *
 * Loaded before reservation.js or lookup.js by ordinary <script defer> tags.
 * No build tools or JS modules required. Reservation saving and lookup use Java/MySQL APIs.
 */
(() => {
    'use strict';
    const USER_STORAGE_KEY = 'mbl-current-user';
    // Room labels and displayed estimates; the Java API validates final availability and pricing.
    const rooms = {
        morel: {
            title: 'The Morel the Merrier',
            type: 'Two full beds',
            maxGuests: 4,
            price: 126.00,
            photo: '../images/room-double-full.png'
        },
        knotty: {
            title: 'The Knotty Pine',
            type: 'One queen bed',
            maxGuests: 2,
            price: 141.75,
            photo: '../images/room-queen.png'
        },
        hoots: {
            title: 'The Two Hoots',
            type: 'Two queen beds',
            maxGuests: 4,
            price: 157.50,
            photo: '../images/room-double-queen.png'
        },
        suite: {
            title: 'The Unbe-leaf-able Suite',
            type: 'One king bed',
            maxGuests: 2,
            price: 168.00,
            photo: '../images/room-king.png'
        }
    };
    const $ = selector => document.querySelector(selector);
    const currency = amount => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
    // Text is escaped before being inserted into any HTML template.
    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
    function isoDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    function daysFromToday(count) {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() + count);
        return isoDate(date);
    }
    function nextDay(dateString) {
        const date = new Date(`${dateString}T12:00:00`);
        date.setDate(date.getDate() + 1);
        return isoDate(date);
    }
    function formatDate(dateString) {
        return dateString
            ? new Date(`${dateString}T12:00:00`).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })
            : 'Choose a date';
    }
    function numberOfNights(checkin, checkout) {
        if (!checkin || !checkout)
            return 0;
        const from = Date.parse(`${checkin}T12:00:00`);
        const to = Date.parse(`${checkout}T12:00:00`);
        return Math.round((to - from) / 86400000);
    }
    const datesText = booking => `${formatDate(booking.checkin)} – ${formatDate(booking.checkout)}`;
    /**
     * Saves the registered user's profile in sessionStorage.
     * This is for form autofill, not authentication.
     */
    function setCurrentUser(user) {
        try {
            sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            return true;
        }
        catch (error) {
            console.error('Unable to save user profile:', error);
            return false;
        }
    }
    /**
     * Retrieves the registered user's profile.
     */
    function getCurrentUser() {
        try {
            const storedUser = sessionStorage.getItem(USER_STORAGE_KEY);
            if (!storedUser) {
                return null;
            }
            return JSON.parse(storedUser);
        }
        catch (error) {
            console.error('Unable to retrieve user profile:', error);
            return null;
        }
    }
    function initializeMenu() {
        const toggle = $('#menuToggle');
        const nav = $('#mainNav');
        if (!toggle || !nav)
            return;
        toggle.addEventListener('click', () => {
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!isOpen));
            nav.classList.toggle('is-open', !isOpen);
        });
    }
    window.MBL = Object.freeze({
        $,
        rooms,
        currency,
        escapeHtml,
        daysFromToday,
        nextDay,
        formatDate,
        numberOfNights,
        datesText,
        setCurrentUser,
        getCurrentUser
    });
    initializeMenu();
})();
