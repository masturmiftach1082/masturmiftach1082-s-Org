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
