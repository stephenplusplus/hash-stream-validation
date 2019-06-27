'use strict';

const assert = require('assert');

import * as crypto from 'crypto';
import { Hashes, CRCModule } from '../src';
const fastCrc32c = require('fast-crc32c');
const crc: CRCModule = require('../../external/crc32c.js');
import * as fs from 'fs';

const hashStreamValidation = require('../src');

describe('crc32c computations', () => {
  it('should match computations between JS and fast-crc32c', () => {
    assert.strictEqual(crc.calculate('test'), fastCrc32c.calculate('test'));
  });
});

describe('hash-stream-validation', () => {
  const sums = {
    crc32c: '',
    md5: '',
  } as Hashes;

  before(done => {
    let crc32c: number;
    let md5: crypto.Hash = crypto.createHash('md5');
    fs.createReadStream('package.json')
      .on('error', done)
      .on('data', (chunk: Buffer | string) => {
        crc32c = crc.calculate(chunk, crc32c);
        md5 = md5.update(chunk);
      })
      .on('end', () => {
        sums.crc32c = Buffer.from([crc32c]).toString('base64');
        sums.md5 = md5.digest('base64');
        done();
      });
  });

  it('should validate crc32c & md5 by default', done => {
    const validate = hashStreamValidation();

    fs.createReadStream('package.json')
      .on('error', done)
      .pipe(validate)
      .on('data', () => {})
      .on('end', () => {
        assert.strictEqual(validate.test('crc32c', sums.crc32c), true);
        assert.strictEqual(validate.test('md5', sums.md5), true);

        done();
      });
  });

  it('should allow turning off algos', done => {
    const validate = hashStreamValidation({ md5: false });

    fs.createReadStream('package.json')
      .on('error', done)
      .pipe(validate)
      .on('data', () => {})
      .on('end', () => {
        assert.strictEqual(validate.test('crc32c', sums.crc32c), true);
        assert.strictEqual(validate.test('md5', sums.md5), false);

        done();
      });
  });
});
