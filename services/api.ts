
export const apiService = {
  async ingestDocument(token: string, file: File) {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });

    const base64Data = await base64Promise;

    const response = await fetch('/api/ingest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        base64Data: base64Data
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Backend ingestion failed');
    }

    return await response.json();
  }
};
