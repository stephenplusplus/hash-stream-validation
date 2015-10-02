'use strict'

var assert = require('assert')
var crc = require('fast-crc32c')
var crypto = require('crypto')
var fs = require('fs')

var hashStreamValidation = require('./')

describe('hash-stream-validation', function () {
  var sums = {
    crc32c: '',
    md5: crypto.createHash('md5')
  }

  before(function (done) {
    fs.createReadStream('package.json')
      .on('error', done)
      .on('data', function (chunk) {
        sums.crc32c = crc.calculate(chunk, sums.crc32c)
        sums.md5 = sums.md5.update(chunk)
      })
      .on('end', function () {
        sums.crc32c = new Buffer([sums.crc32c]).toString('base64')
        sums.md5 = sums.md5.digest('base64')
        done()
      })
  })

  it('should validate crc32c & md5 by default', function (done) {
    var validate = hashStreamValidation()

    fs.createReadStream('package.json')
      .on('error', done)
      .pipe(validate)
      .on('data', function () {})
      .on('end', function () {
        assert.strictEqual(validate.test('crc32c', sums.crc32c), true)
        assert.strictEqual(validate.test('md5', sums.md5), true)

        done()
      })
  })

  it('should allow turning off algos', function (done) {
    var validate = hashStreamValidation({ md5: false })

    fs.createReadStream('package.json')
      .on('error', done)
      .pipe(validate)
      .on('data', function () {})
      .on('end', function () {
        assert.strictEqual(validate.test('crc32c', sums.crc32c), true)
        assert.strictEqual(validate.test('md5', sums.md5), false)

        done()
      })
  })
})
