NS PROPERTIES 4 - FRONTEND WEBSITE PACKAGE (STAGES 1 TO 4)

FILES
-----
index.html             Stage 1: Homepage and property search
properties.html        Stage 2: Property listing, filters and sorting
property-details.html  Stage 3: Individual property details and enquiry
post-property.html     Stage 4: Property submission form and preview
assets/css/style.css   Shared corporate styling
assets/js/data.js      Sample property records
assets/js/common.js    Shared navigation, footer and card helpers
assets/js/home.js      Homepage search and featured properties
assets/js/listings.js  Listing filters, sorting and mobile filter dialog
assets/js/details.js   Property detail page logic, wishlist and enquiries
assets/js/post-property.js Property form, photo previews and demo submission

HOW TO RUN
----------
1. Extract the ZIP file.
2. Keep the folder structure unchanged.
3. Open the NS-PROPERTIES-4 folder in Visual Studio Code.
4. Use the Live Server extension and open index.html.
   You can also open index.html directly in a browser, but Live Server is recommended.

DEMO PROPERTY URLS
------------------
property-details.html?id=1001
property-details.html?id=1002
property-details.html?id=1003
property-details.html?id=1004

IMPORTANT
---------
- This is a frontend-only demo. It does NOT include PHP or MySQL.
- Property records are sample data in assets/js/data.js.
- The post-property form stores text records in the browser localStorage.
- Uploaded photos are previewed locally; they are not uploaded to a server.
- Enquiries are prepared for WhatsApp and/or stored locally in the browser.
- Wishlist uses browser localStorage.
- Change the WhatsApp business number in assets/js/details.js before publishing.
- Replace sample photos and property descriptions with authorized real listing content.
- Tailwind browser CDN, DaisyUI and Boxicons require an internet connection.
- No admin dashboard, authentication, server validation, database, or public listing approval is included yet.

NEXT STEP
---------
Stage 5 should connect the frontend to PHP and MySQL, add admin login,
secure image uploads, enquiry storage, and admin approval before publication.
