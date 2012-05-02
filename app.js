var Monitor, eyes;

eyes = require('eyes');

Monitor = require('./modules/monitor');

Monitor.on('*', function() {
  return eyes.inspect(arguments[0]);
});

Monitor.startMonitoring();
