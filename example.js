var Monitor;

Monitor = require('./index');

Monitor.on('*', function() {
  console.log(arguments[0]);
  return console.log(arguments[1]);
});

Monitor.startMonitoring();

setTimeout(function() {
  return console.log(Monitor.getSnapshot());
}, 500);
