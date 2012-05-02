var Monitor, eyes;

eyes = require('eyes');

Monitor = require('./modules/monitor');

Monitor.subscribeForPool('tank');

Monitor.getSnapshot(function(result) {
  return eyes.inspect(result);
});

Monitor.unsubscribeFromPool('tank');
