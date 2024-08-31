export function base64ToPngBlob(base64Data: string): Blob {
    const base64WithoutPrefix = base64Data.replace(/^data:image\/png;base64,/, '');

    const byteCharacters = atob(base64WithoutPrefix);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    return new Blob([byteArray], { type: 'image/png' });
}

function base64ToPngFile(base64Data: string, filename: string): File {
    const blob = base64ToPngBlob(base64Data);
    return new File([blob], filename, { type: 'image/png' });
}