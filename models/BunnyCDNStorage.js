const fs = require("fs");
const { PassThrough } = require("stream");

const Checksum = require("./Checksum");
const StorageObject = require("./StorageObject");
const stream = require("stream");
/**
 * Create a BunnyCDNStorage instance.
 * @param {string} storageZoneName - The name of the storage zone.
 * @param {string} apiAccessKey - The API access key.
 * @param {string} [mainRegion='de'] - The main region.
 */
class BunnyCDNStorage {
  constructor(storageZoneName, apiAccessKey, mainRegion = "de") {
    this.apiAccessKey = apiAccessKey;
    this.storageZoneName = storageZoneName;
    this.baseAddress = this.#getBaseAddress(mainRegion);
  }

  /**
   * Delete a file or folder from BunnyCDN storage.
   * @param {string} path - The path of the file or folder to delete.
   * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating success.
   */

  async delete(path) {
    const normalizedPath = this.#normalizePath(path);
    const response = await fetch(`${this.baseAddress}${normalizedPath}`, {
      method: "DELETE",
      headers: { AccessKey: this.apiAccessKey },
    });
    return response.ok;
  }

  /**
   * Get metadata for a file from BunnyCDN storage.
   * @param {string} path - The path of the file.
   * @returns {Promise<StorageObject>} - A promise that resolves to a StorageObject instance.
   * @throws {Error} - Throws an error if the request fails.
   */

  async get(path) {
    const normalizedPath = this.#normalizePath(path);
    const response = await fetch(`${this.baseAddress}${normalizedPath}`, {
      method: "DESCRIBE",
      headers: { AccessKey: this.apiAccessKey },
    });

    if (response.ok) {
      const item = await response.json();
      return new StorageObject(
        item.Guid,
        item.UserId,
        item.DateCreated,
        item.LastChanged,
        item.StorageZoneName,
        item.Path,
        item.ObjectName,
        item.Length,
        item.IsDirectory,
        item.ServerId,
        item.StorageZoneId,
      );
    } else {
      throw this.#mapResponseToException(response.status, normalizedPath);
    }
  }

  /**
   * List files and folders in a directory in BunnyCDN storage.
   * @param {string} path - The path of the directory.
   * @returns {Promise<StorageObject[]>} - A promise that resolves to an array of StorageObject instances.
   * @throws {Error} - Throws an error if the request fails.
   */

  async list(path) {
    const normalizedPath = this.#normalizePath(path, true);
    const response = await fetch(`${this.baseAddress}${normalizedPath}`, {
      method: "GET",
      headers: { AccessKey: this.apiAccessKey },
    });

    if (response.ok) {
      const responseJson = await response.json();
      return responseJson.map(
        (item) =>
          new StorageObject(
            item.Guid,
            item.UserId,
            item.DateCreated,
            item.LastChanged,
            item.StorageZoneName,
            item.Path,
            item.ObjectName,
            item.Length,
            item.IsDirectory,
            item.ServerId,
            item.StorageZoneId,
          ),
      );
    } else {
      throw this.#mapResponseToException(response.status, normalizedPath);
    }
  }

  /**
   * Uploads a file or stream to the BunnyCDN storage.
   *
   * @param {string|fs.ReadStream} input - The file path or stream to upload.
   * @param {string} storagePath - The path in the storage where the file/stream should be uploaded.
   * @param {boolean} [validateChecksum=false] - Whether to validate the checksum.
   * @param {string|null} [sha256Checksum=null] - The SHA-256 checksum. If null, it will be generated if validateChecksum is true.
   * @param {string} [contentTypeOverride=''] - Override the content type.
   * @returns {Promise<Object>} - A promise that resolves with the response from the BunnyCDN API.
   * @throws {Error} - Throws an error if the input type is invalid.
   */
  async upload(
    input,
    storagePath,
    validateChecksum = false,
    sha256Checksum = null,
    contentTypeOverride = "",
  ) {
    const normalizedPath = this.#normalizePath(storagePath);
    let stream;

    if (typeof input === "string") {
      stream = fs.createReadStream(input);
    } else if (input.pipe) {
      stream = input;
    } else {
      throw new Error("Invalid input type for upload");
    }

    if (validateChecksum && !sha256Checksum) {
      const bufferedData = await this.#bufferStream(stream);
      const checksumStream = new PassThrough();
      checksumStream.end(bufferedData);
      sha256Checksum = await Checksum.generate(checksumStream);
      stream = new PassThrough().end(bufferedData);
    }

    const headers = { AccessKey: this.apiAccessKey };
    if (sha256Checksum) headers["Checksum"] = sha256Checksum;
    if (contentTypeOverride)
      headers["Override-Content-Type"] = contentTypeOverride;

    const response = await fetch(`${this.baseAddress}${normalizedPath}`, {
      method: "PUT",
      headers: headers,
      body: stream,
      duplex: "half",
    });

    if (!response.ok) {
      if (response.status === 400 && sha256Checksum)
        throw new Error(`Checksum mismatch for ${normalizedPath}`);
      throw this.#mapResponseToException(response.status, normalizedPath);
    }

    return await response.json();
  }

  /**
   * Create a folder in BunnyCDN storage.
   * @param {string} path - The path of the folder to create.
   * @returns {Promise<Object>} - A promise that resolves with the response from the BunnyCDN API.
   * @throws {Error} - Throws an error if the request fails.
   */

  async createFolder(path) {
    const normalizedPath = this.#normalizePath(path, true);

    const headers = { AccessKey: this.apiAccessKey };

    const response = await fetch(`${this.baseAddress}${normalizedPath}`, {
      method: "PUT",
      headers: headers,
    });

    if (!response.ok) {
      throw this.#mapResponseToException(response.status, normalizedPath);
    }

    return await response.json();
  }

  /**
   * Delete a folder from BunnyCDN storage.
   * @param {string} path - The path of the folder to delete.
   * @returns {Promise<Object>} - A promise that resolves with the response from the BunnyCDN API.
   * @throws {Error} - Throws an error if the request fails.
   */

  async deleteFolder(path) {
    const normalizedPath = this.#normalizePath(path, true);

    const headers = { AccessKey: this.apiAccessKey };

    const response = await fetch(`${this.baseAddress}${normalizedPath}`, {
      method: "DELETE",
      headers: headers,
    });

    if (!response.ok) {
      throw this.#mapResponseToException(response.status, normalizedPath);
    }

    return await response.json();
  }
  /**
   * Download a file from BunnyCDN storage to a local file path.
   * @param {string} path - The path of the file to download.
   * @param {string} localFilePath - The local file path where the file will be saved.
   * @returns {Promise<fs.WriteStream>} - A promise that resolves with the write stream.
   * @throws {Error} - Throws an error if the request fails.
   */

  async download(path, localFilePath) {
    const normalizedPath = this.#normalizePath(path);
    const response = await fetch(`${this.baseAddress}${normalizedPath}`, {
      method: "GET",
      headers: { AccessKey: this.apiAccessKey },
    });

    if (!response.ok)
      throw this.#mapResponseToException(response.status, normalizedPath);

    const fileStream = fs.createWriteStream(localFilePath);
    stream.pipeline(response.body, fileStream, () => {
      // do nothing
    });

    return fileStream;
  }
  /**
   * Download a file from BunnyCDN storage as a stream.
   * @param {string} path - The path of the file to download.
   * @returns {Promise<ReadableStream>} - A promise that resolves with the readable stream.
   * @throws {Error} - Throws an error if the request fails.
   */

  async downloadAsStream(path) {
    const normalizedPath = this.#normalizePath(path);
    const response = await fetch(`${this.baseAddress}${normalizedPath}`, {
      method: "GET",
      headers: { AccessKey: this.apiAccessKey },
    });

    if (!response.ok)
      throw this.#mapResponseToException(response.status, normalizedPath);

    return response.body;
  }
  /**
   * Normalize a file or directory path.
   * @param {string} path - The path to normalize.
   * @param {boolean} [isDirectory=false] - Whether the path is a directory.
   * @returns {string} - The normalized path.
   * @throws {Error} - Throws an error if the path is invalid.
   */

  #normalizePath(path, isDirectory = false) {
    path = path.trim().replace(/\\/g, "/").replace(/^\/+/, "");
    if (!path.startsWith(`${this.storageZoneName}/`))
      throw new Error(
        `Path validation failed. File path must begin with /${this.storageZoneName}/.`,
      );
    if (isDirectory) path = path.endsWith("/") ? path : `${path}/`;
    return path.replace(/\/+/g, "/");
  }
  /**
   * Map a response status code to an exception.
   * @param {number} statusCode - The status code of the response.
   * @param {string} path - The path associated with the request.
   * @returns {Error} - The corresponding error.
   */

  #mapResponseToException(statusCode, path) {
    switch (statusCode) {
      case 404:
        return new Error(`File not found: ${path}`);
      case 400:
        return new Error("Unable to upload file. Invalid path specified");
      case 401:
        return new Error(
          `Unauthorized access to storage zone: ${this.storageZoneName}`,
        );
      default:
        return new Error("An unknown error has occurred during the request.");
    }
  }
  /**
   * Get the base address for the BunnyCDN storage API.
   * @param {string} mainRegion - The main region.
   * @returns {string} - The base address.
   */

  #getBaseAddress(mainRegion) {
    return mainRegion === "" || mainRegion.toLowerCase() === "de"
      ? "https://storage.bunnycdn.com/"
      : `https://${mainRegion}.storage.bunnycdn.com/`;
  }

  /**
   * Buffer a stream into a single buffer.
   * @param {ReadableStream} stream - The stream to buffer.
   * @returns {Promise<Buffer>} - A promise that resolves to the buffered data.
   */

  async #bufferStream(stream) {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}

module.exports = BunnyCDNStorage;
