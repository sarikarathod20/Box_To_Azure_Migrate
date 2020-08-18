var fs = require('fs');
const path = require('path');
var BoxSDK = require('box-node-sdk');
var azure = require('azure-storage');
var rimraf = require("rimraf");
/* GET users listing. */
//var listItems = [];
let finaldata = [];
let client, blobService,container,host,boxcount=0, azurecount=0;;
async function migrate(AZURE_HOST, AZURE_CONTAINER, AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY, PROXY, BOX_CLIENT_ID, BOX_CLIENT_SECRET_ID, BOX_PRIVATE_KEY, BOX_PUBLIC_KEY_ID, BOX_PRIVATE_KEY_PASSPHRASE, BOX_ENTERPRISE_ID, BOX_PARENT_FOLDER) {
  blobService = azure.createBlobService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
  blobService.setProxy(PROXY);
  container = AZURE_CONTAINER;
  host = AZURE_HOST;
  var boxClientID = BOX_CLIENT_ID;
  var boxClientSecret = BOX_CLIENT_SECRET_ID;
  var privateKey = BOX_PRIVATE_KEY.replace(/\\n/gm, '\n');
  var publicKeyId = BOX_PUBLIC_KEY_ID;
  var publicKeyPassphrase = BOX_PRIVATE_KEY_PASSPHRASE;
  var boxEnterpriseId = BOX_ENTERPRISE_ID;


  var sdk = new BoxSDK({
    clientID: boxClientID,
    clientSecret: boxClientSecret,
    appAuth: {
      keyID: publicKeyId,
      privateKey: privateKey,
      passphrase: publicKeyPassphrase
    },
    request: {
      // Set the proxy URL here!
      proxy: PROXY
    }
  });

  console.log(boxEnterpriseId, boxClientID, publicKeyPassphrase, publicKeyId, privateKey, boxClientSecret);
  client = sdk.getAppAuthClient('enterprise', boxEnterpriseId);
  client._useIterators = true;
  let folderId = BOX_PARENT_FOLDER;
  let folderName;
  let localFolderPath;

  const folderInfo = await client.folders.get(folderId);
  const childFiles = await getChildFiles(folderInfo.item_collection.entries, AZURE_HOST, AZURE_CONTAINER);
  return childFiles;
}
async function getChildFiles(values, AZURE_HOST, AZURE_CONTAINER) {
  //const files = await getFilePaths();

  let listItems = await Promise.all(values.map(async (data) => {
    const file = await client.folders.getItems(data.id, { limit: 1000 });

    return file.buffer.map((buffer) => {
      return {
        folderid: data.id,
        foldername: data.name,
        fileid: buffer.id,
        filename: buffer.name,
        filepath: `${buffer.id}/${buffer.name}`
      }
    })

  }));

  listItems = listItems.reduce(function (prev, curr) {
    return prev.concat(curr);
  });


  return downloadresult(listItems, AZURE_HOST, AZURE_CONTAINER)

}
async function downloadresult(listItems, AZURE_HOST, AZURE_CONTAINER) {
  return new Promise(async (resolve, reject) => { 
  let finaldata = await Promise.all(listItems.map(async (folderfile, index) => {
    let localFolder = createLocalFolder(folderfile.foldername);
    let localFolderPath = localFolder.localFolderName;
    const stream = await client.files.getReadStream(folderfile.fileid, null);
    let output = fs.createWriteStream(
      path.join(localFolderPath, folderfile.filename)
    );
    stream.pipe(output);
    boxcount = boxcount + 1;
    return {
      oldpath: `${folderfile.fileid}/${folderfile.filename}`,
      localpath: output.path,
      filename: folderfile.filename,
      folderpath: `Docs/${folderfile.foldername}/${folderfile.filename}`,
      azurepath: ''
    }
  }));

 // await Promise.all(finaldata.map(async (folderfile, index) => {
  parallelizeTasks(finaldata, (nextTask, value) => {
      op(value, nextTask);
    }, function() {
      let localFolderNamex = ('Docs/');
      rimraf(localFolderNamex, function () { console.log("done"); });
      var obj = {};
      obj.url = finaldata;
      obj.boxCount = boxcount;
      obj.azureCount = azurecount;
      resolve(obj);
  });

});
}

function op (data,cb) {
  blobService.createBlockBlobFromLocalFile(container, data.folderpath, data.folderpath, async function (error, result, response) {
    if (error) {
      cb();
      console.log('blob error=>', error);
    }
    else {
      var url = await blobService.getUrl(container, `${data.folderpath}`, null, host);
      data.azurepath = url;
      azurecount = azurecount + 1;
      cb();
    }
  });
}

function parallelizeTasks(arr, fn, done)
{
    var total = arr.length,
    doneTask = function() {
      if (--total === 0) {
        done();
      }
    };

    arr.forEach(function(value) {
      fn(doneTask, value);
    });
}

// function serializeTasks(arr, fn, done) {
//     var current = 0;

//     fn(function iterate() {
//         if (++current < arr.length) {
//             fn(iterate, arr[current]);
//         } else {
//             done();
//         }
//     }, arr[current]);
// }

function createLocalFolder(folderName) {
  let localFolderName = path.join('Docs/', folderName);
  var create = true;
  try {
    fs.mkdirSync(localFolderName, { recursive: true });
    create = true;
  } catch (e) {
    if (e.code === "EEXIST") {
      resetLocalFolder(localFolderName);
      create = false;
    } else {
      throw e;
    }
  }
  var obj = {};
  obj.create = create;
  obj.localFolderName = localFolderName;
  return obj;
}

function resetLocalFolder(localFolderName) {
  if (fs.existsSync(localFolderName)) {
    //console.log('is exist');
  }
}
//code for Box Migration Ends here

module.exports = {
  migrate,
}
