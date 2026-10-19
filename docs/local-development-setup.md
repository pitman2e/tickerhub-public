# Local development setup

## Database and environment configuration

The API reads a single connection string named `ConnectionStrings:StockHubDatabase` from `backend/TickerHub.Api/Program.cs`.

Keep environment-specific values in a local secret vault instead of committing them to source control. The usual local pattern is:

```bash
dotnet user-secrets set "ConnectionStrings:StockHubDatabase" "<UatConStrHere>" --project ./backend/TickerHub.Api/TickerHub.csproj
dotnet user-secrets set "ConnectionStrings:StockHubDatabaseTest" "<TestConStrHere>" --project ./backend/TickerHub.Api/TickerHub.csproj
dotnet user-secrets set "ConnectionStrings:StockHubDatabaseProd" "<ProdConStrHere>" --project ./backend/TickerHub.Api/TickerHub.csproj
```

For local runs, select the target environment by exporting the override value as:

```bash
ConnectionStrings__StockHubDatabase
```

The `ci/with-db.sh` helper is used for VS Code tasks and launch configs to enforce the selected environment before running database commands.

## Compose environment files

The build and compose scripts pass `ci/.env` via `--env-file`. That checked-in file contains default values that work on the remote build server, such as:

```text
PG_HOST=pg_db
```

A development machine usually cannot resolve `pg_db`, so it creates a git-ignored `ci/.env.dev` file with the local override, for example:

```bash
printf 'PG_HOST=192.168.1.110\n' > ci/.env.dev
```

When both files are used, the later file wins. This means `.env.dev` can override values in `.env`, including settings such as `PG_PORT` or `STOCKHUB_YFINANCE_GRPC`.

The compose invocation normally looks like this:

```bash
docker compose --env-file .env --env-file .env.dev -f docker-compose.yml up -d
```

These are Compose env files, not shell scripts, so they should use plain `KEY=VALUE` entries and not `export` syntax.

## Running the stack

### Aspire

From the repo root or the apphost folder:

```bash
cd apphost/TickerHub.AppHost
dotnet run --launch-profile http
```

This starts the PostgreSQL database, backend, crawler, and frontend services.

### Docker Compose test stack

From the repository root:

```bash
docker compose -p sh-test-stack -f ci/docker-compose-test-stack.yml up -d
```

To include the Docker frontend, use the app profile:

```bash
docker compose -p sh-test-stack -f ci/docker-compose-test-stack.yml --profile app up -d
```

## VS Code and JetBrains Rider notes

- VS Code launch profiles use the generated env file workflow via `gen-env-uat` / `gen-env-prod`
- The generated file is git-ignored and consumed through `envFile`
- JetBrains Rider local setups may point to a project-specific UAT DB configuration

## Summary

The practical rule is simple: keep the real setup details in one authoritative place, use local secret storage for machine-specific values, and treat the selected environment as an explicit runtime choice.
