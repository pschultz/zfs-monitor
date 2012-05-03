class Filesystem

  constructor: (@name, @size = 0) ->
    @id = require('./uniqid') @name

module.exports = exports = Filesystem

