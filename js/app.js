/******************************************************************
 * PROJECT      : Paradise Member
 * MODULE       : Public Registration Page (Frontend - GitHub)
 * FILE         : js/app.js
 * VERSION      : v1.1.0
 * AUTHOR       : Jimmy
 * CREATED      : 2026-09-25
 * LAST UPDATE  : 2026-09-25
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika sisi client: membaca cabang dari URL (?branch=BP01),
 * mengonversi nomor HP dari format 08xxx ke 62xxx, mengirim data
 * pendaftaran ke Apps Script Web App (API JSON) lewat fetch(), dan
 * menampilkan hasilnya.
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release. Migrasi dari google.script.run (Js.html lama
 *   di Apps Script) menjadi fetch() ke Apps Script Web App API.
 *
 * v1.1.0
 * - Menambahkan normalizeIndonesianPhoneNumber() dan event "blur"
 *   pada kolom noHp: nomor yang diawali 0 otomatis dikonversi
 *   menjadi format 62xxx begitu user pindah ke kolom lain, supaya
 *   nomor yang tersimpan siap dipakai untuk link chat WhatsApp
 *   (wa.me/62xxx). Sebelumnya nomor disimpan apa adanya (08xxx).
 *
 ******************************************************************/

/******************************************************************
 * DEPENDENCIES
 * ----------------------------------------------------------------
 *
 * Required
 * - index.html (elemen form)
 * - Apps Script Web App (Code.gs, action=registerMember)
 *
 ******************************************************************/

(function () {

  /******************************************************************
   * CONFIGURATION
   * ----------------------------------------------------------------
   * GANTI nilai API_URL dengan URL Web App Apps Script, didapat
   * setelah Deploy > New deployment > Web app di Apps Script.
   ******************************************************************/
  const CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbwraZPdIdTPoQzzNZnL4o_Avs0-ynNxKHzrQ-u13j0Pcl-QKoESBXfNwQqj0BsJzHSUbg/exec"
  };

  /******************************************************************
   * CONSTANTS
   * ----------------------------------------------------------------
   ******************************************************************/
  const ACTION_REGISTER_MEMBER = "registerMember";
  const URL_PARAM_BRANCH = "branch";
  const DEFAULT_BRANCH_ID = "BP01";
  const SUBMIT_BUTTON_LABEL_DEFAULT = "DAFTAR SEKARANG";
  const SUBMIT_BUTTON_LABEL_LOADING = "MEMPROSES...";
  const PHONE_PREFIX_LOCAL = "0";
  const PHONE_PREFIX_COUNTRY = "62";
  const PHONE_PREFIX_COUNTRY_WITH_PLUS = "+62";

  document.addEventListener("DOMContentLoaded", initializePage);
  document.getElementById("registerForm").addEventListener("submit", handleFormSubmit);
  document.getElementById("noHp").addEventListener("blur", handlePhoneNumberBlur);

  /******************************************************************
   * Function : initializePage()
   * Tujuan   : Membaca parameter ?branch= dari URL saat halaman
   *            dimuat, lalu mengisi field tersembunyi branchId.
   ******************************************************************/
  function initializePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const branchId = urlParams.get(URL_PARAM_BRANCH) || DEFAULT_BRANCH_ID;
    document.getElementById("branchId").value = branchId;
  }

  /******************************************************************
   * Function : handlePhoneNumberBlur()
   * Tujuan   : Dipicu saat user pindah keluar dari kolom Nomor HP
   *            (klik/tab ke kolom lain). Mengonversi nilai di
   *            kolom tersebut ke format 62xxx secara langsung,
   *            supaya user melihat sendiri format akhirnya sebelum
   *            submit.
   ******************************************************************/
  function handlePhoneNumberBlur(event) {
    const phoneInputElement = event.target;
    const rawValue = phoneInputElement.value.trim();

    if (rawValue === "") {
      return;
    }

    phoneInputElement.value = normalizeIndonesianPhoneNumber(rawValue);
  }

  /******************************************************************
   * Function : normalizeIndonesianPhoneNumber()
   * Tujuan   : Mengonversi nomor HP ke format 62xxx (tanpa "+"),
   *            siap dipakai untuk link chat WhatsApp (wa.me/62xxx).
   *            Contoh: "085895665170" -> "6285895665170"
   ******************************************************************/
  function normalizeIndonesianPhoneNumber(rawPhoneNumber) {
    const cleanedNumber = rawPhoneNumber.replace(/[^0-9+]/g, "");

    if (cleanedNumber.indexOf(PHONE_PREFIX_COUNTRY_WITH_PLUS) === 0) {
      return cleanedNumber.substring(1);
    }

    if (cleanedNumber.indexOf(PHONE_PREFIX_COUNTRY) === 0) {
      return cleanedNumber;
    }

    if (cleanedNumber.indexOf(PHONE_PREFIX_LOCAL) === 0) {
      return PHONE_PREFIX_COUNTRY + cleanedNumber.substring(1);
    }

    return cleanedNumber;
  }

  /******************************************************************
   * Function : handleFormSubmit()
   * Tujuan   : Menangani submit form, mengumpulkan data, lalu
   *            mengirimkannya ke Apps Script Web App API.
   ******************************************************************/
  function handleFormSubmit(event) {
    event.preventDefault();
    clearMessage();
    setSubmitting(true);

    const formData = collectFormData();

    callRegisterMemberApi(formData)
      .then(handleRegisterSuccess)
      .catch(handleRegisterFailure);
  }

  /******************************************************************
   * Function : collectFormData()
   * Tujuan   : Mengambil seluruh nilai input pada form pendaftaran
   *            menjadi satu objek yang siap dikirim ke API. Nomor
   *            HP dinormalisasi ulang di sini sebagai jaring
   *            pengaman, kalau-kalau event blur tidak sempat
   *            terpicu (misal user submit lewat tombol Enter).
   ******************************************************************/
  function collectFormData() {
    const genderInput = document.querySelector('input[name="jenisKelamin"]:checked');
    const rawPhoneNumber = document.getElementById("noHp").value.trim();

    return {
      namaLengkap: document.getElementById("namaLengkap").value.trim(),
      noHp: normalizeIndonesianPhoneNumber(rawPhoneNumber),
      alamat: document.getElementById("alamat").value.trim(),
      tanggalLahir: document.getElementById("tanggalLahir").value,
      jenisKelamin: genderInput ? genderInput.value : "",
      branchId: document.getElementById("branchId").value
    };
  }

  /******************************************************************
   * Function : callRegisterMemberApi()
   * Tujuan   : Mengirim data pendaftaran ke Apps Script Web App.
   *            Body dikirim sebagai text/plain (bukan
   *            application/json) supaya browser TIDAK mengirim
   *            OPTIONS preflight, karena Apps Script Web App tidak
   *            bisa menjawab preflight tersebut.
   ******************************************************************/
  function callRegisterMemberApi(formData) {
    const requestPayload = {
      action: ACTION_REGISTER_MEMBER,
      data: formData
    };

    return fetch(CONFIG.API_URL, {
      method: "POST",
      body: JSON.stringify(requestPayload)
    }).then(function (response) {
      return response.json();
    });
  }

  /******************************************************************
   * Function : handleRegisterSuccess()
   * Tujuan   : Menampilkan hasil pendaftaran dari API. Jika gagal
   *            (misal HP sudah terdaftar), tampilkan pesan. Jika
   *            berhasil, tampilkan kartu Member ID.
   ******************************************************************/
  function handleRegisterSuccess(result) {
    setSubmitting(false);

    if (!result.success) {
      showMessage(result.message, true);
      return;
    }

    document.getElementById("formCard").classList.add("hidden");
    document.getElementById("successCard").classList.remove("hidden");
    document.getElementById("memberIdText").textContent = result.data.memberId;
  }

  /******************************************************************
   * Function : handleRegisterFailure()
   * Tujuan   : Menangani error jaringan/tak terduga saat memanggil
   *            API (misal API_URL belum diisi, atau tidak ada
   *            koneksi internet).
   ******************************************************************/
  function handleRegisterFailure(error) {
    setSubmitting(false);
    showMessage("Terjadi kesalahan sistem. Silakan coba lagi.", true);
    console.error("[REGISTER MEMBER]", error);
  }

  /******************************************************************
   * Function : setSubmitting()
   * Tujuan   : Mengatur tampilan tombol submit saat proses sedang
   *            berjalan, mencegah klik ganda.
   ******************************************************************/
  function setSubmitting(isSubmitting) {
    const button = document.getElementById("submitButton");
    button.disabled = isSubmitting;
    button.textContent = isSubmitting ? SUBMIT_BUTTON_LABEL_LOADING : SUBMIT_BUTTON_LABEL_DEFAULT;
  }

  /******************************************************************
   * Function : showMessage()
   * Tujuan   : Menampilkan pesan error/sukses di bawah form.
   ******************************************************************/
  function showMessage(message, isError) {
    const messageElement = document.getElementById("formMessage");
    messageElement.textContent = message;
    messageElement.className = isError ? "form-message error" : "form-message success";
  }

  /******************************************************************
   * Function : clearMessage()
   * Tujuan   : Mengosongkan pesan sebelumnya setiap kali form
   *            disubmit ulang.
   ******************************************************************/
  function clearMessage() {
    const messageElement = document.getElementById("formMessage");
    messageElement.textContent = "";
    messageElement.className = "form-message";
  }

})();
