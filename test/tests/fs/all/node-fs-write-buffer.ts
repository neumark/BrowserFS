import fs from '../../../../src/core/node_fs';
import * as path from 'path';
import assert from '../../../harness/wrapped-assert';
import common from '../../../harness/common';

var promiseCall = (fn:Function, args:any[]) => new Promise((resolve, reject) => fn.apply(fs, [...args, (err:any, result:any) => {
  if (err) {
    reject(err);
  } else {
    resolve(result);
  }
}]));

export default function() {
  if (fs.getRootFS().isReadOnly()) {
    return true;
  }
  var filename = path.join(common.tmpDir, 'node-fs-write-buffer.txt'),
        expected = new Buffer('hello'),
        openCalled = 0,
        writeCalled = 0,
        fd:number;

  return promiseCall(fs.open, [filename, 'w', 0o644])
    .then((fd_:number) => {
      openCalled++;
      fd = fd_;
      return true;
    })
    .then(() => promiseCall(fs.write, [fd, expected, 0, expected.length, null]))
    .then((written:number) => {
      writeCalled++;
      assert.equal(expected.length, written);
      return true;
    })
    .then(() => promiseCall(fs.close, [fd]))
    .then(() => promiseCall(fs.readFile, [filename, 'utf8']))
    .then((found) => {
      assert.deepEqual(expected.toString(), found);
      return promiseCall(fs.unlink, [filename]);
    })
    .then(() => {
      assert.equal(1, openCalled);
      assert.equal(1, writeCalled);
    })   
};
