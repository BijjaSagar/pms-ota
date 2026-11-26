import QRCode from 'qrcode';

export async function getReviewQrDataUrl(value) {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: { dark: '#1c2b2d', light: '#ffffff' },
  });
}
