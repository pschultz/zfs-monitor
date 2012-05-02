class ZPool

  constructor: (@name, @status = 'UNKNOWN') ->
    @size        = 0
    @allocated   = 0
    @scans       = []
    @diskArrays  = []
    @filesystems = []
    @id = require('crypto').createHash('md5').update(@name).digest('hex')

  addDiskarray: (array) ->
    @diskArrays.push array

  addScan: (scan) ->
    @scans.push scan

  addFilesystem: (fs) ->
    @filesystems.push fs


module.exports = exports = ZPool
