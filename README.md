🌍 GlobeTrek Adventures – Travel Booking & Management Platform

📌 Overview

Full‑stack web application for booking and managing travel expeditions

Built with HTML5, Tailwind CSS, JavaScript (ES Modules), and Firebase

Three distinct roles: Admin, Staff, and Customer

Real‑time data sync using Firebase Realtime Database

Email/password authentication with role‑based redirection

👑 Admin Features

Dashboard with stats (total users, bookings, packages, revenue)

Manage users – view all, promote/demote roles, delete accounts

Manage packages – add, edit, delete (modal form with image URL)

Manage bookings – filter by status, search, update status (Confirmed/Pending/Cancelled)

View customer queries – reply, change status, delete (supports both registered users and visitors)

Reports page – bar chart (last 7 days bookings), pie chart (status breakdown), recent bookings table, stats cards

Profile settings – update name, phone, change password

👥 Staff Features

Dashboard with stats (total bookings, pending bookings, active packages, queries)

Manage packages – add, edit, delete (same modal as admin)

Manage location details – comprehensive form (attractions, activities, best time, culture, accessibility, accommodation, budget, tips, hero image, selling line)

Manage bookings – filter, search, update status

View and reply to customer queries (registered users + visitor messages)

Staff profile – update name, phone, change password

🧳 Customer Features

Dashboard – stats (total bookings, upcoming trips, completed trips, loyalty points), latest bookings table, odyssey preview

Explore packages – filter by destination (search), price range, tag (e.g., Adventure, Beach, Luxury)

Book a package – travel dates, travelers (adults/children), accommodation upgrade, add‑ons (airport transfer, insurance, guided tour), special requests, real‑time price summary, mock payment

My bookings – view all bookings with status (Confirmed/Pending/Cancelled)

Profile – view/edit name, phone, change password

Support queries – submit new query, view previous queries with admin/staff replies

🌐 Public Pages (No Login)

Home – hero with destination search, feature cards, curated collections grid (6 random packages, auto‑refreshes every 10 seconds)

Packages – filterable gallery (destination, price, duration) with “Location Guide” links

About – company story, why travel with us, meet the team (static)

Contact – contact info, Google Map iframe, contact form (stores messages in contactMessages)

Login – email/password login, “remember me”, forgot password modal (Firebase password reset)

Register – full registration (name, email, phone, password, confirm, terms) – role auto‑assigned based on email domain

Location – dynamic destination guide page (populated from locationDetails node)

🔐 Role & Email‑Based RoutinG

Admin – email ends with @admingt.com → redirected to /html/admin.html

Staff – email ends with @staffgt.com → redirected to /html/staff.html

Customer – all other emails → redirected to /html/customer.html

🛠️ Tech Stack

Frontend – HTML5, Tailwind CSS (CDN), JavaScript (ES Modules)

Backend – Firebase Authentication, Firebase Realtime Database

Charts – Chart.js (bar & pie charts)

🧪 Usage Flow

Customer – Register → Login → Browse packages → Book → View bookings → Submit queries → Edit profile

Staff – Login → Manage packages & locations → Confirm/cancel bookings → Reply to queries → Update profile

Admin – Full system control (users, packages, bookings, reports, queries, settings)

Icons – Font Awesome 6

Fonts – Google Fonts (Inter, Playfair Display)
