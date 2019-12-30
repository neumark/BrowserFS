import fs from '../../../../src/core/node_fs';
import * as path from 'path';
import assert from '../../../harness/wrapped-assert';
import common from '../../../harness/common';

export default function() {
  if (fs.getRootFS().isReadOnly()) {
    return true;
  }
    var fn = path.join(common.tmpDir, 'node-fs-write.txt');
    var fn2 = path.join(common.tmpDir, 'node-fs-write2.txt');
    var expected = 'ümlaut.';

  return new Promise((resolve, reject) => fs.open(fn, 'w', 0o644, function(err, fd) {
      if (err) throw err;
      fs.write(fd, '', 0, 'utf8', function(err, written) {
        assert.equal(0, written);
      });
      fs.write(fd, expected, 0, 'utf8', function(err, written) {
        if (err) throw err;
        assert.equal(Buffer.byteLength(expected), written);
        fs.close(fd, function(err) {
          if (err) throw err;
          fs.readFile(fn, 'utf8', function(err, data) {
            if (err) throw err;
            assert.equal(expected, data,
                'expected: "' + data + '", found: "' + data + '"');
            fs.unlink(fn, function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(true);
              }              
            });
          });
        });
      });
    })).then( () => new Promise((resolve, reject) => fs.open(fn2, 'w', 0o644, function(err, fd) {
      if (err) throw err;
      fs.write(fd, '', 0, 'utf8', function(err, written) {
        assert.equal(0, written);
      });
      fs.write(fd, expected, 0, 'utf8', function(err, written) {
        if (err) throw err;
        assert.equal(Buffer.byteLength(expected), written);
        fs.close(fd, function(err) {
          if (err) throw err;
          fs.readFile(fn2, 'utf8', function(err, data) {
            if (err) throw err;
            assert.equal(expected, data,
                'expected: "' + expected + '", found: "' + data + '"');
            fs.unlink(fn2, function(err) {
              if (err) {
                reject(err);              
              } else {
                resolve(true);
              }              
            });
          });
        });
      });
    })));
  
};
