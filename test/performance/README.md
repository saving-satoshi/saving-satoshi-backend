# Artillery Performance Tests

Performance test suite for capacity planning and load testing.

## Prerequisites

- Docker installed and running
- Server running locally on port 8001 using `yarn test:performance` (or configure `ARTILLERY_TARGET`)

It's not a good idea to run the performance tests and the unit tests simultaneously. It can lead to unexpected behavior, especially concerning the REPL containers.

## Quick Start

```bash
# Start dependencies and server
make start-deps
yarn build && yarn test:performance

# Run smoke test (quick validation)
make test-perf-smoke
```

## Test Architecture

The test suite uses Artillery's **environments feature** to reduce duplication:

- **`http-tests.yaml`** - Consolidated HTTP API tests with 3 environments (smoke/load/stress)
  - All environments share the same scenario definitions
  - Each environment has unique phases and SLA thresholds
  - Reduces duplication by ~45% compared to separate files

- **`repl-capacity.yaml`** - Separate WebSocket REPL capacity tests
  - Different protocol (WebSocket vs HTTP)
  - Different testing purpose (container capacity vs API throughput)
  - Remains independent from HTTP tests

## Test Profiles

| Profile | Duration | Purpose | Command |
|---------|----------|---------|---------|
| **smoke** | ~30s | Quick CI validation | `make test-perf-smoke` |
| **load** | ~12 min | Sustained traffic baseline | `make test-perf-load` |
| **stress** | ~15 min | Find breaking points | `make test-perf-stress` |
| **repl** | ~12 min | REPL container capacity | `make test-perf-repl` |

### Running Tests Directly with Docker

```bash
# Run smoke test using environment selection
docker run --rm -v $(PWD)/test/performance:/scripts \
  --network=host artilleryio/artillery:latest \
  run -e smoke /scripts/profiles/http-tests.yaml

# Run load test
docker run --rm -v $(PWD)/test/performance:/scripts \
  --network=host artilleryio/artillery:latest \
  run -e load /scripts/profiles/http-tests.yaml

# Run stress test
docker run --rm -v $(PWD)/test/performance:/scripts \
  --network=host artilleryio/artillery:latest \
  run -e stress /scripts/profiles/http-tests.yaml

# Run REPL capacity test (no environment needed)
docker run --rm -v $(PWD)/test/performance:/scripts \
  --network=host artilleryio/artillery:latest \
  run /scripts/profiles/repl-capacity.yaml
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ARTILLERY_TARGET` | `http://localhost:8001` | HTTP API target URL |
| `ARTILLERY_WS_TARGET` | `ws://localhost:8001` | WebSocket target URL |

### REPL Timing Distribution

Control the distribution of REPL execution times to simulate realistic user behavior:

| Variable | Default | Description |
|----------|---------|-------------|
| `REPL_DIST_SHORT` | `0.70` | Probability of 1-5s execution (typical user code) |
| `REPL_DIST_MEDIUM` | `0.20` | Probability of 5-15s execution (moderate computation) |
| `REPL_DIST_LONG` | `0.08` | Probability of 15-29s execution (heavy computation) |
| `REPL_DIST_TIMEOUT` | `0.02` | Probability of 31-40s execution (triggers 30s timeout) |

```bash
# Run with higher timeout rate for stress testing
REPL_DIST_TIMEOUT=0.10 REPL_DIST_SHORT=0.62 make test-perf-stress

# Run with no timeouts for quick validation
REPL_DIST_TIMEOUT=0 make test-perf-smoke
```

### Testing Remote Servers

```bash
# Test staging environment
ARTILLERY_TARGET=https://api-staging.example.com \
ARTILLERY_WS_TARGET=wss://api-staging.example.com \
make test-perf-smoke
```

## Test Descriptions

### Smoke Test (environment: `smoke`)
Quick validation suitable for CI pipelines:
- Health check endpoint
- Feature flags endpoint
- Full auth flow (register, login, session, logout)
- WebSocket REPL smoke test
- SLAs: p99 < 2s, error rate < 1%

### Load Test (environment: `load`)
Sustained traffic to establish performance baselines:
- Phases: warmup → ramp → sustained → peak → cooldown
- Scenarios: anonymous browsing, authenticated sessions, lesson data, features, REPL execution
- SLAs: p99 < 2s, median < 500ms, error rate < 1%

### Stress Test (environment: `stress`)
Aggressive ramp-up to find system limits:
- Ramps from 10 to 300 requests/second
- Relaxed SLAs to allow finding breaking points
- Watch for: error rate spike, latency degradation
- Includes REPL stress scenarios

### REPL Capacity Test (`repl-capacity.yaml`)
WebSocket test for REPL container limits on t2.small:
- Phases: 2 → 3 → 4 → 5 → 6 concurrent connections
- Longer phases to observe CPU credit depletion
- Tests JavaScript and Python execution
- Critical for EC2 instance sizing

## Shared Scenarios

All HTTP test environments (smoke/load/stress) share the same scenario definitions from `http-tests.yaml`. This means:

- **Add a scenario once, it's available to all profiles** - No need to duplicate across files
- **Scenario weights are shared** - Cannot customize weights per environment (acceptable trade-off)
- **Phases and SLAs remain customizable** - Each environment has unique traffic patterns and thresholds
- **Easier maintenance** - Update auth flow once, not 3 times

If you need to add a new scenario (e.g., testing a new API endpoint), add it to `http-tests.yaml` and it will automatically be available to all three environments.

## Capacity Planning Metrics

For t2.small (1 vCPU, 2GB RAM):

t2 instances are burstable with a 20% baseline (~0.2 vCPU sustained). Performance
degrades after CPU credits deplete under sustained load. Unlike t3, t2 Unlimited
mode is off by default and must be opted in (extra cost).

Memory budget: ~1350 MB available after OS and app overhead. At 256 MB per REPL
container, hard cap is ~5 containers before OOM.

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Concurrent REPL (burst) | < 4 | 4-5 | > 5 |
| Concurrent REPL (sustained) | < 2 | 2-3 | > 3 |
| Memory usage | < 1.5GB | 1.5-1.8GB | > 1.8GB |
| API p99 latency | < 500ms | 500ms-2s | > 2s |
| Sustained req/s | < 5 | 5-10 | > 10 |
| Error rate | < 1% | 1-5% | > 5% |

**Testing considerations:**
- Run stress tests with depleted credits for worst-case baseline
- Enable t2 Unlimited mode only if burstable CPU is insufficient and cost is acceptable
- Memory is a binding constraint alongside CPU; monitor both during REPL tests
