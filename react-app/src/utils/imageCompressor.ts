/**
 * Compresses an image file or base64 string to an optimized JPEG
 * so it stays well within Firestore's 1MB document size limit.
 */
export async function compressImage(
  fileOrBase64: File | string,
  maxWidth = 1000,
  maxHeight = 750,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve) => {
    // If it's already an http/https external URL, keep it as-is
    if (typeof fileOrBase64 === 'string' && (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://'))) {
      resolve(fileOrBase64);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        if (width / maxWidth > height / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original string if canvas context fails
        resolve(typeof fileOrBase64 === 'string' ? fileOrBase64 : '');
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };

    img.onerror = () => {
      // Fallback
      resolve(typeof fileOrBase64 === 'string' ? fileOrBase64 : '');
    };

    if (fileOrBase64 instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(fileOrBase64);
    } else {
      img.src = fileOrBase64;
    }
  });
}
