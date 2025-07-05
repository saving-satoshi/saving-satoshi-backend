# Saving Satoshi Backend

Back-end code repository for the [Saving Satoshi](https://savingsatoshi.com/) platform.
You can find our front-end code repository [here](https://github.com/saving-satoshi/saving-satoshi).

## Contributing

TBD

## Local development setup

This guide will help you set up this project for local development.

## Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org)
- [yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/) (optional, can be provisioned via docker)
- [Docker](https://docs.docker.com/engine/install/)

> Before setting up the project, you should have the base image for the REPL which includes all the dependencies for each programming language.

```bash
 cd src/base_images
 ```

- choose any of the language you want to build for, for example,

> to build base image for `c++`, cd into `cpp` in the base_images directory and run the following command

```bash
docker build -t cpp-base .
```

> To build base image for javascript, cd into javascript in the base_images directory and run the following command

```bash
docker build -t js-base .
```

> To build base image for python, cd into python in the base_images directory and run the following command

```bash
docker build -t py-base .
```

## Initial setup

1. Clone the code from this repository.
2. Copy the `.env.example` file to `.env`.
3. Build the project by running `yarn build`
4. Run `make init` to setup the database, run migration, copy necessary files and run the project for the first time.
5. Optional: Run the tests with `yarn test`
5. Run `make run` to start the server.
6. To stop the server, run `ctlr C`, then run `make stop-deps` to stop the database.

## Local development: running tests
To execute the tests you need to have a postgres database running. Running the database in docker is highly recommended so the tests don't have access to other, unrelated data that may be in a local instance of postgres. If you followed the steps above, the dockerized postgres instance will already be set up. Simply run `make start-deps` to bring the database up.

1. Run `yarn test` to run the tests. The tests use the `DATABASE_URL` defined in `.env`
2. Optional: take down the database with `make stop-deps`

## Running the Project after initial setup

1. Run `make start-deps` to start the database.
2. Run `make run` to start the project.
3. You can now access the project at `http://localhost:8000`.

## Accessing the Database

You can access the database using the `DATABASE_URL` credentials in the `.env` file for local development. You can use any DB client of your choice.

## Releasing a New Chapter

After pushing lesson content to master a chapter will remain disabled until a new feature flag is pushed. To unlock a new chapter you must push a feature flag request to the api with the chapter number specified.  Here is the necessary scaffold to unlock the next chapter.

```bash
curl --location --request PUT '${backend.api}/v1/features/' \
--header 'Origin: http://localhost:3000/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer ${token}' \
--data '{
  "feature_name": "chapter_#_enabled",
  "feature_value": 1
}'
```

## Postman

You can find our Postman workspace [here](https://www.postman.com/saving-satoshi/workspace/saving-satoshi/collection/1182590-df829bc3-2d1a-43dc-8048-8480dfd02f75?ctx=documentation).

## Roadmap

TBD