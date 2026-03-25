<?php
/**
 * Fayl yuklash endpoint
 * Angular frontend server da turadi
 * Fayllarni /uploads/ papkasiga saqlaydi, URL ni qaytaradi
 */

// CORS (token tekshirishdan oldin bo'lishi kerak)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Upload-Token');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Token tekshiruvi
$headers = getallheaders();
$token = $headers['X-Upload-Token'] ?? $headers['x-upload-token'] ?? '';

$secret = '6e9e4068-325d-4008-9a10-ce0450b4d9ee';
if ($token !== $secret) {
    http_response_code(401);
    echo json_encode(['error' => 'Ruxsat yo\'q']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Faqat POST so\'rov']);
    exit;
}

if (empty($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Fayl yuborilmadi']);
    exit;
}

$file = $_FILES['file'];

// Hajm: 50MB
if ($file['size'] > 50 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['error' => 'Fayl hajmi 50MB dan oshmasligi kerak']);
    exit;
}

// Ruxsat etilgan kengaytmalar
$allowedExt = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mp3', 'zip'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $allowedExt)) {
    http_response_code(400);
    echo json_encode(['error' => 'Fayl turi ruxsat etilmagan']);
    exit;
}

// Saqlash papkasi (upload.php yonida)
$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Noyob fayl nomi
$filename = uniqid('', true) . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file['name']);
$filename = substr($filename, 0, 120) . '.' . $ext;
$dest = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    http_response_code(500);
    echo json_encode(['error' => 'Fayl saqlanmadi']);
    exit;
}

// To'liq URL
$proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host  = $_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'];
$url   = $proto . '://' . $host . '/uploads/' . $filename;

echo json_encode([
    'url'  => $url,
    'name' => $file['name'],
    'size' => $file['size'],
]);
