init:
	docker start saving-satoshi || docker run --name saving-satoshi -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
	yarn db:migrate
	yarn copy-files
	yarn dev

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





