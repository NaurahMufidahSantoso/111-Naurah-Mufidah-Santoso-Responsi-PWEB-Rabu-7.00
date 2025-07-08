<?php
header('Content-Type: application/json');
// set header agar hasilnya berupa json
$dataFile = 'data.json'; // file JSON tempat untuk menyimpan data belanja
// ambil request dari fetch javascript
$request = json_decode(file_get_contents('php://input'), true);
$action = $request['action'] ?? ''; //ambil action dari request (misalnya add, delete reset, get)
$response = []; // array untuk menampung hasil response

//fungsi untuk membaca data dari file json
function loadData($file) {
    return file_exists($file) ? json_decode(file_get_contents($file), true) ?: [] : [];
}

//fungsi untuk menyimpan data ke file json
function saveData($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

// Ambil data belanjaan dari file JSON
$shoppingList = loadData($dataFile);

// Proses action yang dikirim dari JavaScript
switch ($action) {
    case 'get':
        // Ambil semua data belanjaan
        $response = ['status' => 'success', 'data' => $shoppingList];
        break;
    case 'add':
         // Tambah barang baru
        $item = trim($request['item'] ?? '');
          // Cek apakah input tidak kosong dan belum ada di daftar
        if ($item && !in_array($item, $shoppingList, true)) {
            $shoppingList[] = $item; // Tambahkan ke array
            saveData($dataFile, $shoppingList); // Simpan ke file JSON
            $response = ['status' => 'success', 'message' => 'Item ditambahkan'];
        } else {
            $response = ['status' => 'error', 'message' => 'Item sudah ada atau kosong'];
        }
        break;
    case 'delete':
         // Hapus barang berdasarkan index
        $index = $request['index'] ?? -1;
        if (isset($shoppingList[$index])) {
            array_splice($shoppingList, $index, 1); // Hapus dari array
            saveData($dataFile, $shoppingList); // Simpan ulang ke file JSON
            $response = ['status' => 'success', 'message' => 'Item dihapus'];
        } else {
            $response = ['status' => 'error', 'message' => 'Index tidak valid'];
        }
        break;
    case 'reset':
        // Reset daftar belanja jadi kosong
        $shoppingList = [];
        saveData($dataFile, $shoppingList);
        $response = ['status' => 'success', 'message' => 'Daftar direset'];
        break;
    default:
        // Kalau action tidak dikenali
        $response = ['status' => 'error', 'message' => 'Aksi tidak dikenali'];
        break;
}

// Kirim hasilnya ke JavaScript dalam format JSON
echo json_encode($response);