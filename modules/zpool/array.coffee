class Diskarray

  constructor: (@name = 'unnamed', @type = 'striped', @status = '') ->
    @disks = []
    @id = require('./uniqid') @name

module.exports = exports = Diskarray
