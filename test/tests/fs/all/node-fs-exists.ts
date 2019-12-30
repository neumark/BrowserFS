import fs from '../../../../src/core/node_fs';
import * as path from 'path';
import assert from '../../../harness/wrapped-assert';
import common from '../../../harness/common';

export default function() {
  var f = path.join(common.fixturesDir, 'x.txt');
  var exists: boolean;
  var doesNotExist: boolean;

  Promise.all([
    new Promise((resolve, reject) => fs.exists(f, function(y) {
      exists = y;
      resolve(true);
    })),
    new Promise((resolve, reject) => fs.exists(f + '-NO', function(y) {
      doesNotExist = y;
      resolve(true);
    }))
  ]).then(() => {
    assert.strictEqual(exists, true);
    assert.strictEqual(doesNotExist, false);
  });

  if (fs.getRootFS().supportsSynch()) {
    assert(fs.existsSync(f));
    assert(!fs.existsSync(f + '-NO'));
  }

};
