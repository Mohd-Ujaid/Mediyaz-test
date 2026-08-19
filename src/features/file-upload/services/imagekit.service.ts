import ImageKit from "imagekit";

if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
  console.warn("ImageKit environment variables are missing. Please add them to .env.local");
}

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "dummy_public_key",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "dummy_private_key",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/dummy",
});

export async function uploadToImageKit(
  file: Buffer | string,
  folder: string,
  fileName: string
) {
  const rootFolder = process.env.IMAGEKIT_FOLDER || "MyProject";
  const cleanFolder = `/${rootFolder}/${folder}`.replace(/\/+/g, "/");

  return imagekit.upload({
    file,
    fileName,
    folder: cleanFolder,
  });
}

export async function deleteFromImageKit(fileId: string) {
  return imagekit.deleteFile(fileId);
}
