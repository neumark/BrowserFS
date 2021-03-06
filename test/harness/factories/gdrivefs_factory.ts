/// <reference path="../../../node_modules/@types/gapi.client.drive/index.d.ts" />
import GDriveFileSystem from '../../../src/backend/GDrive';
import {FileSystem} from '../../../src/core/file_system';

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

function gapiLoginFlow(creds: gapi.auth.GoogleApiOAuth2TokenObject):Promise<any> {
  return new Promise((resolve, reject) => (<any>global).gapi.load('client:auth2', resolve))
  .then(() => (<any>global).gapi.client.init({'discoveryDocs': DISCOVERY_DOCS}))
  .then(() => {
    (<any>global).gapi.client.setToken(creds);
    return (<any>global).gapi.client.drive;
  }).then(client => new Promise<GDriveFileSystem>((resolve, reject) => GDriveFileSystem.Create(
    { client },
    (e:any, fs?:GDriveFileSystem) => {
      if (fs) {
        fs.empty((e:any) => {
          if (e) {
            reject(e);
          } else {
            resolve(fs);
          }
        });
    } else {
      reject(e);
    }
  })));
}


export default function GoogleDriveFSFactory(cb: (name: string, obj: FileSystem[]) => void): void {
  console.log("loading google drive fs factory");
  document.addEventListener('DOMContentLoaded', () => {
    console.log("gdrive: DOM ready");
    if (!(<any>global).gapiLoaded) {
      cb('GoogleDrive', []);
    } else {
      (<any>global).gapiLoaded.then(() => {
        console.log("gdrive: GAPI loaded ready");
        if (GDriveFileSystem.isAvailable()) {
          // Authenticate with pregenerated unit testing credentials.
          const req = new XMLHttpRequest();
          req.open('GET', '/test/fixtures/gdrive/token.json');
          req.onerror = (e) => { console.error(req.statusText); throw new Error(`Unable to fetch gdrive tokens: ${req.statusText}`); };
          req.onload = (e) => {
            if (!(req.readyState === 4 && req.status === 200)) {
              console.error(req.statusText);
              throw new Error(`Unable to fetch gdrive tokens: ${req.statusText}`);
            }
            gapiLoginFlow(JSON.parse(req.response).token)
            .then((fs) => {
              cb("GDrive", [fs]);
            }).catch((e:any) => {        
              console.log("gdrive auth error", e);
              throw new Error(`Failed to log in to gdrive`);        
            });
          };
          req.send();
        }
      });    
    };  
  }, false);
}
