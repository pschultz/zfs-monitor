Monitor = require './index'


Monitor.on '*', ->
  console.log arguments[0]
  console.log arguments[1]

Monitor.startMonitoring()

setTimeout ->
  console.log Monitor.getSnapshot()
, 500
