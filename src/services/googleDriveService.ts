import { getGoogleAccessToken, isGoogleDriveConnected } from './googleAuthService';
import { GoogleDriveMetadata } from '../types';

export interface DriveFolderInfo {
  id: string;
  name: string;
}

const ROOT_FOLDER_NAME = "SIPAS MI Ma'arif Al Ihsan Soborejo";

// Cache created folder IDs in memory
let cachedRootFolderId: string | null = null;
const cachedSubFolders: Record<string, string> = {};

/**
 * Helper to ensure a folder exists in Google Drive
 */
export async function getOrCreateFolder(
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('Token Google Drive tidak tersedia. Silakan hubungkan akun Google.');

  // Check if folder already exists
  const parentQuery = parentFolderId ? `'${parentFolderId}' in parents and ` : '';
  const q = `${parentQuery}name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Folder doesn't exist, create it
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Gagal membuat folder "${folderName}" di Google Drive.`);
  }

  const created = await createRes.json();
  return created.id;
}

/**
 * Get or create destination folder for a specific document category
 */
export async function getDestinationFolderId(
  category: 'Surat Masuk' | 'Surat Keluar' | 'Surat Keputusan' | 'Arsip Digital'
): Promise<string> {
  if (cachedSubFolders[category]) {
    return cachedSubFolders[category];
  }

  if (!cachedRootFolderId) {
    cachedRootFolderId = await getOrCreateFolder(ROOT_FOLDER_NAME);
  }

  const subFolderId = await getOrCreateFolder(category, cachedRootFolderId);
  cachedSubFolders[category] = subFolderId;
  return subFolderId;
}

/**
 * Upload a real file to Google Drive via multipart upload
 */
export async function uploadFileToGoogleDrive(
  file: File,
  category: 'Surat Masuk' | 'Surat Keluar' | 'Surat Keputusan' | 'Arsip Digital',
  description?: string
): Promise<GoogleDriveMetadata> {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Akun Google Drive belum terhubung. Silakan hubungkan Google Drive terlebih dahulu.');
  }

  // 1. Get destination folder in Google Drive
  let folderId: string | undefined;
  try {
    folderId = await getDestinationFolderId(category);
  } catch (err) {
    console.warn('Could not ensure category folder, uploading to root:', err);
  }

  // 2. Prepare metadata and multipart body
  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/pdf',
    description: description || `Dokumen ${category} MI Ma'arif Al Ihsan Soborejo`,
    parents: folderId ? [folderId] : undefined,
  };

  const boundary = `-------SIPAS_DRIVE_${Date.now()}-------`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const fileHeader = `${delimiter}Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

  // Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();

  // Combine parts into one blob
  const multipartBlob = new Blob(
    [
      metadataPart,
      fileHeader,
      fileBuffer,
      closeDelimiter,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  // 3. Upload to Google Drive
  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: multipartBlob,
    }
  );

  if (!uploadRes.ok) {
    const errorJson = await uploadRes.json().catch(() => ({}));
    throw new Error(
      errorJson.error?.message || `Gagal mengunggah ${file.name} ke Google Drive (${uploadRes.status})`
    );
  }

  const driveFile = await uploadRes.json();

  // 4. (Optional) Set general view permission for link sharing so users can open it easily
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${driveFile.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.info('Could not set anyone-with-link permission:', permErr);
  }

  const fileId = driveFile.id;
  const driveUrl = driveFile.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
  const downloadUrl = driveFile.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`;

  return {
    fileId,
    folderId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/pdf',
    driveUrl,
    downloadUrl,
    uploadedAt: new Date().toISOString(),
    textContent: description || file.name,
  };
}

/**
 * Delete a file from Google Drive with mandatory user confirmation
 */
export async function deleteFileFromGoogleDrive(
  fileId: string,
  fileName: string
): Promise<boolean> {
  const confirmed = window.confirm(
    `Apakah Anda yakin ingin menghapus dokumen "${fileName}" dari Google Drive madrasah? Tindakan ini tidak dapat dibatalkan.`
  );
  if (!confirmed) return false;

  const token = await getGoogleAccessToken();
  if (!token) throw new Error('Token Google Drive tidak tersedia.');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.ok || res.status === 204;
}

/**
 * Test connectivity and get Drive storage quota info
 */
export async function getDriveStorageInfo(): Promise<{
  connected: boolean;
  userEmail?: string;
  usageBytes?: number;
  limitBytes?: number;
}> {
  if (!isGoogleDriveConnected()) {
    return { connected: false };
  }

  const token = await getGoogleAccessToken();
  if (!token) return { connected: false };

  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return { connected: false };

    const data = await res.json();
    return {
      connected: true,
      userEmail: data.user?.emailAddress,
      usageBytes: parseInt(data.storageQuota?.usage || '0', 10),
      limitBytes: parseInt(data.storageQuota?.limit || '0', 10),
    };
  } catch {
    return { connected: false };
  }
}

// ============================================================================
// GOOGLE APPS SCRIPT WEB APP BRIDGE (TANPA FIREBASE / TANPA LOGIN POPUP)
// ============================================================================

export type DriveCategory = 'Surat Masuk' | 'Surat Keluar' | 'Surat Keputusan' | 'Arsip Digital';

export const GOOGLE_APPS_SCRIPT_CODE = `// ============================================================================
// JEMBATAN GOOGLE DRIVE UNTUK SIPAS MI MA'ARIF AL IHSAN SOBOREJO
// Salin seluruh kode ini ke Code.gs di https://script.google.com
// Lalu Deploy > New Deployment > Web App:
//   - Execute as: Me (akun Google Madrasah Anda)
//   - Who has access: Anyone
// ============================================================================

var ROOT_FOLDER_NAME = "SIPAS MI Ma'arif Al Ihsan Soborejo";
var SUBFOLDER_NAMES = ["Surat Masuk", "Surat Keluar", "Surat Keputusan", "Arsip Digital"];

function getOrCreateFolder_(name, parentFolder) {
  var iterator = parentFolder
    ? parentFolder.getFoldersByName(name)
    : DriveApp.getFoldersByName(name);
  while (iterator.hasNext()) {
    var folder = iterator.next();
    if (!folder.isTrashed()) {
      return folder;
    }
  }
  return parentFolder ? parentFolder.createFolder(name) : DriveApp.createFolder(name);
}

function getOrCreateRootStructure_() {
  var root = getOrCreateFolder_(ROOT_FOLDER_NAME, null);
  var subfolders = {};
  for (var i = 0; i < SUBFOLDER_NAMES.length; i++) {
    var catName = SUBFOLDER_NAMES[i];
    var sub = getOrCreateFolder_(catName, root);
    subfolders[catName] = {
      id: sub.getId(),
      url: "https://drive.google.com/drive/folders/" + sub.getId()
    };
  }
  return { root: root, subfolders: subfolders };
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
    if (action === "ping") {
      var structure = getOrCreateRootStructure_();
      var ownerEmail = "";
      try {
        ownerEmail = Session.getEffectiveUser().getEmail() || "";
      } catch (errEmail) {}

      return jsonResponse_({
        success: true,
        app: "SIPAS Google Apps Script Bridge",
        ownerEmail: ownerEmail,
        rootFolderId: structure.root.getId(),
        rootFolderUrl: "https://drive.google.com/drive/folders/" + structure.root.getId(),
        subfolders: structure.subfolders
      });
    }
    return jsonResponse_({ success: false, error: "Action GET tidak dikenali." });
  } catch (err) {
    return jsonResponse_({ success: false, error: err.message || String(err) });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ success: false, error: "Payload POST kosong." });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || "upload";

    if (action === "upload") {
      var category = payload.category || "Arsip Digital";
      var fileName = payload.fileName || ("Dokumen_SIPAS_" + new Date().getTime() + ".pdf");
      var mimeType = payload.mimeType || "application/pdf";
      var base64Data = payload.base64Data || "";

      if (!base64Data) {
        return jsonResponse_({ success: false, error: "Data berkas (base64) kosong." });
      }

      if (base64Data.indexOf(",") !== -1) {
        base64Data = base64Data.split(",")[1];
      }

      var bytes = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(bytes, mimeType, fileName);

      var root = getOrCreateFolder_(ROOT_FOLDER_NAME, null);
      var targetFolder = getOrCreateFolder_(category, root);
      var file = targetFolder.createFile(blob);

      if (payload.description) {
        try {
          file.setDescription(String(payload.description));
        } catch (descErr) {}
      }

      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (permErr) {}

      var fileId = file.getId();
      return jsonResponse_({
        success: true,
        fileId: fileId,
        folderId: targetFolder.getId(),
        fileName: file.getName(),
        driveUrl: "https://drive.google.com/file/d/" + fileId + "/view",
        downloadUrl: "https://drive.google.com/uc?id=" + fileId + "&export=download"
      });
    }

    if (action === "delete") {
      if (!payload.fileId) {
        return jsonResponse_({ success: false, error: "fileId wajib disertakan." });
      }
      var fileToDelete = DriveApp.getFileById(payload.fileId);
      fileToDelete.setTrashed(true);
      return jsonResponse_({ success: true, fileId: payload.fileId });
    }

    return jsonResponse_({ success: false, error: "Action POST tidak dikenali: " + action });
  } catch (err) {
    return jsonResponse_({ success: false, error: err.message || String(err) });
  }
}
`;

/**
 * Get saved Google Apps Script Web App URL from localStorage settings
 */
export function getAppsScriptUrl(): string {
  try {
    const raw = localStorage.getItem('sipas_settings');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    const url = parsed?.googleDriveConfig?.appsScriptUrl;
    if (typeof url === 'string' && url.trim().startsWith('https://script.google.com/')) {
      return url.trim();
    }
    return '';
  } catch {
    return '';
  }
}

export function isAppsScriptConfigured(): boolean {
  return Boolean(getAppsScriptUrl());
}

/**
 * Returns true if either Google Apps Script Web App OR Firebase Google Drive API is ready
 */
export function isAnyDriveUploadConnected(): boolean {
  return isAppsScriptConfigured() || isGoogleDriveConnected();
}

export interface AppsScriptPingResult {
  success: boolean;
  message: string;
  ownerEmail?: string;
  rootFolderId?: string;
  rootFolderUrl?: string;
  subfolders?: Record<string, { id: string; url: string }>;
}

/**
 * Test connectivity to a Google Apps Script Web App URL (?action=ping)
 */
export async function testAppsScriptConnection(url: string): Promise<AppsScriptPingResult> {
  const cleanUrl = url.trim();
  if (!cleanUrl.startsWith('https://script.google.com/')) {
    return {
      success: false,
      message: 'URL harus diawali dengan https://script.google.com/macros/s/.../exec',
    };
  }

  try {
    const separator = cleanUrl.includes('?') ? '&' : '?';
    const res = await fetch(`${cleanUrl}${separator}action=ping`, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!res.ok) {
      return {
        success: false,
        message: `Server Google Apps Script merespons kode ${res.status}. Pastikan akses Web App diatur ke "Anyone" (Siapa saja).`,
      };
    }

    const data = await res.json();
    if (!data.success) {
      return {
        success: false,
        message: data.error || 'Respons Apps Script tidak valid.',
      };
    }

    return {
      success: true,
      message: 'Koneksi Google Apps Script berhasil! Folder otomatis siap di Google Drive.',
      ownerEmail: data.ownerEmail,
      rootFolderId: data.rootFolderId,
      rootFolderUrl: data.rootFolderUrl,
      subfolders: data.subfolders,
    };
  } catch (err: any) {
    return {
      success: false,
      message:
        err?.message ||
        'Gagal terhubung ke URL Apps Script. Pastikan URL benar (/exec), sudah dideploy sebagai Web App, dan akses diatur ke "Anyone".',
    };
  }
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64Part = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64Part);
    };
    reader.onerror = () => reject(new Error('Gagal membaca isi berkas lokal.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload real file to Google Drive through Google Apps Script Web App bridge
 * Uses Content-Type: text/plain;charset=utf-8 to avoid CORS preflight OPTIONS failure on GAS.
 */
export async function uploadFileViaAppsScript(
  file: File,
  category: DriveCategory,
  description?: string,
  customUrl?: string
): Promise<GoogleDriveMetadata> {
  const endpoint = (customUrl || getAppsScriptUrl()).trim();
  if (!endpoint) {
    throw new Error('URL Web App Google Apps Script belum dikonfigurasi.');
  }

  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Ukuran berkas melebihi batas unggahan 25 MB untuk jembatan Apps Script.');
  }

  const base64Data = await readFileAsBase64(file);

  const res = await fetch(endpoint, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'upload',
      category,
      fileName: file.name,
      mimeType: file.type || 'application/pdf',
      base64Data,
      description: description || `Dokumen ${category} MI Ma'arif Al Ihsan Soborejo`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Unggahan Apps Script gagal dengan status HTTP ${res.status}.`);
  }

  const result = await res.json();
  if (!result.success || !result.fileId) {
    throw new Error(result.error || 'Apps Script gagal menyimpan berkas ke Google Drive.');
  }

  return {
    fileId: result.fileId,
    folderId: result.folderId,
    fileName: result.fileName || file.name,
    fileSize: file.size,
    fileType: file.type || 'application/pdf',
    driveUrl: result.driveUrl || `https://drive.google.com/file/d/${result.fileId}/view`,
    downloadUrl: result.downloadUrl || `https://drive.google.com/uc?id=${result.fileId}&export=download`,
    uploadedAt: new Date().toISOString(),
    textContent: description || file.name,
  };
}

/**
 * Trash a file on Google Drive via Google Apps Script Web App
 */
export async function deleteFileViaAppsScript(
  fileId: string,
  customUrl?: string
): Promise<boolean> {
  const endpoint = (customUrl || getAppsScriptUrl()).trim();
  if (!endpoint || !fileId) return false;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'delete',
        fileId,
      }),
    });

    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

/**
 * Smart uploader: prefers Google Apps Script Web App (no Firebase needed),
 * falls back to Firebase Google Drive API if authenticated.
 */
export async function uploadFileSmart(
  file: File,
  category: DriveCategory,
  description?: string
): Promise<GoogleDriveMetadata> {
  if (isAppsScriptConfigured()) {
    return uploadFileViaAppsScript(file, category, description);
  }
  if (isGoogleDriveConnected()) {
    return uploadFileToGoogleDrive(file, category, description);
  }
  throw new Error('Tidak ada metode unggah Google Drive otomatis yang aktif.');
}

/**
 * Smart delete with confirmation: routes to Apps Script or Firebase Drive API
 */
export async function deleteFileSmart(fileId: string, fileName: string): Promise<boolean> {
  if (!fileId || fileId.startsWith('1gdrive-') || fileId.startsWith('gdrive-link-')) {
    return true;
  }

  if (isAppsScriptConfigured()) {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin memindahkan berkas "${fileName}" ke Sampah Google Drive madrasah?`
    );
    if (!confirmed) return false;
    return deleteFileViaAppsScript(fileId);
  }

  if (isGoogleDriveConnected()) {
    return deleteFileFromGoogleDrive(fileId, fileName);
  }

  return false;
}
