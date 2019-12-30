import fs from '../../../../src/core/node_fs';
import * as path from 'path';
import assert from '../../../harness/wrapped-assert';
import common from '../../../harness/common';

export default function() {
  var filepath = path.join(common.fixturesDir, 'x.txt'),
      expected = 'xyz\n',
      bufferAsync = new Buffer(expected.length),
      bufferSync = new Buffer(expected.length),
      readCalled = 0,
      rootFS = fs.getRootFS();
  return new Promise((resolve, reject) => fs.open(filepath, 'r', function(err, fd) {
    if (err) {
      reject(err);
    } else {
      resolve(fd);
    }
  })).then((fd:number) => new Promise((resolve, reject) => fs.read(fd, bufferAsync, 0, expected.length, 0, function(err, bytesRead) {
    if (err) {
      reject(err);
    } else {
      readCalled++;
      assert.equal(bytesRead, expected.length);
      assert.equal(bufferAsync.toString(), new Buffer(expected).toString());

      if (rootFS.supportsSynch()) {
        var r = fs.readSync(fd, bufferSync, 0, expected.length, 0);
        assert.equal(bufferSync.toString(), new Buffer(expected).toString());
        assert.equal(r, expected.length);
      }


      resolve(true);
    }    
  }))).then(() => {
    assert.equal(readCalled, 1);
  });  
};
