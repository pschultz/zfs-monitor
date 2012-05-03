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
    @checkForAddedElements result

  checkForMissingElements: (result) ->
    @diffPools @lastStatus[3..3], result[3..3], 'removed'

  checkForAddedElements: (result) ->
    @diffPools result[3..3], @lastStatus[3..3], 'added'

  diffPools: (lhsPools, rhsPools, type) ->
    @diffSomethings lhsPools,        rhsPools,        [],        'pool',      type, (lhs, rhs, parentIds) ->
      @diffSomethings lhs.scans,       rhs.scans,       parentIds, 'scan',      type
      @diffSomethings lhs.filesystems, rhs.filesystems, parentIds, 'zfs',       type
      @diffSomethings lhs.diskArrays,  rhs.diskArrays,  parentIds, 'diskarray', type, (lhs, rhs, parentIds) ->
        @diffSomethings lhs.disks,       rhs.disks,       parentIds, 'disk',      type

  diffSomethings: (lhsSth, rhsSth, parentIds, sthType, changeType, next = ->) ->
    for lhs in lhsSth
      @diffSomething lhs, rhsSth, parentIds.slice(), sthType, changeType, next

  diffSomething: (lhs, rhsSth, parentIds, sthType, changeType, next = ->) ->
    lhsChanged = true
    for rhs in rhsSth
      if lhs.id == rhs.id
        nextRhs = rhs
        lhsChanged = false

    eventPrefixes = []
    eventPrefixes.push [ sthType,      '*' ].join(':')
    eventPrefixes.push [ sthType,   lhs.id ].join(':')
    eventPrefixes.push [ sthType, lhs.name ].join(':') if(lhs.name?)

    if lhsChanged
      for e in eventPrefixes
        @_emit [   e, changeType].join(':'), lhs
        for p in parentIds
          @_emit [p, e, changeType].join(':'), lhs

    else

      next.call @, lhs, nextRhs, eventPrefixes[1..]
      

module.exports = exports = new Monitor()
