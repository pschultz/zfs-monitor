events = require 'events'

Query = require './modules/query'
Comparator = require './modules/monitor/pool-comparator'

class Monitor extends events.EventEmitter
  constructor: ->
    @lastStatus = null
    @interval = 0

    @query = new Query()
    @query.on 'complete', @onQueryComplete

  startMonitoring: ->
    return unless @interval is 0
    @emit 'monitor:start'

    @query.execute()

    self = @
    @interval = setInterval ->
      self.query.execute()
    , 5000

  stopMonitoring: ->
    return if @interval is 0
    @emit 'monitor:stop'

    clearInterval @interval
    @interval = 0
    @lastStatus = null

  getSnapshot: -> @lastStatus

  onQueryComplete: (result) =>
    @analyseResult result
    @lastStatus = zpools: result
    @emit 'complete', @lastStatus

  _emit: =>
    @emit.apply @, arguments
    args = Array::slice.call arguments
    args.unshift '*'
    @emit.apply @, args

  analyseResult: (result) ->
    return unless @lastStatus?

    comparator = new Comparator @
    comparator.compare @lastStatus.zpools, result


module.exports = exports = new Monitor()
