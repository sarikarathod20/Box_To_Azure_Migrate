var fs = require('fs');
const path = require('path');
var BoxSDK = require('box-node-sdk');
var azure = require('azure-storage');
var rimraf = require("rimraf");

var listItems = [];
let finaldata = [];

function migrate(AZURE_HOST,AZURE_CONTAINER,AZURE_STORAGE_ACCOUNT,AZURE_STORAGE_ACCESS_KEY,PROXY,BOX_CLIENT_ID,BOX_CLIENT_SECRET_ID,BOX_PRIVATE_KEY,BOX_PUBLIC_KEY_ID,BOX_PRIVATE_KEY_PASSPHRASE,BOX_ENTERPRISE_ID,BOX_PARENT_FOLDER) {
  var blobService = azure.createBlobService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
  blobService.setProxy(PROXY);
  
  var boxClientID = BOX_CLIENT_ID;
  var boxClientSecret = BOX_CLIENT_SECRET_ID;
  var privateKey =BOX_PRIVATE_KEY.replace(/\\n/gm, '\n');
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
      proxy:  PROXY
    }
  });
  console.log(boxEnterpriseId, boxClientID, publicKeyPassphrase, publicKeyId, privateKey, boxClientSecret);
  var client = sdk.getAppAuthClient('enterprise', boxEnterpriseId);
  client._useIterators = true;
  let folderId = BOX_PARENT_FOLDER;
  let folderName;
  let localFolderPath;
  
  client.folders.get(folderId, null)
    .then(folderInfo => {
      folderName = folderInfo.name;
      getChildFiles(folderInfo.item_collection.entries,AZURE_HOST,AZURE_CONTAINER );
    })
}
  async function getChildFiles(values,AZURE_HOST,AZURE_CONTAINER ) {
    //const files = await getFilePaths();
  
    await Promise.all(values.map(async (data) => {
      const contents = await client.folders.getItems(data.id, { limit: 1000 }).then(val => {
  
  
        for (var i = 0; i < val.buffer.length; i++) {
          var obj = {};
          obj.folderid = data.id;
          obj.foldername = data.name;
          obj.fileid = val.buffer[i].id;
          obj.filename = val.buffer[i].name;
          obj.filepath = `${val.buffer[i].id}/${val.buffer[i].name}`;
          listItems.push(obj);
        }
  
      })
  
      // console.log(contents)
    })).then(function () {
  
    });
  
    downloadresult(listItems, AZURE_HOST,AZURE_CONTAINER )
  
  }
  async function downloadresult(listItems,AZURE_HOST,AZURE_CONTAINER) {
  
    await Promise.all(listItems.map(async (folderfile, index) => {
      let localFolder = createLocalFolder(folderfile.foldername);
      let localFolderPath = localFolder.localFolderName;
  
      await (client.files.getReadStream(folderfile.fileid, null).then(stream => {
        let output = fs.createWriteStream(
          path.join(localFolderPath, folderfile.filename)
        );
        var obj = {};
        obj.oldpath = `${folderfile.fileid}/${folderfile.filename}`;
        obj.localpath = output.path;
        obj.filename = folderfile.filename;
        obj.folderpath = `Docs/${folderfile.foldername}/${folderfile.filename}`;
        obj.azurepath = '';
        finaldata.push(obj);
        stream.pipe(output);
      }))
    })).then(async function () {
  
      var hostName = AZURE_HOST;
      var container = AZURE_CONTAINER;
      await Promise.all(finaldata.map(async (folderfile, index) => {
        (blobService.createBlockBlobFromLocalFile(container, finaldata[index].folderpath, finaldata[index].folderpath, async function (error, result, response) {
          if (error) {
            console.log('bolob error=>', error);
          }
          else {
            var url = await blobService.getUrl(container, `${finaldata[index].folderpath}`, null, hostName);
            console.log('url ==> ', url);
            finaldata[index].azurepath = url;
          }
        }))
      })).then(function () {
        let localFolderNamex = path.join(__dirname, '../Docs/');
        rimraf(localFolderNamex, function () { console.log("done"); });
        res.send('Migration Complete');
      })
    }).then(function () {
    })
  }
  
  function createLocalFolder(folderName) {
    let localFolderName = path.join(__dirname, '../Docs/', folderName);
    var create = true;
    try {
      fs.mkdirSync(localFolderName, {recursive: true});
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
  


