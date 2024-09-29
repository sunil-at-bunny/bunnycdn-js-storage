const crypto = require("crypto");

/**
 * Class for generating checksums.
 */
class Checksum {
  /**
   * Generate a SHA-256 checksum from a stream.
   * @param {ReadableStream} stream - The input stream.
   * @returns {Promise<string>} - A promise that resolves to the SHA-256 checksum as a hexadecimal string.
   */
  static async generate(stream) {
    const hash = crypto.createHash("sha256");
    return new Promise((resolve, reject) => {
      stream.on("data", (data) => hash.update(data));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", (err) => reject(err));
    });
  }
}

module.exports = Checksum;
