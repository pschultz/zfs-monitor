class Disk

  constructor: (@name, @status = 'UNKNOWN', @size = 0) ->
    @id = require('./uniqid') @name


module.exports = exports = Disk
