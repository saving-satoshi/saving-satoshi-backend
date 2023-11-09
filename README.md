# Saving Satoshi Backend

Back-end code repository for the [Saving Satoshi](https://savingsatoshi.com/) platform.
You can find our front-end code repository [here](https://github.com/saving-satoshi/saving-satoshi).

## Contributing

TBD

## Local development setup

To run this project locally:

1. Ensure you have [Node.js](https://nodejs.org), [yarn](https://yarnpkg.com/) and [PostgreSQL](https://www.postgresql.org/) installed on your machine.
2. Download the code from this repository.
3. Create an `.env` file and replace the values with your own. You can find an example [here](https://github.com/saving-satoshi/saving-satoshi-backend/blob/master/.env.example).
4. Run `yarn` to install dependencies.
5. Run `yarn db:init` to initialize the database.
6. Run `yarn db:migrate` to run all database migrations.
7. Run `yarn copy-files` to copy all files from the `src/assets` folder to the `dist` folder. (without this you won't be able to run scripts locally).
8. Start docker.
9. Run `yarn dev` to spin up the development environment.

## Run using Docker

To run this project locally using Docker:

1. Run `docker build -t saving-satoshi-backend .` in the root folder.
2. Run `docker run -p 8000:8000 saving-satoshi-backend`

## Postman

You can find our Postman workspace [here](https://www.postman.com/saving-satoshi/workspace/saving-satoshi/collection/1182590-df829bc3-2d1a-43dc-8048-8480dfd02f75?ctx=documentation).

## Roadmap

TBD
