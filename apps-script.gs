/**
 * apps-script.gs
 * -----------------------------------------------------------------
 * Script ini BUKAN untuk dimasukkan ke GitHub bersama file web (html/css/js).
 * Tempelkan isinya di Google Apps Script (script.google.com) yang terhubung
 * ke Google Sheet tempat menyimpan konfirmasi kehadiran.
 *
 * Cara pasang:
 * 1. Buka Google Sheet baru, beri nama misalnya "RSVP Family Gathering".
 *    Buat baris pertama sebagai header: Nama | Kehadiran | Waktu Submit
 * 2. Di menu Sheet: Extensions > Apps Script.
 * 3. Hapus kode default, tempel semua isi file ini.
 * 4. Klik Deploy > New deployment > pilih tipe "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Salin URL Web App yang muncul, tempelkan ke SHEET_WEB_APP_URL
 *    di file script.js (bagian KONFIGURASI).
 * -----------------------------------------------------------------
 */

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "invalid_payload" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  sheet.appendRow([
    data.name || "",
    data.attending || "",
    data.submittedAt || new Date().toISOString(),
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
