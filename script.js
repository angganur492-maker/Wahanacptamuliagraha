/* =========================================================
   Family Gathering 2026 — PT Wahanacipta Muliagraha
   ========================================================= */

// ---------- KONFIGURASI (ubah bagian ini sesuai kebutuhanmu) ----------

// Tanggal & jam acara untuk countdown di halaman terakhir.
// Format: "YYYY-MM-DDTHH:mm:ss+07:00" (WIB)
// Catatan: poster (gambar 1) menyebut Minggu, 04 Oktober 2026, sedangkan
// instruksi pembuatan situs ini minta countdown ke 25 September 2026.
// Nilai di bawah memakai 25 September 2026 sesuai instruksi — cek lagi
// tanggal mana yang benar, lalu sesuaikan baris ini bila perlu.
const EVENT_DATE = new Date("2026-10-04T06:30:00+07:00");

// URL Web App dari Google Apps Script (lihat file apps-script.gs & README.md
// untuk cara deploy-nya). Kosongkan "" akan membuat form hanya menampilkan
// pesan sukses tanpa benar-benar mengirim data.
const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyHoiNplQPCqlimqKa1Ct_VAf88KFbCPS2Dr4evQj9BQgWQiV9cJFH6pS5m-81tDPTp/exec";

// ---------------------------------------------------------------------

const pages = Array.from(document.querySelectorAll(".page"));
const navButtons = Array.from(document.querySelectorAll("[data-goto]"));
const bottomNavItems = Array.from(document.querySelectorAll(".bottom-nav__item"));

function goToPage(pageName) {
  pages.forEach((section) => {
    section.classList.toggle("active", section.dataset.page === pageName);
  });
  bottomNavItems.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.goto === pageName);
  });
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  history.replaceState(null, "", `#${pageName}`);
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => goToPage(btn.dataset.goto));
});

// Tombol khusus "Buka Undangan" di halaman awal: pindah halaman + coba nyalakan musik
const btnOpen = document.getElementById("btnOpen");
if (btnOpen) {
  btnOpen.addEventListener("click", () => {
    goToPage("prizes");
    tryPlayMusic();
  });
}

// Buka halaman sesuai hash URL saat pertama dimuat (mis. share link #rsvp)
const initialPage = (location.hash || "#home").replace("#", "");
if (pages.some((p) => p.dataset.page === initialPage)) {
  goToPage(initialPage);
}

// ---------------- Musik latar ----------------

const bgm = document.getElementById("bgm");
const musicToggle = document.getElementById("musicToggle");
let musicStarted = false;

function tryPlayMusic() {
  if (musicStarted || !bgm) return;
  bgm.volume = 0.55;
  bgm.play()
    .then(() => {
      musicStarted = true;
      musicToggle.setAttribute("aria-pressed", "true");
    })
    .catch(() => {
      // Browser memblokir autoplay tanpa interaksi user — biarkan,
      // tombol musik tetap bisa dipakai untuk menyalakan manual.
    });
}

if (musicToggle) {
  musicToggle.addEventListener("click", () => {
    if (bgm.paused) {
      bgm.play();
      musicToggle.setAttribute("aria-pressed", "true");
      musicStarted = true;
    } else {
      bgm.pause();
      musicToggle.setAttribute("aria-pressed", "false");
    }
  });
}

// ---------------- Countdown ----------------

const cdDays = document.getElementById("cd-days");
const cdHours = document.getElementById("cd-hours");
const cdMins = document.getElementById("cd-mins");
const cdSecs = document.getElementById("cd-secs");

function pad(n) {
  return String(n).padStart(2, "0");
}

function updateCountdown() {
  const now = new Date();
  const diff = EVENT_DATE.getTime() - now.getTime();

  if (diff <= 0) {
    cdDays.textContent = "00";
    cdHours.textContent = "00";
    cdMins.textContent = "00";
    cdSecs.textContent = "00";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  cdDays.textContent = pad(days);
  cdHours.textContent = pad(hours);
  cdMins.textContent = pad(mins);
  cdSecs.textContent = pad(secs);
}

if (cdDays) {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ---------------- RSVP → Google Sheet ----------------

const rsvpForm = document.getElementById("rsvpForm");
const rsvpSubmit = document.getElementById("rsvpSubmit");
const rsvpStatus = document.getElementById("rsvpStatus");

if (rsvpForm) {
  rsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("rsvpName").value.trim();
    const attending = rsvpForm.querySelector('input[name="attending"]:checked');

    if (!name || !attending) {
      rsvpStatus.textContent = "Isi nama dan pilih kehadiran dulu, ya.";
      rsvpStatus.dataset.state = "error";
      return;
    }

    rsvpSubmit.disabled = true;
    rsvpSubmit.textContent = "Mengirim...";
    rsvpStatus.textContent = "";
    rsvpStatus.removeAttribute("data-state");

    const payload = {
      name,
      attending: attending.value,
      submittedAt: new Date().toISOString(),
    };

    try {
      if (!SHEET_WEB_APP_URL || SHEET_WEB_APP_URL.startsWith("PASTE_URL")) {
        throw new Error("NO_URL_CONFIGURED");
      }

      // Google Apps Script Web App menerima POST; mode "no-cors" dipakai
      // karena Apps Script tidak selalu mengirim header CORS, jadi kita
      // tidak bisa membaca responsnya — anggap sukses bila tidak error jaringan.
      await fetch(SHEET_WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      rsvpStatus.textContent = `Terima kasih, ${name}! Konfirmasimu sudah tercatat.`;
      rsvpStatus.dataset.state = "ok";
      rsvpForm.reset();
    } catch (err) {
      if (err.message === "NO_URL_CONFIGURED") {
        rsvpStatus.textContent =
          "URL Google Sheet belum diatur (lihat SHEET_WEB_APP_URL di script.js).";
      } else {
        rsvpStatus.textContent = "Gagal mengirim, coba lagi sebentar lagi.";
      }
      rsvpStatus.dataset.state = "error";
    } finally {
      rsvpSubmit.disabled = false;
      rsvpSubmit.textContent = "Kirim Konfirmasi";
    }
  });
}
