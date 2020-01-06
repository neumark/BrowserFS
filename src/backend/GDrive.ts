import PreloadFile from '../generic/preload_file';
import {BaseFileSystem, FileSystem, BFSOneArgCallback, BFSCallback, FileSystemOptions} from '../core/file_system';
import {FileFlag} from '../core/file_flag';
import {default as Stats} from '../core/node_fs_stats';
//import {ApiError, ErrorCode} from '../core/api_error';
import {File} from '../core/file';
// import {arrayBuffer2Buffer, buffer2ArrayBuffer} from '../core/util';
import {drive_v3} from 'googleapis';
// import setImmediate from '../generic/setImmediate';
// import {dirname} from 'path';


export class GDriveFile extends PreloadFile<GDriveFileSystem> implements File {
    constructor(_fs: GDriveFileSystem, _path: string, _flag: FileFlag, _stat: Stats, contents?: Buffer) {
      super(_fs, _path, _flag, _stat, contents);
    }
  
    public sync(cb: BFSOneArgCallback): void {
      //this._fs._syncFile(this.getPath(), this.getBuffer(), cb);
    }
  
    public close(cb: BFSOneArgCallback): void {
      this.sync(cb);
    }
  }
  
  /**
   * Options for the Dropbox file system.
   */
  export interface GDriveFileSystemOptions {
    // An *authenticated* gapi.client object
    client: drive_v3.Drive;
  }

export default class GDriveFileSystem extends BaseFileSystem implements FileSystem {
    public static readonly Name = "GDrive";
  
    public static readonly Options: FileSystemOptions = {
      client: {
        type: "object",
        description: "An *authenticated* gapi client."
      }
    };
  
    /**
     * Creates a new DropboxFileSystem instance with the given options.
     * Must be given an *authenticated* Dropbox client from 2.x JS SDK.
     */
    public static Create(opts: GDriveFileSystemOptions, cb: BFSCallback<GDriveFileSystem>): void {
      cb(null, new GDriveFileSystem(opts.client));
    }
  
    public static isAvailable(): boolean {
      // Checks if the gapi library is loaded.
      return typeof (<any>global).gapi !== 'undefined';
    }
  
    private _client: drive_v3.Drive;
  
    private constructor(client: drive_v3.Drive) {
      super();
      this._client = client;
    }
  
    public getName(): string {
      return GDriveFileSystem.Name;
    }
  
    public isReadOnly(): boolean {
      return false;
    }
  
    // Dropbox doesn't support symlinks, properties, or synchronous calls
    // TODO: does it???
  
    public supportsSymlinks(): boolean {
      return false;
    }
  
    public supportsProps(): boolean {
      return false;
    }
  
    public supportsSynch(): boolean {
      return false;
    }

    /**
   * Deletes *everything* in the file system. Mainly intended for unit testing!
   * @param mainCb Called when operation completes.
   */
  public empty(mainCb: BFSOneArgCallback): void {    
    console.log("TODO: stub(GDrive.empty)", this._client);
    mainCb();    
  }
  
}