import path from "path";
import { Storage } from "@google-cloud/storage";
import { Service } from "typedi";
import { INewUploadFile } from "../../interfaces/IUploadFile";
import Sharp from "sharp";
import { SUPPORTED_IMAGE_EXTENSIONS } from "../../helpers/constants/supported_extensions";
import { stripSpecialCharacters } from "../../helpers/utils/strip_special_characters";
import heicConvert from "heic-convert";
@Service()
export class CloudStorage {
  private storage = new Storage({
    projectId: process.env.GOOGLE_PROJECT_ID,
    keyFilename: "google_service_account.json",
  });

  private bucket = this.storage.bucket(process.env.GOOGLE_BUCKET_NAME);

  public async uploadFile(
    fileToUpload: INewUploadFile
  ): Promise<INewUploadFile> {
    try {
      let resizedBuffer = fileToUpload.file.data;

      const fileNameNoExtension = path.parse(fileToUpload.file.name).name;
      const fileExtension: any = path
        .parse(fileToUpload.file.name)
        .ext.toLowerCase();

      if (SUPPORTED_IMAGE_EXTENSIONS.includes(`${fileExtension}`)) {
        console.log("this is a supported image, and will be converted!");
        if (fileExtension.toLowerCase() === ".heic") {
          const outputBuffer = await heicConvert({
            buffer: resizedBuffer,
            format: "JPEG",
            quality: 1,
          });

          resizedBuffer = await Sharp(outputBuffer)
            .resize({ width: 1200, height: 1200, fit: "inside" })
            .toFormat("jpeg")
            .toBuffer();
        } else {
          resizedBuffer = await Sharp(resizedBuffer)
            .withMetadata() // keep metadata (EXIF, etc)
            .rotate() // auto-rotate based on the orientation tag
            .resize({
              fit: "inside",
              width: 1200,
              height: 1200,
              //Not specifying the height would keep the aspect ratio, and vice versa.
            })
            // .toFormat("png")
            .toFormat(fileExtension.replace(".", "").toString())
            .toBuffer();
        }

        console.log("image conversion finished!");
      } else {
        console.log(
          "this was either not an image, or the image is not supported. conversion skipped!"
        );
      }

      const sanitizedFileName = `${stripSpecialCharacters({
        sourceString: fileNameNoExtension,
      })}${fileExtension.toLowerCase() === ".heic" ? ".jpeg" : fileExtension}`;
      const dir = `${fileToUpload.directory}/${fileToUpload.type}/${sanitizedFileName}`;

      const fileToSave = this.bucket.file(dir);
      // const fileUrl = fileToSave.publicUrl();
      await fileToSave.save(resizedBuffer);

      return {
        ...fileToUpload,
        directory: dir,
        url: `${process.env.GOOGLE_STORAGE_URL}/${process.env.GOOGLE_BUCKET_NAME}/${dir}`,
      };
    } catch (e) {
      throw e;
    }
  }

  public async uploadFiles(files: INewUploadFile[]) {
    let responses: INewUploadFile[] = [];

    for (const file of files) {
      try {
        responses.push(await this.uploadFile(file));
      } catch (e) {
        console.error("🔥 Error uploading file:", e);
      }
    }

    //TODO put logic to make sure this was successful

    return responses;
  }

  public async getBucketMetadata() {
    const [metadata] = await this.storage
      .bucket(process.env.GOOGLE_BUCKET_NAME)
      .getMetadata();

    console.info(
      `Bucket ${process.env.GOOGLE_BUCKET_NAME} was updated with a CORS config:`,
      metadata
    );
  }

  public async configureBucketCors() {
    const options = [
      {
        origin: ["*"],
        method: ["*"],
        responseHeader: ["*"],
        // maxAgeSeconds: 3600,
      },
    ];

    await this.storage
      .bucket(process.env.GOOGLE_BUCKET_NAME)
      .setCorsConfiguration(options);

    console.info(
      `Bucket ${process.env.GOOGLE_BUCKET_NAME} was updated with a CORS config:`,
      options
    );
  }

  public deleteFile(file_path: string) {
    try {
      return this.bucket.file(file_path).delete();
    } catch (error) {
      console.error("Failed to delete file on bucket", error);
    }
  }
}
