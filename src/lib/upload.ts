import { API_BASE_URL } from "./auth";

export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export async function uploadFileInChunks(
    file: File,
    token: string,
    onProgress: (progress: number) => void
): Promise<string> {
    const fileSize = file.size;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    const uploadUuid: string = crypto.randomUUID();
    const filename = file.name;

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(fileSize, start + CHUNK_SIZE);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('filename', filename);
        formData.append('chunk_index', i.toString());
        formData.append('total_chunks', totalChunks.toString());
        formData.append('upload_uuid', uploadUuid);

        const progress = Math.floor(((i + 1) / totalChunks) * 100);
        onProgress(progress);

        const response = await fetch(`${API_BASE_URL}/records/upload/chunk`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Chunk upload failed: ${errorData.message || response.statusText}`);
        }
    }

    return uploadUuid;
}
