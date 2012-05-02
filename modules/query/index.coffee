cproc = require 'child_process'
path = require 'path'
events = require 'events'

running = false
lastRun = 0

Pool = require './pool'
Disk = require './disk'
Diskarray = require './array'
Filesystem = require './filesystem'

normalizeBytes = (input) ->
  for suffix, e in [ '', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y' ]
    pattern = new RegExp("^([+-]?[\\d.]+)#{suffix}$", 'i')

    if pattern.test input
      [ nil, numeric ] = pattern.exec input
      return Math.round(numeric * Math.pow(1024, e))

  return 0

class Query extends events.EventEmitter
  zpoolStatusOutput: ""
  spinningTreshold: [ 60000, 300000 ]

  zpool: null
  zfs: null

  deferTimer: 0

  slowDown: ->
    @spinningTreshold[0] = 60000

  keepItComin: ->
    @spinningTreshold[0] = 2000

  lastAnalysis: {}
  newAnalysis: {}

  constructor: ->
    @slowDown()
    self = @

    setInterval ->
      self.killStalledProcesses()
    , 5000

    @on 'analyzed', -> self.start()

  start: ->
    now = new Date().getTime()
    timeSinceLastRun = now - lastRun
    self = @

    startedToFast = timeSinceLastRun < @spinningTreshold[0]

    if startedToFast
      if @deferTimer == 0
        deferFor = @spinningTreshold[0] - (timeSinceLastRun)
        console.log "defering zpool queries for #{deferFor} ms"
        @deferTimer = setTimeout ->
          self.deferTimer = 0
          self.start()
        , deferFor

      return

    running = true
    lastRun = now

    @doQuery()

  killStalledProcesses: ->
    return unless running
    return unless @zpool? || @zfs?

    now = new Date().getTime()
    timeSinceLastRun = now - lastRun

    if timeSinceLastRun > @spinningTreshold[1]
      console.log 'zpool or zfs did not respond in time, killing them now'
      @emit 'stalled'
      @zpool.kill() if @zpool?
      @zfs.kill() if @zfs?

  doQuery: ->
    self = @
    @newAnalysis = {}

    @queryZpool ->
      self.analyseZpool()

    @queryZfs ->
      self.analyseZfs()


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

  analyseZfs: ->

  getPoolByName: (name) ->
    for pool in @newAnalysis.pools
      return pool if pool.name is name


module.exports = exports = Query
