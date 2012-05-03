class Scan

  constructor: (@poolName, @type, @progress = 0, @eta = 0) ->
    @id = require('./uniqid') "#{@poolName}-#{@type}"

  equals: (rhs) ->
    this.progress == rhs.progress and this.eta == rhs.eta

module.exports = exports = Scan
