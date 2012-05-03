class Filesystem

  constructor: (@name, @size = 0) ->
    @id = require('./uniqid') @name

  equals: (rhs) ->
    this.size == rhs.size

module.exports = exports = Filesystem

