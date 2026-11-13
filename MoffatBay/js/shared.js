/**
 * Moffat Bay Lodge — shared reservation prototype data and utilities.
 *
 * Loaded before reservation.js or lookup.js by ordinary <script defer> tags.
 * No build tools or JS modules required: opening index.html directly works.
 *
 * This is NOT an API, database, or production reservation system.
 */
(() => {
    'use strict';

    const STORAGE_KEY = 'mbl-demo-reservations-v4';

    // Rates are illustrative and are NOT linked to an availability system.
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
        if (!checkin || !checkout) return 0;
        const from = Date.parse(`${checkin}T12:00:00`);
        const to = Date.parse(`${checkout}T12:00:00`);
        return Math.round((to - from) / 86400000);
    }

    const datesText = booking =>
        `${formatDate(booking.checkin)} – ${formatDate(booking.checkout)}`;

    /**
     * Browser-tab-only storage for the prototype.
     * Production: call an authenticated server endpoint and MySQL instead.
     */
    function getReservations() {
        try {
            const result = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
            if (!Array.isArray(result)) return [];
            return result.filter(booking =>
                booking && typeof booking.id === 'string' &&
                typeof booking.email === 'string' &&
                typeof booking.roomKey === 'string' && rooms[booking.roomKey]
            ).slice(0, 20);
        } catch {
            // Security settings for file:// can disallow browser storage.
            return [];
        }
    }

    function saveReservation(booking) {
        const bookings = getReservations();
        bookings.unshift(booking);
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bookings.slice(0, 20)));
            return true;
        } catch {
            return false;
        }
    }

    function createConfirmationNumber() {
        const bytes = new Uint8Array(5);
        if (window.crypto?.getRandomValues) {
            window.crypto.getRandomValues(bytes);
            return 'MBL-' + Array.from(bytes, n => n.toString(36).padStart(2, '0'))
                .join('').slice(0, 7).toUpperCase();
        }
        return 'MBL-' + Math.random().toString(36).slice(2, 9).toUpperCase();
    }

    function sampleReservation() {
        const checkin = daysFromToday(14);
        const checkout = daysFromToday(17);
        return {
            id: 'MBL-BRB24',
            roomKey: 'knotty',
            checkin,
            checkout,
            nights: 3,
            guests: 2,
            first: 'Jane',
            last: 'Doe',
            email: 'guest@example.com',
            total: rooms.knotty.price * 3,
            status: 'Confirmed (sample)'
        };
    }

    function initializeMenu() {
        const toggle = $('#menuToggle');
        const nav = $('#mainNav');
        if (!toggle || !nav) return;

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
        getReservations,
        saveReservation,
        createConfirmationNumber,
        sampleReservation
    });

    initializeMenu();
})();
