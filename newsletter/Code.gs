/**
 * H2RES website - newsletter subscription backend (Google Apps Script).
 *
 * On each POST from the website form it:
 *   1. Validates the email address.
 *   2. Appends it to a Google Sheet (skips exact duplicates).
 *   3. Sends a CONFIRMATION email to the subscriber.
 *   4. (Optional) Notifies the site admin of the new signup.
 *   5. Returns an HTML page that postMessages the result back to the site,
 *      so the page shows an accurate success/error message instead of the
 *      previous heuristic ("iframe loaded = success").
 *
 * SETUP: see SETUP.md next to this file.
 */

// ---- Configuration -------------------------------------------------------
// Leave SHEET_ID empty ('') if this script is CONTAINER-BOUND to the sheet
// (created via Extensions > Apps Script from inside the sheet). Otherwise
// paste the target sheet's ID (the long string in its URL) here.
var SHEET_ID   = '';
var SHEET_NAME = 'Subscribers';

var SITE_NAME   = 'H2RES';
var SITE_URL    = 'https://h2res.fsb.hr/';   // adjust to the real site URL; shown in the email
var ADMIN_EMAIL = '';                        // '' to disable admin notifications

// Origins allowed to receive the postMessage result: the website's origin,
// with NO trailing slash. Use '*' only if you cannot pin the origin.
var ALLOWED_PARENT_ORIGINS = ['https://h2res.fsb.hr'];
// -------------------------------------------------------------------------

function doPost(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var email  = String(params.email || '').trim();
  var source = String(params.source || '').trim();
  var page   = String(params.page || '').trim();
  var when   = String(params.submittedAt || '').trim() || new Date().toISOString();

  if (!isValidEmail_(email)) {
    return resultPage_('error', email, 'Please provide a valid email address.');
  }

  try {
    var added = appendSubscriber_(email, source, page, when);
    sendConfirmationEmail_(email);
    if (ADMIN_EMAIL) { notifyAdmin_(email, source, page, added); }
    var msg = added
      ? 'Subscription received. A confirmation email has been sent.'
      : 'You are already subscribed. A confirmation email has been sent.';
    return resultPage_('success', email, msg);
  } catch (err) {
    return resultPage_('error', email, 'Server error: ' + err);
  }
}

// Lets you open the deployment URL in a browser to check it is live.
function doGet() {
  return HtmlService.createHtmlOutput('H2RES newsletter endpoint is running.');
}

function getSheet_() {
  var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) { throw new Error('No spreadsheet found. Set SHEET_ID or bind the script to a sheet.'); }
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['Timestamp', 'Email', 'Source', 'Page']);
  }
  return sh;
}

function appendSubscriber_(email, source, page, when) {
  var sh = getSheet_();
  var lastRow = sh.getLastRow();
  if (lastRow >= 2) {
    var existing = sh.getRange(2, 2, lastRow - 1, 1).getValues();
    var lower = email.toLowerCase();
    for (var i = 0; i < existing.length; i++) {
      if (String(existing[i][0]).trim().toLowerCase() === lower) { return false; }
    }
  }
  sh.appendRow([when, email, source, page]);
  return true;
}

function sendConfirmationEmail_(email) {
  var subject = 'You are subscribed to ' + SITE_NAME + ' updates';
  var body =
    'Hello,\n\n' +
    'Thank you for subscribing to ' + SITE_NAME + ' updates. You will receive ' +
    'occasional news on releases, publications, events and training opportunities.\n\n' +
    'If you did not request this, you can safely ignore this email and you will ' +
    'not be contacted again.\n\n' +
    SITE_NAME + '\n' + SITE_URL + '\n';
  MailApp.sendEmail({ to: email, subject: subject, body: body, name: SITE_NAME });
}

function notifyAdmin_(email, source, page, added) {
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: '[' + SITE_NAME + '] New newsletter signup: ' + email,
    body: 'Email: ' + email + '\nNew subscriber: ' + added +
          '\nSource: ' + source + '\nPage: ' + page
  });
}

function isValidEmail_(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// HTML page that reports the result to the parent website via postMessage,
// and shows plain text if the URL is opened directly.
function resultPage_(status, email, message) {
  var payload = JSON.stringify({ type: 'newsletter-result', status: status, email: email, message: message });
  var origins = JSON.stringify(ALLOWED_PARENT_ORIGINS);
  var html =
    '<!doctype html><html><body>' +
    '<p>' + escapeHtml_(message) + '</p>' +
    '<script>(function(){var p=' + payload + ';var o=' + origins + ';' +
    'try{if(window.parent&&window.parent!==window){' +
    'if(o.indexOf("*")>-1){window.parent.postMessage(p,"*");}' +
    'else{for(var i=0;i<o.length;i++){window.parent.postMessage(p,o[i]);}}' +
    '}}catch(e){}})();<' + '/script>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function escapeHtml_(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
