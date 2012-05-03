class Scan

  constructor: (@poolName, @type, @progress = 0, @eta = 0) ->
    @id = require('./uniqid') "#{@poolName}-#{@type}"

module.exports = exports = Scan
