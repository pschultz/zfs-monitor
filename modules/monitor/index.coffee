Query = require '../query'

class Monitor
  constructor: ->
    @lastStatus = null
    @interval = 0

    @query = new Query()
    @query.on 'complete', @onQueryComplete

  startMonitoring: ->
    @interval = setInterval ->
      query.execute()
    , 2000

  stopMonitoring: ->
    clearInterval @interval if @interval

  subscribeForPool: (pool) ->
    @query.addPool pool

  getSnapshot: (cb) ->
    return cb @lastStatus  if @lastStatus?

    @query.once 'complete', (result) ->
      cb result

    @query.execute()

  unsubscribeFromPool: (pool) ->
    @query.removePool pool
    @stopMonitoring unless @query.getNumberOfPools > 0

  onQueryComplete: (result) =>
    @analyseResult result
    @lastStatus = result

  analyseResult: (result) ->


module.exports = exports = new Monitor()
