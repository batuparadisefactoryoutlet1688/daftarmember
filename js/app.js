/******************************************************************
 * PROJECT      : Paradise Member
 * MODULE       : Public Registration Page (Frontend - GitHub)
 * FILE         : js/app.js
 * VERSION      : v1.0.0
 * AUTHOR       : Jimmy
 * CREATED      : 2026-09-25
 * LAST UPDATE  : 2026-09-25
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika sisi client: membaca cabang dari URL (?branch=BP01),
 * mengirim data pendaftaran ke Apps Script Web App (API JSON)
 * lewat fetch(), dan menampilkan hasilnya.
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release. Migrasi dari google.script.run (Js.html lama
 *   di Apps Script) menjadi fetch() ke Apps Script Web App API.
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

  document.addEventListener("DOMContentLoaded", initializePage);
  document.getElementById("registerForm").addEventListener("submit", handleFormSubmit);

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
   *            menjadi satu objek yang siap dikirim ke API.
   ******************************************************************/
  function collectFormData() {
    const genderInput = document.querySelector('input[name="jenisKelamin"]:checked');

    return {
      namaLengkap: document.getElementById("namaLengkap").value.trim(),
      noHp: document.getElementById("noHp").value.trim(),
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
