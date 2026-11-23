/**
 * Connected Commons: website form handler (Google Apps Script, bound to the email-list Google Sheet)
 *
 * Handles two kinds of submissions to the same web app URL:
 *   1. source=scorecard: GTM Readiness Scorecard (scorecard.html). Saves a row to the "Scorecard" tab
 *      and emails the visitor their report.
 *   2. Anything else (for example the old discovery-offer form that only sends `email`): saved to the
 *      "Email list" tab. If your existing script already writes these somewhere else, paste that code
 *      into handleLegacy_() below so nothing changes for old forms.
 *
 * HOW TO UPDATE WITHOUT CHANGING THE URL
 *   Extensions > Apps Script in the Sheet > replace the code with this file > Save >
 *   Deploy > Manage deployments > pencil icon on the existing deployment > Version: "New version" > Deploy.
 *   (Do NOT create a new deployment, or the URL changes.) Approve the new Gmail permission when asked.
 */

var REPORT_FROM_NAME = 'Ron Foo, Connected Commons';
var REPLY_TO = 'hello@connectedcommons.co';
var NOTIFY_RON = 'hello@connectedcommons.co';   // gets a short note for each scorecard lead; set to '' to turn off
var SITE = 'https://www.connectedcommons.co';
var CALENDAR = 'https://calendar.app.google/2oHBsRx1rrcdJVNP6';
var WHATSAPP = 'https://wa.me/6580349668';

var SCORECARD_HEADERS = ['Timestamp', 'Name', 'Email', 'Company', 'Newsletter opt-in', 'Score', 'Band',
  'Market %', 'People %', 'Process %', 'AI & tools %', 'Weakest area', 'Suggested service',
  'Top gaps', 'Answers (Q1-Q12, 0-3)', 'Paying customers', 'Main market', 'Team size', 'Page'];

function doPost(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.website) return ok_();                    // spam trap
    if (p.source === 'scorecard') handleScorecard_(p);
    else handleLegacy_(p);
  } catch (err) {
    console.error(err);
  }
  return ok_();
}

function handleLegacy_(p) {
  if (!p.email) return;
  var sh = sheet_('Email list', ['Timestamp', 'Email', 'Source']);
  sh.appendRow([new Date(), clean_(p.email), clean_(p.source || 'discovery-offer')]);
}

function handleScorecard_(p) {
  var email = String(p.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

  var sh = sheet_('Scorecard', SCORECARD_HEADERS);
  sh.appendRow([new Date(), clean_(p.name), clean_(email), clean_(p.company), p.newsletter === 'yes' ? 'Yes' : 'No',
    num_(p.score), clean_(p.band), num_(p.market), num_(p.people), num_(p.process), num_(p.ai),
    clean_(p.weakest), clean_(p.service), clean_(String(p.gaps || '').replace(/ ## /g, '\n')),
    clean_(p.answers), clean_(p.stage), clean_(p.region), clean_(p.team), clean_(p.page)]);

  MailApp.sendEmail({
    to: email,
    subject: 'Your GTM Readiness Scorecard: ' + num_(p.score) + '/100',
    name: REPORT_FROM_NAME,
    replyTo: REPLY_TO,
    htmlBody: reportHtml_(p),
    body: reportText_(p)
  });

  if (NOTIFY_RON) {
    MailApp.sendEmail({
      to: NOTIFY_RON,
      subject: 'New scorecard lead: ' + (p.name || email) + ' (' + num_(p.score) + '/100, weakest: ' + (p.weakest || '-') + ')',
      name: 'Connected Commons website',
      body: [
        'Name: ' + (p.name || ''), 'Email: ' + email, 'Company: ' + (p.company || ''),
        'Newsletter opt-in: ' + (p.newsletter === 'yes' ? 'Yes' : 'No'),
        'Score: ' + num_(p.score) + '/100 (' + (p.band || '') + ')',
        'Market ' + num_(p.market) + '% | People ' + num_(p.people) + '% | Process ' + num_(p.process) + '% | AI & tools ' + num_(p.ai) + '%',
        'Suggested service: ' + (p.service || ''),
        'Context: ' + [p.stage, p.region, p.team].filter(String).join(' / ')
      ].join('\n')
    });
  }
}

function gaps_(p) {
  return String(p.gaps || '').split(' ## ').filter(String).map(function (g) {
    var parts = g.split(' || ');
    return { stmt: parts[0] || '', next: parts[1] || '' };
  });
}

function reportHtml_(p) {
  var name = esc_(String(p.name || '').split(' ')[0] || 'there');
  var bar = function (label, v) {
    v = num_(v);
    return '<tr><td style="padding:6px 12px 6px 0;font:600 14px Arial,sans-serif;color:#2F3235;white-space:nowrap">' + label + '</td>' +
      '<td style="padding:6px 0;width:100%"><div style="background:#E4E2DA;border-radius:4px;height:10px"><div style="background:#17819C;border-radius:4px;height:10px;width:' + v + '%"></div></div></td>' +
      '<td style="padding:6px 0 6px 12px;font:700 14px Arial,sans-serif;color:#2F3235">' + v + '%</td></tr>';
  };
  var gapRows = gaps_(p).map(function (g, i) {
    return '<tr><td style="padding:14px 0;border-top:1px solid #E4E2DA;font:700 22px Arial,sans-serif;color:#C9A227;vertical-align:top;width:44px">0' + (i + 1) + '</td>' +
      '<td style="padding:14px 0;border-top:1px solid #E4E2DA;font:15px/1.55 Arial,sans-serif;color:#2F3235"><b>' + esc_(g.stmt) + '</b><br>' +
      '<span style="color:#0B5B72;font-weight:700">Next step:</span> ' + esc_(g.next) + '</td></tr>';
  }).join('');
  return '' +
    '<div style="background:#FAF8F2;padding:24px 0"><div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #DCDCDD;border-radius:16px;overflow:hidden">' +
    '<div style="background:#2F3235;padding:28px 32px"><div style="font:700 12px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#7CC4DA">GTM Readiness Scorecard</div>' +
    '<div style="font:900 56px Arial,sans-serif;color:#F5CB5C;margin-top:8px">' + num_(p.score) + '<span style="font-size:20px;color:#8FA394"> / 100</span></div>' +
    '<div style="font:700 20px Arial,sans-serif;color:#E8EDDF;margin-top:6px">' + esc_(p.band) + '</div></div>' +
    '<div style="padding:28px 32px;font:15px/1.6 Arial,sans-serif;color:#2F3235">' +
    '<p style="margin:0 0 16px">Hi ' + name + ',</p>' +
    '<p style="margin:0 0 20px">Thanks for taking the scorecard. Here is your full report.</p>' +
    '<div style="font:700 12px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#0B5B72;margin:0 0 8px">Score by area</div>' +
    '<table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px">' +
      bar('Market', p.market) + bar('People', p.people) + bar('Process', p.process) + bar('AI &amp; tools', p.ai) + '</table>' +
    '<div style="font:700 12px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#0B5B72;margin:0 0 4px">Your top gaps and next steps</div>' +
    '<table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px">' + gapRows + '</table>' +
    '<p style="margin:0 0 20px;padding-left:14px;border-left:4px solid #F5CB5C">Your weakest area is <b>' + esc_(p.weakest) + '</b>. Where we would start: <b>' + esc_(p.service) + '</b>.</p>' +
    '<p style="margin:0 0 24px">If you would like to talk it through, reply to this email, <a href="' + WHATSAPP + '" style="color:#0B5B72">message me on WhatsApp</a> or <a href="' + CALENDAR + '" style="color:#0B5B72">book a call</a>.</p>' +
    '<p style="margin:0">Ron Foo<br><span style="color:#4C5C68">Connected Commons · <a href="' + SITE + '" style="color:#4C5C68">connectedcommons.co</a></span></p>' +
    '</div>' +
    '<div style="padding:16px 32px;background:#F4F4F5;font:12px/1.6 Arial,sans-serif;color:#4C5C68">You are receiving this because you asked for your scorecard report at connectedcommons.co. ' +
    (p.newsletter === 'yes' ? 'You also asked for occasional GTM tips and updates; reply "unsubscribe" at any time to stop them. ' : 'We will not add you to our newsletter unless you ask. ') +
    'This report is a general view based on your own answers, not a guarantee of results or professional advice. Connected Commons is a brand operated by RFtechstuff (UEN 53536160B), Singapore.</div>' +
    '</div></div>';
}

function reportText_(p) {
  var lines = ['Your GTM Readiness Scorecard: ' + num_(p.score) + '/100', String(p.band || ''), '',
    'Market ' + num_(p.market) + '% | People ' + num_(p.people) + '% | Process ' + num_(p.process) + '% | AI & tools ' + num_(p.ai) + '%', '',
    'Your top gaps and next steps:'];
  gaps_(p).forEach(function (g, i) { lines.push((i + 1) + '. ' + g.stmt, '   Next step: ' + g.next); });
  lines.push('', 'Weakest area: ' + (p.weakest || '') + '. Where we would start: ' + (p.service || '') + '.', '',
    'Talk it through: reply to this email, WhatsApp ' + WHATSAPP + ' or book a call ' + CALENDAR, '', 'Ron Foo, Connected Commons');
  return lines.join('\n');
}

/* helpers */
function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); sh.setFrozenRows(1); }
  return sh;
}
function clean_(v) {   // stop spreadsheet formula injection and cap length
  v = String(v == null ? '' : v).slice(0, 2000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
function num_(v) { var n = Math.round(Number(v)); return isFinite(n) ? Math.max(0, Math.min(100, n)) : 0; }
function esc_(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function ok_() { return ContentService.createTextOutput('ok'); }
