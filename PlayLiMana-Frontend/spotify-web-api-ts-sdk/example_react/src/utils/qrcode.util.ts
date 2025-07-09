import QRCode from "qrcode";

/**
 * Generates a QR-Code as data URL from a string.
 * @param text Text to be encoded.
 * @returns Promise with data URL (Image).
 */
export async function generateQRCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 2,
      width: 200,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("QR-Code Generierung fehlgeschlagen:", error);
    return "";
  }
}
