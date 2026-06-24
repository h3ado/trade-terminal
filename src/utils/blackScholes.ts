// Black-Scholes pricing model
// Uses the cumulative normal distribution function

function cumulativeNormalDistribution(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

export interface BlackScholesResult {
  callPrice: number;
  putPrice: number;
  d1: number;
  d2: number;
  // Greeks
  callDelta: number;
  putDelta: number;
  gamma: number;
  callTheta: number;
  putTheta: number;
  vega: number;
  callRho: number;
  putRho: number;
}

export function calculateBlackScholes(
  S: number,  // Stock price
  K: number,  // Strike price
  T: number,  // Time to expiration (years)
  r: number,  // Risk-free rate (decimal)
  sigma: number // Volatility (decimal)
): BlackScholesResult {
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    return {
      callPrice: 0, putPrice: 0, d1: 0, d2: 0,
      callDelta: 0, putDelta: 0, gamma: 0,
      callTheta: 0, putTheta: 0, vega: 0,
      callRho: 0, putRho: 0,
    };
  }

  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const Nd1 = cumulativeNormalDistribution(d1);
  const Nd2 = cumulativeNormalDistribution(d2);
  const NNegd1 = cumulativeNormalDistribution(-d1);
  const NNegd2 = cumulativeNormalDistribution(-d2);

  const callPrice = S * Nd1 - K * Math.exp(-r * T) * Nd2;
  const putPrice = K * Math.exp(-r * T) * NNegd2 - S * NNegd1;

  // PDF of standard normal
  const nd1 = Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI);

  // Greeks
  const callDelta = Nd1;
  const putDelta = Nd1 - 1;
  const gamma = nd1 / (S * sigma * Math.sqrt(T));
  const callTheta = (-(S * nd1 * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * Nd2) / 365;
  const putTheta = (-(S * nd1 * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * NNegd2) / 365;
  const vega = S * nd1 * Math.sqrt(T) / 100;
  const callRho = K * T * Math.exp(-r * T) * Nd2 / 100;
  const putRho = -K * T * Math.exp(-r * T) * NNegd2 / 100;

  return {
    callPrice, putPrice, d1, d2,
    callDelta, putDelta, gamma,
    callTheta, putTheta, vega,
    callRho, putRho,
  };
}
