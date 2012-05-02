eyes = require 'eyes'
Monitor = require './modules/monitor'

Monitor.subscribeForPool 'tank'

Monitor.getSnapshot (result) ->
  eyes.inspect result

Monitor.unsubscribeFromPool 'tank'
