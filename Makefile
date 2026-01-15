init:
	docker start saving-satoshi || docker run --name saving-satoshi -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
	yarn db:migrate:dev
	yarn copy-files

start-deps:
	docker start saving-satoshi || docker run --name saving-satoshi -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

run:
	yarn dev

start:
	yarn start

start-pg-shell:
	docker exec -it transcription-db psql -U postgres

stop-deps:
	docker stop saving-satoshi

reset-deps:
	make stop-deps & make start-deps

# Artillery Performance Tests
#
# Start a performance testing server on 8001 beforehand with:
#   `yarn test:performance`
#
# TODO: After upgrading NodeJS to a more recent version,
#   consider installing Artillery via NPM and running
#   via script.
ARTILLERY_TARGET ?= http://127.0.0.1:8001
ARTILLERY_WS_TARGET ?= ws://127.0.0.1:8001

ARTILLERY_CMD = docker run --rm \
	-v $(PWD)/test/performance:/scripts \
	-e ARTILLERY_TARGET=$(ARTILLERY_TARGET) \
	-e ARTILLERY_WS_TARGET=$(ARTILLERY_WS_TARGET) \
	-e REPL_DIST_SHORT \
	-e REPL_DIST_MEDIUM \
	-e REPL_DIST_LONG \
	-e REPL_DIST_TIMEOUT \
	--network=host artilleryio/artillery:latest

test-perf-smoke:
	$(ARTILLERY_CMD) run -e smoke /scripts/profiles/http-tests.yaml

test-perf-load:
	$(ARTILLERY_CMD) run -e load /scripts/profiles/http-tests.yaml

test-perf-stress:
	$(ARTILLERY_CMD) run -e stress /scripts/profiles/http-tests.yaml

test-perf-repl:
	$(ARTILLERY_CMD) run /scripts/profiles/repl-capacity.yaml
