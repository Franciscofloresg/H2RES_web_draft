# Newsletter backend (Google Apps Script) — setup

The website form posts subscribers to a Google Apps Script web app. The code
in `Code.gs` records each subscriber in a Google Sheet **and sends a
confirmation email** to the subscriber (this is the new part). It also reports
an accurate success/error back to the page via `postMessage`, replacing the old
"the iframe loaded, so assume success" heuristic.

> The website frontend is already wired up. This folder is the **server side**,
> which lives inside Google (not on the web host), so it has to be pasted and
> re-deployed by hand. These files are kept in the repo only as the source of
> truth for that script.

## 1. Create (or open) the Apps Script project

Easiest option — container-bound to a Sheet:

1. Create a Google Sheet that will hold subscribers (e.g. "H2RES subscribers").
2. In that Sheet: **Extensions → Apps Script**.
3. Delete the default `Code.gs` content and paste the contents of this folder's
   `Code.gs`.
4. Leave `SHEET_ID = ''` (the script is bound to this Sheet).

Alternative — standalone script: create a script at script.google.com, paste
`Code.gs`, and set `SHEET_ID` to the target Sheet's ID (the long string in the
Sheet URL between `/d/` and `/edit`).

## 2. Edit the configuration block at the top of `Code.gs`

- `SITE_URL` — the public site URL shown in the confirmation email.
- `ALLOWED_PARENT_ORIGINS` — the site origin **with no trailing slash**
  (e.g. `https://h2res.fsb.hr`). This must match where the form is served.
- `ADMIN_EMAIL` — optional; set it to get a notice on each new signup.
- `SHEET_NAME` — the tab name to write to (created automatically if missing).

## 3. Deploy as a Web app

1. **Deploy → New deployment → type: Web app**.
2. **Execute as:** *Me*.
3. **Who has access:** *Anyone*.
4. Deploy, authorize the scopes when prompted (Sheets + send email), and copy
   the **/exec** Web app URL.

The first authorization asks for permission to send email as your account
(`MailApp`) and to edit the Sheet — that is expected.

## 4. Point the website at the deployment

Open `assets/js/site-config.js` and set `links.newsletterEndpoint` to the
`/exec` URL from step 3. (If you re-deploy a **new version** rather than
updating the existing deployment, the URL changes — update it here too.)

## 5. Test

1. Open the site, enter an email, submit.
2. The page should show: *"A confirmation email is on its way…"*.
3. Check the inbox (and spam) for the confirmation email.
4. Check the Sheet for the new row.
5. To test error reporting, temporarily submit with email sending disabled or
   an invalid config — the page should now show the real error text rather than
   a false success.

## Notes / options

- **Single vs double opt-in.** This sends a *confirmation/welcome* email
  (single opt-in). For a stricter, GDPR-preferred **double opt-in**, the email
  would instead contain a unique confirm link, and the subscriber is only added
  to the active list after clicking it. That needs a token store and a second
  `doGet` handler for the confirm link — say the word and I can extend
  `Code.gs` to do that.
- **Quotas.** A normal Gmail account can send ~100 emails/day via `MailApp`;
  Workspace accounts ~1500/day. Fine for a newsletter signup confirmation.
- **Sender address.** Emails are sent from the Google account that owns the
  script. Use a dedicated account if you don't want your personal address on
  them.
- **Unsubscribe.** For real newsletter sends (not just the confirmation), add
  an unsubscribe mechanism to stay compliant. The Sheet is the source list.
