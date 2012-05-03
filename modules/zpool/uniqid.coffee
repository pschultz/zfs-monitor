createHash = require('crypto').createHash

module.exports = exports = (source) ->
  createHash('md5').update(source).digest('hex').substr(0, 8)
