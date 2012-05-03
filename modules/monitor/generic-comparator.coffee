class Comparator
  constructor: (@monitor, @callBackContext) ->
    @missingType = 'missing'
    @changeType = 'change'
    @compareLeaves = false

  compareSomethings: (lhsSth, rhsSth, parentIds, sthType, next = ->) ->
    for lhs in lhsSth
      @compareSomething lhs, rhsSth, parentIds.slice(), sthType, next

  compareSomething: (lhs, rhsSth, parentIds, sthType, next = ->) ->
    lhsChanged = true
    for rhs in rhsSth
      if lhs.id == rhs.id
        nextRhs = rhs
        lhsChanged = false

    eventPrefixes = @getEventPrefixes lhs, sthType

    if lhsChanged
      @emitChange lhs, @missingType, parentIds, eventPrefixes

    else
      if @compareLeaves and lhs.equals? and not lhs.equals nextRhs
        @emitChange lhs, @changeType, parentIds, eventPrefixes

      next.call @callBackContext, lhs, nextRhs, eventPrefixes[1..]

  getEventPrefixes: (lhs, sthType) ->
    eventPrefixes = []
    eventPrefixes.push [ sthType,      '*' ].join(':')
    eventPrefixes.push [ sthType,   lhs.id ].join(':')
    eventPrefixes.push [ sthType, lhs.name ].join(':') if(lhs.name?)
    return eventPrefixes

  emitChange: (lhs, changeType, parentIds = [], eventPrefixes = null) ->
    eventPrefixes = @getEventPrefixes lhs, changeType unless eventPrefixes?
    for e in eventPrefixes
      @monitor._emit [   e, changeType].join(':'), lhs
      for p in parentIds
        @monitor._emit [p, e, changeType].join(':'), lhs

module.exports = exports = Comparator
