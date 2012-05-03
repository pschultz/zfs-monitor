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

    comparator = new Comparator @
    comparator.compare @lastStatus, result


module.exports = exports = new Monitor()
