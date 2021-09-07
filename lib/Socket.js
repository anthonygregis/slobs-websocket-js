const SockJS = require("sockjs-client");
const EventEmitter = require("events");
const Status = require("./Status");

class Socket extends EventEmitter {
  constructor() {
    super();
    this._connected = false;
    this._socket = undefined;

    const originalEmit = this.emit;
    this.emit = function (...args) {
      originalEmit.apply(this, args);
    };
  }

  async connect(args = {}) {
    args = args || {};
    const address = args.address || "127.0.0.1";
    const port = args.port || 59650;
    const path = args.path || "api";
    const token = args.token;

    if (this._socket) {
      try {
        this._socket.close();
      } catch (err) {
        // These errors are probably safe to ignore
      }
    }

    return new Promise(async (resolve, reject) => {
      try {
        await this._connect(address, port, path);
        await this._authenticate(token);
        resolve();
      } catch (err) {
        this._socket.close();
        this._connected = false;
        reject(err);
      }
    });
  }

  /**
   * Opens a WebSocket connection to a SLOBS server, but does not attempt any authentication.
   *
   * @param {String} address url without http:// prefix
   * @param {Number} port port used by SLOBS Websocket Server (Default: 59650)
   * @param {String} path path used by SLOBS Websocket Server (Default: api)
   * @returns {Promise}
   * @private
   * @return {Promise} on attempted creation of WebSocket connection
   */
  async _connect(address, port, path) {
    return new Promise((resolve, reject) => {
      let settled = false;

      this._socket = new SockJS(`http://${address}:${port}/${path}`);

      this._socket.onerror = (err) => {
        if (settled) {
          this.emit("error", err);
          return;
        }

        settled = true;
        reject(Status.CONNECTION_ERROR);
      };

      this._socket.onopen = () => {
        if (settled) {
          return;
        }

        this._connected = true;
        settled = true;

        this.emit("ConnectionOpened");
        resolve();
      };

      this._socket.onclose = () => {
        this._connected = false;
        this.emit("ConnectionClosed");
      };

      this._socket.onmessage = (msg) => {
        const message = JSON.parse(msg.data);
        let err;
        let data;

        if (message.error) {
          err = message.error;
        } else {
          data = message.result;
        }

        if (message.id) {
          this.emit(message.id, err, data);
        } else if (message.result && message.result._type === "EVENT") {
          this.emit(message.result.resourceId, message.result.data);
        }
      };
    });
  }

  async _authenticate(token = "") {
    if (!this._connected) {
      throw Status.NOT_CONNECTED;
    }

    await this.send("auth", {
      resource: "TcpServerService",
      args: [token],
    });

    try {
      await this.send("auth", {
        resource: "TcpServerService",
        args: [token],
      });
    } catch (e) {
      this.emit("AuthenticationFailure");
      throw e;
    }

    this.emit("AuthenticationSuccess");
  }

  /**
   * Close and disconnect the WebSocket connection.
   * FIXME: this should support a callback and return a Promise to match the connect method.
   *
   * @function
   * @category request
   */
  disconnect() {
    if (this._socket) {
      this._socket.close();
    }
  }
}

module.exports = Socket;
