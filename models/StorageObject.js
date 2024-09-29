/**
 * Class representing a storage object in BunnyCDN.
 */
class StorageObject {
  /**
   * Create a StorageObject.
   * @param {guid} guid - The unique GUID of the file.
   * @param {guid} userId - The ID of the BunnyCDN user that holds the file.
   * @param {Date} dateCreated - The date when the file was created.
   * @param {Date} lastChanged - The date when the file was last modified.
   * @param {string} storageZoneName - The name of the storage zone to which the file is linked.
   * @param {string} path - The path to the object.
   * @param {string} objectName - The name of the object.
   * @param {number} length - The total size of the object in bytes.
   * @param {boolean} isDirectory - True if the object is a directory.
   * @param {number} serverId - The ID of the storage server that the file resides on.
   * @param {number} storageZoneId - The ID of the storage zone that the object is linked to.
   */
  constructor(
    guid,
    userId,
    dateCreated,
    lastChanged,
    storageZoneName,
    path,
    objectName,
    length,
    isDirectory,
    serverId,
    storageZoneId,
  ) {
    /** @type {guid} */
    this.guid = guid;

    /** @type {guid} */
    this.userId = userId;

    /** @type {Date} */
    this.dateCreated = dateCreated;

    /** @type {Date} */
    this.lastChanged = lastChanged;

    /** @type {string} */
    this.storageZoneName = storageZoneName;

    /** @type {string} */
    this.path = path;

    /** @type {string} */
    this.objectName = objectName;

    /** @type {number} */
    this.length = length;

    /** @type {boolean} */
    this.isDirectory = isDirectory;

    /** @type {number} */
    this.serverId = serverId;

    /** @type {number} */
    this.storageZoneId = storageZoneId;
  }

  /**
   * Get the full path to the file.
   * @returns {string} The full path to the file.
   */
  get fullPath() {
    return this.path + this.objectName;
  }
}

module.exports = StorageObject;
