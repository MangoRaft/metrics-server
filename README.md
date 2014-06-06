<<<<<<< HEAD
# metrics-server

metrics-server is a basic metrics server and client. The client uses UDP to send metric to the server. The server stores all metric into a mongodb database.

## examples

```javascript
var usage = require('usage');

var udpServer = require('./lib/udpserver').createServer({
	host : '127.0.0.1',
	port : 4001,
	mongodb : {
		host : '127.0.0.1'
	}
});

var webServer = require('./lib/webserver').createServer({
	udp : udpServer,
	host : '127.0.0.1',
	port : 4002,
	mongodb : {
		host : '127.0.0.1'
	}
});

var memory = require('./lib/metric').createMetric({
	host : '127.0.0.1',
	port : 4001
});

var cpu = require('./lib/metric').createMetric({
	host : '127.0.0.1',
	port : 4001
});

memory.interval = cpu.interval = false;
memory.token = cpu.token = 'random-token';

memory.name = 'memory';
cpu.name = 'cpu';

var pid = process.pid;
setInterval(function() {

	usage.lookup(pid, {
		keepHistory : true
	}, function(err, result) {
		memory.cb(result.memory);
		cpu.cb(result.cpu);
	});
}, 1000);

webServer.start();
udpServer.start();
memory.start();
cpu.start();

```

## Methods

    var Metrics = require('metrics-server')

### var udpserver = Metrics.udpserver.createServer(opts);
To create the UDP server. This is used to recive metrics from the clients.
Options to pass in are
```
{
	host : '127.0.0.1',
	port : 4001,
	mongodb : {
		host : '127.0.0.1',
		port : 27017,
		path : '/data/db'
	}
}
```

### udpserver.start()
Call `udpserver.start` to start the server

### var webserver = Metrics.webserver.createServer(opts);
To create the UDP server. This is used to recive metrics from the clients.
Options to pass in are
```
{
	host : '127.0.0.1',
	port : 4002,
	mongodb : {
		host : '127.0.0.1',
		port : 27017,
		path : '/data/db'
	}
}
```

### webserver.start()
Call `webserver.start` to start the server

### var metric = Metrics.metric.createMetric(opts)
This is used to send metrics to the server.
```
{
	host : '127.0.0.1',//use the udp server host
	port : 4002//use the udp server port
}
```
### metric.token = uuid()
`metric.token` is used to group metrics together. The token should non guessable string.

### metric.name = 'cpu'
`metric.name` is the name of the metrics type

### metric.interval = 5000
`metric.interval` is the interval in milliseconds between calls to `metric.run()`
If you set this to `false` then you can manually call `metric.cb(metricValue)`

### metric.run = function(cb){}
`metric.run` is the function that is called when using `metric.interval`
```
metric.run = function(cb){
	setTimeout(function(){
		cb(Math.floor((Math.random() * 100) + 1));
	},100);
}
```
### metric.cb(value)
`metric.cb` is used when `metric.interval` is set to `false`
You would call it directly when you dont want call `metric.run`
```
setInterval(function(){
	metric.cb(Math.floor((Math.random() * 100) + 1));
},1000);
```
### metric.start()
Call `metric.start` to start collection metrics

##API
`Metrics.webserver` is used to recive metric from the database.


### GET `/metric/:token`
Called to recive metrics from the DB
#### query `name=cpu`
Query the database for e certen metrics name.
#### query `from=2014-05-08T00:04:56.656Z`
Query the database from a certain time.
#### query `to=2014-05-08T00:04:56.656Z`
Query the database to a certain time. Must include `from`.
#### query `limit=500`
Query the database and pull out 500.
Defaults to 1000, MAX is 10000.

### GET `/metric/:token/count`
Count the metrics in the DB.
Same query params can be sent as `/metric/:token`
=======
# Route-Machine

## About?

Route Machine is a HTTP router built to run in a cluster environment. Using the NATS network to update routes in real-time.

Route Machine has been built for the uses with the Raft framework. The events Route Machine emits are watched by the Dea.

## Features

* Cluster support.
* Request analytics.
* Process scalability to use all cores on demand.

## Usage


## Subscribe Events
### `router.register`
This event watches for a URL/HOST register command. This will add the URL, host and port of a running server.
### `router.unregister`
This event watches for a URL/HOST unregister command. This will remove the URL, host and port of a running server.

## Publish Events
### `router.start`
This event is triggered when a new process is spawned for the router.
### `router.usage`
This event emits the `varz` propriety of the router.
```javascript
router.varz = {
	requests_per_sec : 0,//Request per-second
	requests : 0,//Total request
	up_per_sec : 0,//Bandwidth upload per-second
	down_per_sec : 0,//Bandwidth download per-second
	up : 0,//Total upload
	down : 0//Total download
};
```
>>>>>>> 02f7d07cc4506d5d9e869772bf3ce334010dd4c4
