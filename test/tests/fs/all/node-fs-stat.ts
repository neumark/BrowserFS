import fs from '../../../../src/core/node_fs';
import * as path from 'path';
import assert from '../../../harness/wrapped-assert';
import common from '../../../harness/common';

import Stats from '../../../../src/core/node_fs_stats';

export default function() {
  var got_error = false;
  var success_count = 0;
  var existing_dir = common.fixturesDir;
  var existing_file = path.join(common.fixturesDir, 'x.txt');
  var doStat = (path:string) => new Promise((resolve, reject) => fs.stat(path, (err, stats) => {
      if (err) {
        got_error = true;
        success_count--;
        reject(err);
      } else {
        success_count++;
        resolve(stats);
      }
    }));
    var doFStat = (fd:number) => new Promise((resolve, reject) => fs.fstat(fd, (err, stats) => {
      if (err) {
        got_error = true;
        reject(err);
      } else {
        success_count++;
        resolve(stats);
      }
    }));
  var doLstat = (path:string) => new Promise((resolve, reject) => fs.lstat(path, (err, stats) => {
    if (err) {
      got_error = true;
      reject(err);
    } else {
      success_count++;
      resolve(stats);
    }
  }));
  var doFopen = (path:string) => new Promise((resolve, reject) => fs.open(path, 'r', undefined, function(err, fd) {
    if (err) {
      got_error = true;
      reject(err);
    } else {
      success_count++;
      resolve(fd);
    }
  }));

  // Empty string is not a valid file path.
  return doStat('')
  .then(
    // in this test we expect an error, so got_error is reversed
    () => {
      got_error = true;
      success_count--;
    },
    () => {
      got_error = false;
      success_count++;
    }
  )
  .then(() => doStat(existing_dir))
  .then(
    (stats:Stats) => {
      assert.ok(stats.mtime instanceof Date);
      return true;
    })
  .then(() => doLstat(existing_dir))
  .then(
    (stats:Stats) => {
      assert.ok(stats.mtime instanceof Date);
      return true;
    })
  .then(() => doFopen(existing_file))
  .then((fd:number) => {    
    assert.ok(fd);
    return fd
  })
  .then((fd:number) => Promise.all([fd, doFStat(fd)]))
  .then(([fd, stats]:[number, Stats]) => {
    assert.ok(stats.mtime instanceof Date);
    fs.close(fd);

    if (fs.getRootFS().supportsSynch()) {
      // fstatSync
      fs.open(existing_file, 'r', undefined, function(err, fd) {
        var stats: any;
        try {
          stats = fs.fstatSync(fd);
        } catch (e) {
          got_error = true;
        }
        if (stats) {
          assert.ok(stats.mtime instanceof Date);
          success_count++;
        }
        fs.close(fd);
      });
    }

    return true;
  })
  .then(() => doStat(existing_file))
  .then((s:Stats) => {
      assert.equal(false, s.isDirectory());
      assert.equal(true, s.isFile());
      assert.equal(false, s.isSocket());
      //assert.equal(false, s.isBlockDevice());
      assert.equal(false, s.isCharacterDevice());
      assert.equal(false, s.isFIFO());
      assert.equal(false, s.isSymbolicLink());

      assert.ok(s.mtime instanceof Date);
  }).then(() => {
    var expected_success = 5;
    if (fs.getRootFS().supportsSynch()) expected_success++;
    assert.equal(expected_success, success_count);
    assert.equal(false, got_error);
  });
};
