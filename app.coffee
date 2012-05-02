eyes = require 'eyes'
Monitor = require './modules/monitor'


#Monitor.getSnapshot (result) ->
Monitor.on '*', ->
  eyes.inspect arguments[0]
  #eyes.inspect r for r in result

Monitor.startMonitoring()
