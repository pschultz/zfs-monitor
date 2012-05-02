events = require 'events'
eyes = require 'eyes'

Query = require '../query'

class Monitor extends events.EventEmitter
  constructor: ->
    @lastStatus = null
    @interval = 0

    @query = new Query()
    @query.on 'complete', @onQueryComplete

  startMonitoring: ->
    self = @
    @interval = setInterval ->
      self.query.execute()
    , 2000

  stopMonitoring: ->
    clearInterval @interval if @interval

  getSnapshot: (cb) ->
    return cb @lastStatus  if @lastStatus?

    @query.once 'complete', (result) ->
      cb result

    @query.execute()

  onQueryComplete: (result) =>
    @analyseResult result
    @lastStatus = result
    @emit 'complete', result

  _emit: =>
    @emit.apply @, arguments
    args = Array::slice.call arguments
    args.unshift '*'
    @emit.apply @, args

  analyseResult: (result) ->
    return unless @lastStatus?

    @checkForMissingElements result
    @checkForAddedElements result, ->
      @_emit 'foo'

  checkForMissingElements: (result) ->
    @diffPools @lastStatus[1..1], result[1..1], 'removed'

  checkForAddedElements: (result, cb) ->
    @diffPools result[1..1], @lastStatus[1..1], 'added', cb

  diffPools: (lhsPools, rhsPools, type, cb = ->) ->
    @diffSomething lhsPools, rhsPools, 'pool', type, (lhs, rhs) ->
      @diffSomething lhs.filesystems, rhs.filesystems, 'zfs',       type
      @diffSomething lhs.diskArrays,  rhs.diskArrays,  'diskarray', type, (lhs, rhs) ->
        @diffSomething lhs.disks, rhs.disks, 'disk', type


  diffSomething: (lhsSth, rhsSth, sthType, changeType, next = ->) ->
    for lhs in lhsSth
      lhsChanged = true
      for rhs in rhsSth
        if lhs.id == rhs.id
          nextRhs = rhs
          lhsChanged = false

      if lhsChanged
        @_emit [sthType,   lhs.id, changeType].join(':'), lhs
        @_emit [sthType, lhs.name, changeType].join(':'), lhs if(lhs.name?)
        @_emit [sthType,      '*', changeType].join(':'), lhs

      else
        next.call @, lhs, nextRhs
      


module.exports = exports = new Monitor()
