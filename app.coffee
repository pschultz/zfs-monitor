eyes = require 'eyes'
Monitor = require './modules/monitor'

Monitor.subscribeForPool 'tank'

#Monitor.getSnapshot (result) ->
Monitor.on 'complete', (result) ->
  eyes.inspect r for r in result

Monitor.unsubscribeFromPool 'tank'
