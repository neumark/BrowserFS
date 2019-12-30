import fs from '../../../../src/core/node_fs';
import * as path from 'path';
import assert from '../../../harness/wrapped-assert';
import common from '../../../harness/common';

export default function() {
  var filepath = path.join(common.fixturesDir, 'x.txt'),
      expected = 'xyz\n',
      readCalled = 0,
      rootFS = fs.getRootFS(),
      openFile = () => new Promise((resolve, reject) => fs.open(filepath, 'r', function(err, fd) {
        if (err) {
          reject(err);
        } else {
          resolve(fd);
        }
      }));

  return openFile()
    .then((fd:number) => new Promise((resolve, reject) => fs.read(fd, expected.length, 0, 'utf-8', function(err, str, bytesRead) {
      if (err) {
        reject(err);
      } else {
        readCalled++;

        assert.ok(!err);
        assert.equal(str, expected);
        assert.equal(bytesRead, expected.length);

        if (rootFS.supportsSynch()) {
          var r = fs.readSync(fd, expected.length, 0, 'utf-8');
          assert.equal(r[0], expected);
          assert.equal(r[1], expected.length);
        }
        resolve(true);
      }
    })))
    .then(() => {
      assert.equal(readCalled, 1);
    });
    
};
