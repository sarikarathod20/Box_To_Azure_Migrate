# box-azure-migrate

Node.js package for Migrating Files/Folders from Box Application to Azure Storage

v0.0.1

## Installation

```
npm install box-azure-migrate --save
```


## Getting started

### 1. Usage



| Environment Variable   | Required? | Value                            |
| ---------------------- | --------- | -----------------------------------      |
| `PROXY`            | **No**   | It requires if you have proxy set up  |  
| `AZURE_HOST`            | **Yes**   | Name of you storage host i.e https://xxxxxxxxxx.blob.core.windows.net |             
| `AZURE_CONTAINER`            | **Yes**   | Name of the container where files will be stored |             
| `AZURE_STORAGE_ACCOUNT`            | **Yes**   | |          
| `AZURE_STORAGE_ACCESS_KEY`            | **Yes**   | Azure Storage Account name |     
| `AZURE_STORAGE_CONNECTION_STRING`            | **Yes**   | Azure Storage connection string |      
| `BOX_CLIENT_ID`            | **Yes**   | Box ClientID  |  
| `BOX_CLIENT_SECRET_ID`            | **Yes**   | BOX_CLIENT_SECRET_ID  | 
| `BOX_ENTERPRISE_ID`            | **Yes**   |  BOX_ENTERPRISE_ID | 
| `BOX_PARENT_FOLDER`            | **Yes**   | BOX_PARENT_FOLDER  | 
| `BOX_PRIVATE_KEY`            | **Yes**   | BOX_PRIVATE_KEY  | 
| `BOX_PRIVATE_KEY_PASSPHRASE`            | **Yes**   | BOX_PRIVATE_KEY_PASSPHRASE  | 
| `BOX_PUBLIC_KEY_ID`            | **Yes**   | BOX_PUBLIC_KEY_ID  | 

### 3. Usage

***Method Name : migrate*** - Used to migrate data from your box to azure storage

```javascript
var BoxAzureMigrateAPU = require('box-azure-migrate');

// All the enviornment variable mentioned will be set in .env file
const AzureURL = await BoxAzureMigrateAPI.migrate(AZURE_HOST,AZURE_CONTAINER,AZURE_STORAGE_ACCOUNT,AZURE_STORAGE_ACCESS_KEY,PROXY,BOX_CLIENT_ID,BOX_CLIENT_SECRET_ID,BOX_PRIVATE_KEY,BOX_PRIVATE_KEY_ID,BOX_PRIVATE_KEY_PASSPHRASE,BOX_ENTERPRISE_ID,BOX_PARENT_FOLDER);

if (!!AzureURL) {
    console.log("Get Azure URL ==>", AzureURL);
}

```

### 4. Usage Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

### 5. Usage Contributing
[MIT](https://choosealicense.com/licenses/mit/)
