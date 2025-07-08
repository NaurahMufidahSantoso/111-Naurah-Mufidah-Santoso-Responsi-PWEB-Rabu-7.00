// nitip penjelasan json -> // tempat penyimpanan daftar belanja, 
// Fungsinya kayak database kecil, tapi lebih simpel

// script.js
// Tentukan URL untuk fetch API (jembatan penghubung antar aplikasi) yang mengarah ke file proses.php (tempat proses data)
const API_URL = "proses.php";

// Deklarasi variabel-variabel elemen yang akan digunakan
let addForm, newItemInput, resetBtn, shoppingListElement, confirmModal, confirmMessage, confirmOk, confirmCancel;
let pendingAction = null;  // Untuk menyimpan action yang tertunda saat modal ditampilkan

// Saat halaman selesai dimuat, jalankan fungsi-fungsi berikut
document.addEventListener("DOMContentLoaded", () => {
    initializeElements(); // Ambil semua elemen yang akan dipakai
    setupEventListeners(); // Pasang event listener ke tombol
    loadListFromServer(); // Ambil data dari server (PHP)
});

// Ambil elemen-elemen HTML yang dibutuhkan
function initializeElements() {
    addForm = document.getElementById("addForm"); // Form input tambah barang
    newItemInput = document.getElementById("newItem"); // Input field
    resetBtn = document.getElementById("resetBtn"); // Tombol reset
    shoppingListElement = document.getElementById("shoppingList"); // Tempat menampilkan list
    confirmModal = document.getElementById("confirmModal"); // (Modal) Pop-up konfirmasi
    confirmMessage = document.getElementById("confirmMessage");
    confirmOk = document.getElementById("confirmOk");
    confirmCancel = document.getElementById("confirmCancel");
}

// Pasang semua event listener ke tombol dan form
function setupEventListeners() {
    addForm.addEventListener("submit", addItem); // Saat form disubmit, jalankan addItem
    resetBtn.addEventListener("click", resetList); // Saat tombol reset diklik, jalankan resetList
    confirmOk.addEventListener("click", () => { hideModal(); if (pendingAction) { pendingAction(); pendingAction = null; } });  // Tutup modal, Jalankan action yang tertunda (misalnya hapus barang)
    confirmCancel.addEventListener("click", hideModal); // Tombol batal cuma nutup modal
}

// Fungsi request ke PHP (proses.php) pakai fetch
async function apiRequest(action, data = {}) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data })
    });
    return response.json();
}

// Ambil daftar belanja dari server
async function loadListFromServer() {
    const result = await apiRequest("get");
    if (result.status === "success") {
        shoppingList = result.data; // Update array shoppingList dari server
        renderList(); // Tampilkan datanya di halaman
    }
}

// Tambah item baru
async function addItem(event) {
    event.preventDefault(); // Supaya halaman nggak reload
    const item = newItemInput.value.trim();
    if (!item) return showModal("Masukkan list barang belanjaan..."); // Kalau kosong, munculkan modal pesan

    const result = await apiRequest("add", { item });
    if (result.status === "success") {
        loadListFromServer(); // Kalau sukses, refresh list
        newItemInput.value = ""; // Kosongkan input field
    } else {
        showModal(result.message); // Kalau gagal, tampilkan pesan error
    }
}

// Hapus item tertentu berdasarkan index
async function deleteItem(index) {
    const itemName = shoppingList[index];
    showModal(`Hapus "${itemName}" dari daftar belanja?`, async () => {
        const result = await apiRequest("delete", { index });
        if (result.status === "success") {
            loadListFromServer();
        } else {
            showModal(result.message);
        }
    });
}

// Reset semua daftar belanja
async function resetList() {
    showModal("Reset daftar belanja ke pengaturan awal?", async () => {
        const result = await apiRequest("reset");
        if (result.status === "success") {
            loadListFromServer();
        } else {
            showModal(result.message);
        }
    });
}

// Tampilkan list barang di halaman
function renderList() {
    shoppingListElement.innerHTML = "";
    if (shoppingList.length === 0) {
         // Kalau kosong, tampilkan tulisan "Daftar belanja kosong"
        shoppingListElement.innerHTML = `<div class="empty-state"><h3>Daftar belanja kosong</h3><p>Tambahkan item pertama Anda!</p></div>`;
        return;
    }

    // Kalau ada datanya, buat list item satu per satu
    shoppingList.forEach((item, index) => {
        const listItem = document.createElement("div");
        listItem.className = "list-item";
        listItem.innerHTML = `<span class="item-name">${escapeHtml(item)}</span><button type="button" class="delete-btn">Hapus</button>`;
        // Tombol "Hapus" di setiap item
        listItem.querySelector(".delete-btn").addEventListener("click", () => deleteItem(index));
        // Tambahkan ke tampilan halaman
        shoppingListElement.appendChild(listItem);
    });
}

// Tampilkan modal konfirmasi (Modal itu isinya pertanyaan kayak: "Apakah kamu yakin mau hapus item ini?")
function showModal(message, callback) {
    confirmMessage.textContent = message; // Tampilkan pesan ke modal
    confirmModal.style.display = "block"; // Tampilkan modalnya
    pendingAction = callback; // Simpan action yang mau dijalankan kalau "Oke" ditekan
}

// Sembunyikan modal
function hideModal() {
    confirmModal.style.display = "none";
    pendingAction = null;
}

// Supaya nama item nggak bisa disusupi script jahat (XSS)
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}