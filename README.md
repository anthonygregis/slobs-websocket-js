# slobs-websocket-js

Streamlabs OBS websocket controller built on [obs-websocket-js](https://github.com/obs-websocket-community-projects/obs-websocket-js)

# Installation

```
# NPM Install
npm install slobs-websocket-js

# Yarn Install
yarn add slobs-websocket-js

```

# Usage

Untested in browser, currently supported in node.

### Node Import Methods

```javascript
// CommonJS
const SLOBSWebSocket = require("slobs-websocket-js");
```

### Connecting

- Address is optional `default: 127.0.0.1`
- Port is optional `default: 59650`
- Path is optional `default: api`
- Token is required
  - Get this in `Settings -> Remote Control`, click the QR Code and show details

```javascript
const slobs = new SLOBSWebSocket();

slobs.connect({
  address: "127.0.0.1",
  port: 59650,
  path: "api",
  token: "l33t0k3n",
});
```

### Requests

All available requests can be found from checking the slobs-client [documentation](https://stream-labs.github.io/streamlabs-obs-api-docs/docs/index.html)

- Method is required and can be found from [slobs-client](https://stream-labs.github.io/streamlabs-obs-api-docs/docs/index.html)
- Params is required for specificing the service and for passing optional args

```javascript
slobs.send("method", { params }); // Returns a promise
slobs.sendCallback("method", { params }, callback); // Callback returns (err, data)

// Example
slobs.send("makeSceneActive", {
  service: "ScenesService", // Service
  args: ["fakeSceneId-1235-12351"], // Args (id)
});
```

### Events

When listening for events you currently need to include the service and method seperated by a period

```javascript
obs.on("Service.Method", (data) => callback(data));
```

### Errors

WebSocket errors besides the initial socket connection will be thrown as uncaught errors. All other errors can be caught using `.catch()` when sending request and by using the below example to catch any other error.

```javascript
obs.on("error", (err) => {
  console.error("socket error:", err);
});
```

# Example Usage

```javascript
const SLOBSWebSocket = require("slobs-websocket-js");
const slobs = new SLOBSWebSocket();

slobs
  .connect({
    address: "127.0.0.1",
    port: 59650,
    path: "api",
    token: "l33t0ken",
  })
  .then(() => {
    console.log("Connected to SLOBS Websocket Server");

    return slobs.send("sceneSwitched", {
      resource: "ScenesService",
    });
  })
  .then((data) => {
    console.log(data);
  })
  .catch((err) => {
    console.log(err);
  });

slobs.on("ScenesService.sceneSwitched", (data) => {
  console.log(`New Active Scene: ${data.name}`);
});
```
