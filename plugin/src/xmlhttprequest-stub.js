// Stub for xmlhttprequest-ssl in browser environment
// Socket.io-client will use native browser XMLHttpRequest instead
// This prevents the Node.js version from being bundled

// Export as CommonJS module (default export)
function XMLHttpRequest() {
  // This should never be called in browser - socket.io-client uses native XMLHttpRequest
  throw new Error('XMLHttpRequest from xmlhttprequest-ssl should not be used in browser environment');
}

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = XMLHttpRequest;
}

// ES module export
export default XMLHttpRequest;
export { XMLHttpRequest };
