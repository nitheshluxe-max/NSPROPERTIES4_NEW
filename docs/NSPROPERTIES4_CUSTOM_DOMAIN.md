# Custom domain setup — nsproperties4.com

## GitHub Pages (manual owner action)
1. In GitHub repository Settings > Pages, choose **GitHub Actions** as the build/deploy source (existing workflow).
2. Set **Custom domain** to `nsproperties4.com` and save. GitHub Actions deployments do not require a repository `CNAME` file.
3. After DNS verification and certificate provisioning, enable **Enforce HTTPS**.
4. Merge the custom-domain Vite PR only when ready to switch to the new domain. The old project-path GitHub Pages URL will no longer have the correct Vite base.

## DNS (at authoritative DNS provider)
| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | nitheshluxe-max.github.io |

Use DNS-only/unproxied if a provider offers a proxy while initially validating.
Do not create wildcard DNS. Do not remove MX/TXT records used by email.
Remove conflicting records at @ and www only after checking existing services.
The www variant should redirect to the configured apex domain once both DNS names resolve.

## Supabase Authentication > URL Configuration
- Site URL: `https://nsproperties4.com`
- Additional Redirect URLs:
  - `https://nsproperties4.com/**`
  - `https://www.nsproperties4.com/**`
  - `https://nitheshluxe-max.github.io/NSPROPERTIES4_NEW/**` (temporary during cutover)

The app constructs signup and password-recovery redirects from `window.location`; after the switch, verify signup confirmation and recovery on the custom domain.

## Verify on Windows PowerShell
```powershell
Resolve-DnsName nsproperties4.com -Type A
Resolve-DnsName www.nsproperties4.com -Type CNAME
```
Test https://nsproperties4.com/, https://www.nsproperties4.com/ (redirect), and https://nsproperties4.com/#post-property.
Test property images, Supabase signup/sign-in, password reset, posting and admin approval.
