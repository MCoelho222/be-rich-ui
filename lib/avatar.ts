/** Profile photos: the browser crops and shrinks them before upload (api.md §5, PUT /me/avatar). */

const SIZE = 256;
const QUALITY = 0.85;
/** The API keeps at most 200 KB; a 256px JPEG is ~15–40 KB, so this only guards odd cases. */
const MAX_OUTPUT_BYTES = 200_000;
/** Refuse huge source files before decoding them. */
export const MAX_INPUT_BYTES = 20 * 1024 * 1024;

export class AvatarFileError extends Error {
  constructor(readonly reason: "type" | "size" | "decode") {
    super(reason);
  }
}

/** Center-crops the image to a square and returns a 256×256 JPEG data URL. */
export async function avatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new AvatarFileError("type");
  if (file.size > MAX_INPUT_BYTES) throw new AvatarFileError("size");

  let bitmap: ImageBitmap;
  try {
    // Honors EXIF orientation, so phone photos aren't sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new AvatarFileError("decode");
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new AvatarFileError("decode");
  // JPEG has no alpha: give transparent PNGs a white background instead of black.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, SIZE, SIZE);
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, sx, sy, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();

  const url = canvas.toDataURL("image/jpeg", QUALITY);
  // base64 is 4/3 the size of the bytes it encodes.
  if ((url.length - url.indexOf(",") - 1) * 0.75 > MAX_OUTPUT_BYTES) {
    throw new AvatarFileError("size");
  }
  return url;
}
