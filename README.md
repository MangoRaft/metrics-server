# Route-Machine

## About?

Route Machine is a HTTP router built to run in a cluster environment. Using the NATS network to update routes in real-time.

Route Machine has been built for the use with the Raft framework. The events Route Machine emitts are watched by the 

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
