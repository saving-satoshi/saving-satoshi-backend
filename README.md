# Saving Satoshi Backend

Back-end code repository for the [Saving Satoshi](https://savingsatoshi.com/) platform.
You can find our front-end code repository [here](https://github.com/saving-satoshi/saving-satoshi).

## Contributing

TBD

## Local development setup

To run this project locally:

1. Ensure you have [Node.js](https://nodejs.org), [yarn](https://yarnpkg.com/), [PostgreSQL](https://www.postgresql.org/)(optional) and [Docker](https://docs.docker.com/engine/install/) installed on your machine.
2. Clone the code from this repository.
3. Copy the `.env.example` file to `.env` and fill in the required values.
4. Run `make init` to setup database, run migration and copy necessary files and run the project for the first time.

## Running the project

5. Run `make start-deps` to start the database
6. Run `make run` to start the project
7. You can now access the project at `http://localhost:8000`
8. You can access the database using the `DATABASE_URL` credentials `.env` for local development. (You can use any DB client of your choice)

## Postman

You can find our Postman workspace [here](https://www.postman.com/saving-satoshi/workspace/saving-satoshi/collection/1182590-df829bc3-2d1a-43dc-8048-8480dfd02f75?ctx=documentation).

## Roadmap

TBD
