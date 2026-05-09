const crypto = require('crypto');

/**
 * Generate a random 64-character hex string for private_key
 * Used in auth registration and login scenarios
 * Function signature: (context, ee, next) for flow function steps
 */
function generatePrivateKey(context, ee, next) {
  context.vars.privateKey = crypto.randomBytes(32).toString('hex');
  return next();
}

/**
 * Generate sample progress state for testing
 */
function generateProgressState(context, ee, next) {
  const lessons = ['CH1INT1', 'CH1INT2', 'CH1INT3', 'CH2INT1', 'CH2INT2'];
  const randomIndex = Math.floor(Math.random() * lessons.length);
  const randomLesson = lessons[randomIndex];

  context.vars.progressState = {
    currentChapter: parseInt(randomLesson.charAt(2)),
    currentLesson: randomLesson,
    chapters: []
  };
  return next();
}

/**
 * Generate unique test identifier
 */
function generateTestId(context, ee, next) {
  context.vars.testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return next();
}

/**
 * Log response for debugging (use sparingly in load tests)
 * Enable with ARTILLERY_DEBUG=true environment variable
 * Function signature: (requestParams, response, context, ee, next) for afterResponse hooks
 */
function logResponse(requestParams, response, context, ee, next) {
  if (process.env.ARTILLERY_DEBUG === 'true') {
    console.log(`[${context.vars.testId || 'unknown'}] Status: ${response.statusCode}`);
  }
  return next();
}

// =============================================================================
// REPL Code Generation with Configurable Timing Distribution
// =============================================================================
//
// Environment variables to control execution time distribution:
//   REPL_DIST_SHORT   - Probability of 1-5s execution (default: 0.70)
//                       Simulates typical user code: hello world, simple scripts
//   REPL_DIST_MEDIUM  - Probability of 5-15s execution (default: 0.20)
//                       Simulates moderate computation: loops, data processing
//   REPL_DIST_LONG    - Probability of 15-29s execution (default: 0.08)
//                       Simulates heavy computation approaching timeout
//   REPL_DIST_TIMEOUT - Probability of 31-40s execution (default: 0.02)
//                       Simulates code that exceeds 30s timeout limit
//
// Example: Run with 10% timeout rate to simulate heavier workloads:
//   REPL_DIST_TIMEOUT=0.10 REPL_DIST_SHORT=0.62 make test-perf-load
//
const REPL_DIST_SHORT = parseFloat(process.env.REPL_DIST_SHORT || '0.70');
const REPL_DIST_MEDIUM = parseFloat(process.env.REPL_DIST_MEDIUM || '0.20');
const REPL_DIST_LONG = parseFloat(process.env.REPL_DIST_LONG || '0.08');
const REPL_DIST_TIMEOUT = parseFloat(process.env.REPL_DIST_TIMEOUT || '0.02');

/**
 * Generate a weighted random delay based on distribution settings.
 * Returns delay in milliseconds.
 */
function getWeightedDelay() {
  const rand = Math.random();
  const shortThreshold = REPL_DIST_SHORT;
  const mediumThreshold = shortThreshold + REPL_DIST_MEDIUM;
  const longThreshold = mediumThreshold + REPL_DIST_LONG;

  if (rand < shortThreshold) {
    return 1000 + Math.random() * 4000;       // 1-5 seconds
  } else if (rand < mediumThreshold) {
    return 5000 + Math.random() * 10000;      // 5-15 seconds
  } else if (rand < longThreshold) {
    return 15000 + Math.random() * 14000;     // 15-29 seconds
  } else {
    return 31000 + Math.random() * 9000;      // 31-40 seconds (triggers timeout)
  }
}

/**
 * Generate JavaScript REPL code with variable execution time.
 * Runs secp256k1 point multiplications (G.mul) for the target duration, mirroring
 * the actual CPU work saving-satoshi users perform in production.
 * Sets context.vars.replCode (base64) and context.vars.replDelay (seconds to wait)
 */
function generateJsReplCode(context, ee, next) {
  const delayMs = Math.floor(getWeightedDelay());
  const privateKey = crypto.randomBytes(32).toString('hex');
  const lines = [
    `const {G} = require('@savingsatoshi/secp256k1js');`,
    `const key = BigInt('0x${privateKey}');`,
    `const start = Date.now();`,
    `const target = ${delayMs};`,
    `let i = 0n;`,
    `while (Date.now() - start < target) { G.mul(key + i++); }`,
    `console.log('Done: ' + i + ' ops in ' + (Date.now() - start) + 'ms');`,
  ];
  context.vars.replCode = Buffer.from(lines.join('\n')).toString('base64');
  context.vars.replDelay = Math.ceil(delayMs / 1000) + 2; // execution time + buffer
  return next();
}

/**
 * Generate Python REPL code with variable execution time.
 * Runs secp256k1 point multiplications (scalar * G) for the target duration, mirroring
 * the actual CPU work saving-satoshi users perform in production.
 * Sets context.vars.replCode (base64) and context.vars.replDelay (seconds to wait)
 *
 * Import note: the package installs as 'savingsatoshi-secp256k1py' but the Python
 * module namespace is 'secp256k1py', so the import is 'from secp256k1py.secp256k1 import G'.
 * Scalar multiplication uses the __rmul__ operator: (key + i) * G
 */
function generatePyReplCode(context, ee, next) {
  const delayMs = Math.floor(getWeightedDelay());
  const delaySec = (delayMs / 1000).toFixed(2);
  // Generate key as a decimal integer for Python (no BigInt literal syntax)
  const keyInt = BigInt('0x' + crypto.randomBytes(32).toString('hex')).toString();
  const lines = [
    'from secp256k1py.secp256k1 import G',
    'import time',
    `key = ${keyInt}`,
    'start = time.time()',
    `target = ${delaySec}`,
    'i = 0',
    'while time.time() - start < target:',
    '    (key + i) * G',
    '    i += 1',
    "print(f'Done: {i} ops in {time.time() - start:.2f}s')",
  ];
  context.vars.replCode = Buffer.from(lines.join('\n')).toString('base64');
  context.vars.replDelay = Math.ceil(delayMs / 1000) + 2; // execution time + buffer
  return next();
}

module.exports = {
  generatePrivateKey,
  generateProgressState,
  generateTestId,
  logResponse,
  generateJsReplCode,
  generatePyReplCode
};
