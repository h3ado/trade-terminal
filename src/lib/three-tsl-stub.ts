// Stub for `three/tsl` — three-globe imports these for its WebGPU path, while
// this app renders through WebGL. The proxy keeps unused shader-node calls inert.
const node: any = new Proxy(function noop() {}, {
  get: () => node,
  apply: () => node,
});

export const Fn = node;
export const If = node;
export const uniform = node;
export const storage = node;
export const float = node;
export const instanceIndex = node;
export const Loop = node;
export const sqrt = node;
export const sin = node;
export const cos = node;
export const asin = node;
export const exp = node;
export const negate = node;

export default node;
