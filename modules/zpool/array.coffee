class Diskarray

  constructor: (@name = 'unnamed', @type = 'striped', @status = '') ->
    @disks = []
    @id = require('crypto').createHash('md5').update(@name).digest('hex')

module.exports = exports = Diskarray
