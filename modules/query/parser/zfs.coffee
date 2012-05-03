Filesystem = require '../../zpool/filesystem'

normalizeBytes = (input) ->
  for suffix, e in [ '', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y' ]
    pattern = new RegExp("^([+-]?[\\d.]+)#{suffix}$", 'i')

    if pattern.test input
      [ nil, numeric ] = pattern.exec input
      return Math.round(numeric * Math.pow(1024, e))

  return 0

class ZfsAnalyser
  constructor: (@pool) ->

  parse: (lines) ->
    snapshots = new Filesystem '@snapshots', 0

    lastFs = { name: '/' }
    filesystems = []
    poolName = @pool.name

    for i in [lines.length - 1 .. 0]
      line = lines[i]
      continue unless line

      [ name, used, available, referenced, usedBySnapshot ] = line.split /\s+/

      snapshots.size += normalizeBytes usedBySnapshot

      # skip non-leaf filesystems
      isNonLeafFilesystem = name isnt poolName and lastFs.name.indexOf(name) is 0
      continue if isNonLeafFilesystem

      if name == poolName
        @pool.size = normalizeBytes(used) + normalizeBytes(available)
        continue

      fsSize = normalizeBytes referenced
      @pool.allocated += fsSize

      fs = new Filesystem name, fsSize

      lastFs = fs
      @pool.addFilesystem fs

    @pool.addFilesystem snapshots

    @pool


module.exports = exports = ZfsAnalyser
