import fs from '../../../../src/core/node_fs';
import * as path from 'path';
import assert from '../../../harness/wrapped-assert';

var fileDir = '/rename_file_test',
    file1 = path.resolve(fileDir, 'fun.js'),
    file2 = path.resolve(fileDir, 'fun2.js');

var oldDir = '/rename_test',
    newDir = '/rename_test2';

// file-2-dir and dir-2-file rename
var dir = '/rename_filedir_test',
    file = '/rename_filedir_test.txt';

// cannot rename a directory inside itself
var renDir1 = '/renamedir_1',
    renDir2 = '/renamedir_1/lol';

var promiseCall = (fn:Function, args:any[], errorMessage?:string) => new Promise((resolve, reject) => fn.apply(fs, [...args, (err:any, result:any) => {
  if (err) {    
    reject(errorMessage ? new Error(errorMessage) : err);
  } else {    
    resolve(result);
  }
}]));

export default function() {
  var rootFS = fs.getRootFS(),
      isReadOnly = rootFS.isReadOnly();

  if (isReadOnly) {
    return true;
  }
  /**
   * Creates the following directory structure within the given dir:
   * - _rename_me
   *   - lol.txt
   * - file.dat
   */
  function populate_directory(dir: string) {
    var dir1 = path.resolve(dir, '_rename_me'),
      file1 = path.resolve(dir, 'file.dat'),
      file2 = path.resolve(dir1, 'lol.txt');
    return promiseCall(fs.mkdir, [dir1])
      .then(() => promiseCall(fs.writeFile, [file1, new Buffer('filedata')]))
      .then(() => promiseCall(fs.writeFile, [file2, new Buffer('lololol')]));      
  }

  /**
   * Check that the directory structure created in populate_directory remains.
   */
  function check_directory(dir: string) {
    var dir1 = path.resolve(dir, '_rename_me'),
      file1 = path.resolve(dir, 'file.dat'),
      file2 = path.resolve(dir1, 'lol.txt');
    return promiseCall(fs.readdir, [dir])
      .then((contents:string[]) => {
        assert(contents.length === 2);
        return true;  
      })
      .then(() => promiseCall(fs.readdir, [dir1]))
      .then((contents:string[]) => {
        assert(contents.length === 1);
        return promiseCall(fs.exists, [file1]);
      })
      .then((exists:boolean) => {
        assert(exists);
        return promiseCall(fs.exists, [file2]);
      })
      .then((exists:boolean) => {
        assert(exists);        
      });
  }    

  // Directory rename.
  return promiseCall(fs.mkdir, [oldDir])
    .then(() => populate_directory(oldDir))
    .then(() => promiseCall(fs.rename, [oldDir, oldDir], "Failed invariant: CAN rename a directory to itself."))
    .then(() => check_directory(oldDir))
    .then(() => promiseCall(fs.mkdir, [newDir]))
    .then(() => promiseCall(fs.rmdir, [newDir]))
    .then(() => promiseCall(fs.rename, [oldDir, newDir], "Failed to rename directory."))
    .then(() => check_directory(newDir))
    .then(() => promiseCall(fs.exists, [oldDir]))
    .then((exists:boolean) => {
      if (exists) {
        throw new Error("Failed invariant: Renamed directory still exists at old name.");
      }
    })
     // Renaming directories with *different* parent directories.
    .then(() => promiseCall(fs.mkdir, [oldDir]))
    .then(() => populate_directory(oldDir))
    .then(() => promiseCall(fs.rename, [oldDir, path.resolve(newDir, 'newDir')], "Failed to rename directories with different parents."))
    // File rename.
    .then(() => promiseCall(fs.mkdir, [fileDir]))
    .then(() => promiseCall(fs.writeFile, [file1, new Buffer('while(1) alert("Hey! Listen!");')]))
    .then(() => promiseCall(fs.rename, [file1, file1], "Failed invariant: CAN rename file to itself."))
    .then(() => promiseCall(fs.rename, [file1, file2], "Failed invariant: Failed to rename file."))
    .then(() => promiseCall(fs.writeFile, [file1, new Buffer('hey')]))
    .then(() => promiseCall(fs.rename, [file1, file2], "Failed invariant: Renaming a file to an existing file overwrites the file."))
    .then(() => promiseCall(fs.readFile, [file2]))
    .then((contents:string) => {
      assert(contents.toString() === 'hey');
      return promiseCall(fs.exists, [file1]);
    })
    .then((exists:boolean) => {
      assert(!exists);
      return true;
    })
    .then(() => promiseCall(fs.mkdir, [dir]))
    .then(() => promiseCall(fs.writeFile, [file, new Buffer("file contents go here")]))
    .then(() => promiseCall(fs.rename, [file, dir]))
    .then(
      () => {throw new Error("Failed invariant: Cannot rename a file over an existing directory.");},
      (e) => {assert(e.code === 'EISDIR' || e.code === 'EPERM', "Expected EISDIR or EPERM, received " + e.code);}
    )

    // JV: Removing test for now. I noticed that you can do that in Node v0.12 on Mac,
        // but it might be FS independent.
        /*fs.rename(dir, file, function (e) {
          if (e == null) {
            throw new Error("Failed invariant: Cannot rename a directory over a file.");
          } else {
            assert(e.code === 'ENOTDIR');
          }
        });*/

 
    // cannot rename a directory inside itself  
    .then(() => promiseCall(fs.mkdir, [renDir1]))
    .then(() => promiseCall(fs.rename, [renDir1, renDir2]))
    .then(
      () => {throw new Error("Failed invariant: Cannot move a directory inside itself.");},
      () => true
    );
};
