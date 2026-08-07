/** Node worker_threads bridge for exercising the production browser Worker module. */
import { parentPort } from 'node:worker_threads';

globalThis.self = {
  postMessage(message, transfers) { parentPort.postMessage(message, transfers); },
  onmessage: null,
};
parentPort.on('message', (data) => globalThis.self.onmessage?.({ data }));
await import('../../src/simulation/protocol/worker-entry.js');
