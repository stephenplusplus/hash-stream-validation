'use strict';
import * as crypto from 'crypto';
import * as through from 'through2';
import * as stream from 'stream';
import { CRCModule } from './CRCModule';

let crc: CRCModule;
try {
  crc = require('fast-crc32c');
} catch (e) {
  crc = require('./crc32c');
}

export interface Hashes {
  md5: string;
  crc32c: string;
}

export interface Config {
  md5?: boolean;
  crc32c?: boolean;
}

export interface ValidationStream extends stream.Transform {
  test(algo: 'md5'|'crc32c', sum: string): boolean;
}

module.exports = function(cfg: Config) {
  cfg = cfg || {};

  const crc32c = cfg.crc32c !== false;
  const md5 = cfg.md5 !== false;

  const hashes = {} as Hashes;
  let md5Hash: crypto.Hash;
  let crc32cHash: number;
  if (md5) md5Hash = crypto.createHash('md5');

  const onData = function (chunk, _enc, done) {
    if (crc32c) crc32cHash = crc.calculate(chunk, crc32cHash);
    if (md5) md5Hash.update(chunk);

    done(null, chunk);
  } as through.TransformFunction;

  const onFlush = function (done: () => void) {
    if (crc32c) hashes.crc32c = Buffer.from([crc32cHash]).toString('base64');
    if (md5) hashes.md5 = md5Hash.digest('base64');

    done();
  };

  const validationStream = through(onData, onFlush) as ValidationStream;

  validationStream.test = function (algo, sum) {
    return hashes[algo] === sum;
  };

  return validationStream;
};
