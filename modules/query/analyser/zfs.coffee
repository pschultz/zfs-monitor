class ZfsAnalyser
  constructor: (@pool) ->

  analyse: (@zfsOutput) ->
    lines = @zfsOutput
    snapshots = new Filesystem '@snapshots', 0

    lastFs = { name: '/' }
    filesystems = []

    for i in [lines.length - 1 .. 1]
      line = lines[i]
      continue unless line

      [ name, used, available, referenced, usedBySnapshot ] = line.split /\s+/
      poolName = @pool.name

      # skip non-leaf filesystems
      isNonLeafFilesystem = name isnt poolName and lastFs.name.indexOf(name) is 0
      continue if isNonLeafFilesystem

      #[ poolName ] = name.split '/'
      #pool = @getPoolByName(poolName)
      #continue unless pool?

      if name == poolName
        @pool.size = normalizeBytes(used) + normalizeBytes(available)
        snapshots.size += normalizeBytes usedBySnapshot
        continue

      fsSize = normalizeBytes referenced
      @pool.allocated += fsSize

      fs = new Filesystem name, fsSize

      lastFs = fs
      @pool.addFilesystem fs

    @pool.addFilesystem snapshots

    @pool


module.exports = exports = ZfsAnalyser
