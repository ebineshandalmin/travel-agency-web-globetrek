// /script/contact.js

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
});

import Toast from "./toast.js";

const DB_BASE = 'https://globe-trek-b1e87-default-rtdb.firebaseio.com';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form values
            const name = document.getElementById('contactName').value.trim();
            const email = document.getElementById('contactEmail').value.trim();
            const subject = document.getElementById('contactSubject').value.trim();
            const message = document.getElementById('contactMessage').value.trim();

            if (!name || !email || !message) {
                Toast.show('Please fill in all required fields.', 'warning');
                return;
            }

            const messageData = {
                name,
                email,
                subject: subject || 'No subject',
                message,
                timestamp: Date.now(),
                status: 'Unread'     // so admin/staff can mark as read later
            };

            try {
                // No auth needed – database rules allow write:true for contactMessages
                const res = await fetch(`${DB_BASE}/contactMessages.json`, {
                    method: 'POST',
                    body: JSON.stringify(messageData),
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!res.ok) {
                    throw new Error('Failed to send message');
                }

                Toast.show("Message sent successfully! We'll get back to you soon.", "success");
                form.reset();
            } catch (err) {
                console.error(err);
                Toast.show('Could not send message. Please try again later.', 'error');
            }
        });
    }
});