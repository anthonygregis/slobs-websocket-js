const Socket = require("./Socket");
const Status = require("./Status");

let requestCounter = 0;

function generateMessageId() {
  return String(requestCounter++);
}

class SLOBSWebSocket extends Socket {
  /**
   * Generic Socket request method. Returns a promise.
   * Generates a messageId internally and will override any passed in the args.
   * Note that the requestType here is pre-marshaling and currently must match exactly what the websocket plugin is expecting.
   *
   * @param {String} method SLOBS expected method type
   * @param {Object} [params={}] method arguments
   * @return {Promise} Promise, passes the method response object.
   */
  send(method, params = {}) {
    params = params || {};

    return new Promise((resolve, reject) => {
      const messageId = generateMessageId();
      let rejectReason;

      if (!method) {
        rejectReason = Status.METHOD_NOT_SPECIFIED;
      }

      if (
        params &&
        (typeof params !== "object" || params === null || Array.isArray(params))
      ) {
        rejectReason = Status.PARAMS_NOT_OBJECT;
      }

      if (!this._connected) {
        rejectReason = Status.NOT_CONNECTED;
      }

      // Assign a temporary event listener for this particular messageId to uniquely identify the response
      this.once(`figureThisOut`, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });

      if (!rejectReason) {
        let message = {
          jsonrpc: "2.0",
          id: messageId,
          method,
          params,
        };

        try {
          this._socket.send(JSON.stringify(message));
        } catch (_) {
          rejectReason = Status.SOCKET_EXCEPTION;
        }
      }

      if (rejectReason) {
        this.emit(`figureThisOut`, rejectReason);
      }
    });
  }

  /**
   * Generic Socket request method. Handles callbacks.
   * Internally calls `send` (which is promise-based). See `send`'s docs for more details.
   *
   * @param {String} method SLOBS expected method type
   * @param {Object} [params={}] method arguments
   * @param {Function} callback Optional. callback(err, data)
   */
  sendCallback(method, params = {}, callback) {
    if (callback === undefined && typeof params === "function") {
      callback = params;
      params = {};
    }

    this.send(method, params)
      .then((...response) => {
        callback(null, ...response);
      })
      .catch((err) => {
        callback(err);
      });
  }
}

module.exports = SLOBSWebSocket;
