import fs from '../../../../src/core/node_fs';
import * as path from 'path';
import assert from '../../../harness/wrapped-assert';
import common from '../../../harness/common';

export default function() {
  if (!fs.getRootFS().isReadOnly()) {
    var join = path.join;

    var filename = join(common.tmpDir, 'test.txt');

    var s = '南越国是前203年至前111年存在于岭南地区的一个国家，国都位于番禺，疆域包括今天中国的广东、' +
            '广西两省区的大部份地区，福建省、湖南、贵州、云南的一小部份地区和越南的北部。' +
            '南越国是秦朝灭亡后，由南海郡尉赵佗于前203年起兵兼并桂林郡和象郡后建立。' +
            '前196年和前179年，南越国曾先后两次名义上臣属于西汉，成为西汉的“外臣”。前112年，' +
            '南越国末代君主赵建德与西汉发生战争，被汉武帝于前111年所灭。南越国共存在93年，' +
            '历经五代君主。南越国是岭南地区的第一个有记载的政权国家，采用封建制和郡县制并存的制度，' +
            '它的建立保证了秦末乱世岭南地区社会秩序的稳定，有效的改善了岭南地区落后的政治、##济现状。\n';

    var ncallbacks = 0;

    // test that writeFile accepts buffers
    var filename2 = join(common.tmpDir, 'test2.txt');
    var buf = new Buffer(s, 'utf8');

    var promiseCall = (fn:Function, args:any[]) => new Promise((resolve, reject) => fn.apply(fs, [...args, (err:any, result:any) => {
      if (err) {
        reject(err);
      } else {
        ncallbacks++;
        resolve(result);
      }
    }]));

    return promiseCall(fs.writeFile, [filename, s])
      .then(() => promiseCall(fs.readFile, [filename]))
      .then((buffer:Buffer) => {
        var expected = Buffer.byteLength(s);
        assert.equal(expected, buffer.length,
            'Buffer length mismatch for ' + filename + ': expected ' + expected +
            ', got ' + buffer.length);            
      })
      .then(() => promiseCall(fs.writeFile, [filename2, buf]))
      .then(() => promiseCall(fs.readFile, [filename2]))
      .then((buffer:Buffer) => {
          assert.equal(buf.length, buffer.length,
            'Buffer length mismatch for ' + filename2 + ': expected ' +
            buf.length + ', got ' + buffer.length);
          return true;
      })
      .then(() => promiseCall(fs.unlink, [filename]))
      .then(() => promiseCall(fs.unlink, [filename2]))
      .then(() => {
        // was 4, but unlink() calls are also counted now
        assert.equal(6, ncallbacks, 'Expected 6 callbacks, got ' + ncallbacks);        
      });
  }
  return true;
};
