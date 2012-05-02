cproc = require 'child_process'
path = require 'path'
events = require 'events'

Pool = require '../zpool'
PoolParser = require './parser/zpool'
ZfsParser = require './parser/zfs'


class Query extends events.EventEmitter

  execute: ->
    @zpools = []
    self = @

    self.queryZpool ->
      self.parseZpools ->
        self.queryZfs ->
          self.parseFilesystems ->
            self.emit 'complete', self.zpools

    null

  queryZpool: (cb) ->
    env = process.env
    env.PATH += ":" + path.normalize path.join __dirname, '../../zfsmock'

    @zpool = cproc.spawn 'zpool', ['status'], env: env

    @zpoolStatusOutput = ""
    self = @

    @zpool.stdout.setEncoding 'utf8'
    @zpool.stderr.pipe process.stderr
    @zpool.stdout.on 'data', (chunk) ->
      self.zpoolStatusOutput += chunk
    @zpool.on 'exit', (code) ->
      if code == 0
        self.zpool = null
        cb()
      else self.query()

  parseZpools: (cb) ->
    newPoolPattern = /^  +pool: (\S+)/
    lines = @zpoolStatusOutput.split "\n"
    poolLines = []
    poolName = 'unnamed'

    for line in lines
      if newPoolPattern.test line
        if poolLines.length
          @parseZpool poolName, poolLines

        poolLines = []
        [ nil, poolName ] = newPoolPattern.exec line
      poolLines.push line

    @parseZpool poolName, poolLines
    cb()

  parseZpool: (poolName, lines) ->
    pool = new Pool poolName

    @zpools.push pool

    parser = new PoolParser pool
    parser.parse lines


  queryZfs: (cb) ->
    env = process.env
    env.PATH += ":" + path.normalize path.join __dirname, '../../zfsmock'

    @zfs = cproc.spawn 'zfs', ['list', '-o', 'name,used,available,refer,usedbysnapshots'], env: env

    @zfsStatusOutput = ""
    self = @

    @zfs.stdout.setEncoding 'utf8'
    @zfs.stderr.pipe process.stderr
    @zfs.stdout.on 'data', (chunk) ->
      self.zfsStatusOutput += chunk
    @zfs.on 'exit', (code) ->
      if code == 0
        self.zfs = null
        cb()
      else self.query()

  parseFilesystems: (cb) ->
    lines = @zfsStatusOutput.split "\n"
    lines.shift()
    poolLines = {}
    poolName = 'unnamed'
    lastPoolName = null

    for line in lines
      [ fsName ]   = line  .split /\s+/
      [ poolName ] = fsName.split '/'

      poolLines[poolName] = [] unless poolLines[poolName]
      poolLines[poolName].push line

    for poolName, lines of poolLines
      @parseFilesystem poolName, lines

    cb()

  parseFilesystem: (poolName, lines) ->
    pool = @getPoolByName poolName

    return unless pool?

    parser = new ZfsParser pool
    parser.parse lines

  getPoolByName: (name) ->
    for pool in @zpools
      return pool if pool.name is name

    return null


module.exports = exports = Query
