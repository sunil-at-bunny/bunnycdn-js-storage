# BunnyCDN.JS.Storage

The official Node.js library used for interacting with the BunnyCDN Storage API.

### How to use:

The storage library is very simple to use. First, create the basic BunnyCDNStorage object with the authentication details. It's the basic object for interaction with the API.

```javascript
const {
  BunnyCDNStorage,
  StorageRegion,
} = require("@bunnyway/bunnycdn-js-storage");
const client = new BunnyCDNStorage("name", "key", StorageRegion.Falkenstein);
```

or

```javascript
const { BunnyCDNStorage } = require("@bunnyway/bunnycdn-js-storage");
const client = new BunnyCDNStorage("name", "key", "de");
```

The BunnyCDNStorage constructor takes the following parameters:

- **storageZoneName** - The name of your storage zone
- **apiAccessKey** - The API access key (password)
- **storageZoneRegion** - (Optional) The storage zone region code. By default, `de` (Falkenstein) is selected. Use the `StorageRegion` class to specify the region if you're unsure.

### Navigation:

- [How to use:](#how-to-use)
- [Uploading objects:](#uploading-objects)
- [Listing objects:](#listing-objects)
- [Downloading objects:](#downloading-objects)
- [Deleting objects:](#deleting-objects)

<br/>

## Uploading objects:

Uploading only supports reading directly from a local file path. If the path to the object does not exist on storage, it will be automatically created.

**Uploading from a stream**

```javascript
await client.upload("test.png", "/storagezonename/test.png");
```

**Uploading with checksum verification**

```javascript
// Providing the hash
await client.upload(
  "/local/path/to/file.txt",
  "/storagezonename/helloworld.txt",
  true,
  "d04b98f48e8f8bcc15c6ae5ac050801cd6dcfd428fb5f9e65c4e16e7807340fa",
);
// Auto generating the hash
await client.upload(
  "/local/path/to/file.txt",
  "/storagezonename/helloworld.txt",
  true,
);
```

<br/>

## Listing objects:

Get a list of all objects on the given path. Returns a List<StorageObject> collection.

```javascript
const objects = await client.list("/storagezonename/");
```

The StorageObject contains the following properties:

- **Guid** - The unique GUID of the file
- **UserId** - The ID of the BunnyCDN user that holds the file
- **DateCreated** - The date when the file was created
- **LastChanged** - The date when the file was last modified
- **StorageZoneName** - The name of the storage zone to which the file is linked
- **Path** - The path to the object
- **ObjectName** - The name of the object
- **Length** - The total of the object in bytes
- **IsDirectory** - True if the object is a directory, otherwise false.
- **ServerId** - The ID of the storage server that the file resides on
- **StorageZoneId** - The ID of the storage zone that the object is linked to
- **FullPath** - The full path to the file

<br/>

## Downloading objects:

Downloading supports either loading into a stream or saving directly to a local file.

**Download as a stream**

```javascript
await client.downloadAsStream("/storagezonename/helloworld.txt");
```

**Download as a file**

```javascript
await client.download(
  "/storagezonename/helloworld.txt",
  "local/file/path/helloworld.txt",
);
```

<br/>

## Deleting objects:

Deleting supports both files and directories. If the target object is a directory, the directory content will also be deleted.

```javascript
// delete file
await client.delete("/storagezonename/helloworld.txt");
// delete folder
await client.deleteFolder("/storagezonename/helloworld.txt");
```
