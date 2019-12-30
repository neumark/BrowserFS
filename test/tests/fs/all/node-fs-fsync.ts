import fs from '../../../../src/core/node_fs';
import * as path from 'path';
import assert from '../../../harness/wrapped-assert';
import common from '../../../harness/common';

export default function() {
  var successes = 0;
  var file = path.join(common.fixturesDir, 'a.js');
  var rootFS = fs.getRootFS();
  if (!rootFS.isReadOnly()) {
    new Promise((resolve, reject) => fs.open(file, 'a', 0o777, (err, fd) => {
        if (err) {
          reject(err);
        } else {
          resolve(fd);
        }
      })).then((fd:number) => {
        // test sync
        if (rootFS.supportsSynch()) {
          fs.fdatasyncSync(fd);
          successes++;
  
          fs.fsyncSync(fd);
          successes++;
        }
        return new Promise((resolve, reject) => fs.fdatasync(fd, err => {
          if (err) {
            reject(err);
          } else {
            successes++;
            resolve(fd);
          }          
        }));
      }).then((fd:number) => new Promise((resolve, reject) => fs.fsync(fd, err => {
        if (err) {
          reject(err);
        } else {
          successes++;
          resolve(true);
        }        
      }))).then(() => {
        if (rootFS.supportsSynch()) {
          assert.equal(4, successes);
        } else {
          assert.equal(2, successes);
        }
      })    
  }
};
