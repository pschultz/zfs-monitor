cproc = require 'child_process'
path = require 'path'
events = require 'events'

Pool = require '../zpool'
Filesystem = require '../zpool/filesystem'

PoolParser = require './parser/zpool'

###
normalizeBytes = (input) ->
  for suffix, e in [ '', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y' ]
    pattern = new RegExp("^([+-]?[\\d.]+)#{suffix}$", 'i')

    if pattern.test input
      [ nil, numeric ] = pattern.exec input
      return Math.round(numeric * Math.pow(1024, e))

  return 0
###

class Query extends events.EventEmitter
  constructor: ->
    @poolsToQuery = []

  addPool: (name) ->
    return if i is name for i in @poolsToQuery
    @poolsToQuery.push(name)

  removePool: (name) ->
    for pool, i in @poolsToQuery
      if pool is name
        delete @poolsToQuery[i]
        return

  execute: ->
    @zpools = []
    self = @

    self.queryZpool ->
      self.parseZpools ->
        #self.queryZfs ->
          #self.parseFilesystems ->
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
    lines = @zpoolStatusOutput.split "\n"
    poolLines = []
    poolName = 'unnamed'
    lastPoolName = 'unnamed'

    lastPoolname
    for line in lines
      [ fsName ] = line.split /\s+/
      [ poolName ] fsName.split '/'

      if poolName isnt lastPoolName
        if poolLines.length
          @parseFilesystem poolName, poolLines

        poolLines = []
        [ nil, poolName ] = newPoolPattern.exec line

    @parseZpool poolName, poolLines

  parseFilesystem: (poolName, lines) ->
    pool = @getPoolByName()

    return unless pool?

    parser new ZfsParser pool
    parser.parse lines

  getPoolByName: (name) ->
    for pool in @zpools
      return pool if pool.name is name

    return null


module.exports = exports = Query
