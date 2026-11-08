# NS PROPERTIES 4 — Stage 5 Setup
Existing Tailwind CSS 4 / DaisyUI 5 pages remain in place; Stage 5 adds a PHP 8.1+ / MySQL 8 backend, an admin dashboard and moderation.

## Local XAMPP installation
1. Put the repo in `C:\xampp\htdocs\NSPROPERTIES4_NEW`.
2. Start Apache and MySQL. If port 80 is occupied, adjust Apache's configured port and use that port in URLs.
3. Import `database/schema.sql` into MySQL using phpMyAdmin.
4. Set environment variables `NS_DB_DSN`, `NS_DB_USER`, `NS_DB_PASSWORD` for the PHP process. Defaults are `mysql:host=127.0.0.1;dbname=nsproperties;charset=utf8mb4`, `root`, and an empty password **for local XAMPP development only**.
5. With PHP on PATH, run `php admin/create-admin.php admin "choose-a-long-random-password"`.
6. Open `http://localhost/NSPROPERTIES4_NEW/index.html` and `http://localhost/NSPROPERTIES4_NEW/admin/` (adjust port if needed).

Property submissions go to the pending queue; approved listings appear publicly. Enquiries for database properties are stored and visible to admins. Sample listings work only in offline demo mode.

**Limitations**: photos remain local previews and are NOT uploaded. No rate limiting, CAPTCHA, email alerts or production-grade media processing yet. Configure HTTPS, strong database credentials, rate limits, backups, image uploads, and audit logging before production use. PHP will not run on VS Code Live Server or GitHub Pages.
