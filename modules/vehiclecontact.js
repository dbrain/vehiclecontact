var cluster = require('cluster');
var http = require('http');
var os = require('os');
var numCPUs = os.cpus().length;
var workers = {};

if (cluster.isMaster) {
  for (var i = 0; i < numCPUs; i++) {
    var worker = cluster.fork();
    workers[worker.pid] = worker;
  }

  cluster.on('death', function(worker) {
    console.log('worker on pid %s died', worker.pid);
    delete workers[worker.pid];
  });
} else {
  require('./vehiclecontact-app').listen(3000);
}
