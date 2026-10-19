# TickerHub API Agent Guide

## Purpose
This repository contains TickerHub's .NET backend, PostgreSQL persistence, crawler services, and .NET Aspire host. The API targets .NET 10 and uses ASP.NET Core, Entity Framework Core, and Npgsql.

## Primary Commands
Run commands from the repository root unless noted:

- `dotnet build backend/TickerHub.Api/StockHub.csproj` - build the API and its project references.
- `cd backend/TickerHub.UnitTests && dotnet test` - run the unit test project. Run from under `backend/` so its `global.json` selects Microsoft.Testing.Platform.
- For xUnit v3 filters, use `--filter-class` or `--filter-method`, for example: `cd backend/TickerHub.UnitTests && dotnet test --filter-class UnitTests.FoobarTest`.
- `dotnet test --project backend/TickerHub.DevTests/UnitTestsDev.csproj` - DO NOT RUN, intended for human manual testing; run development/integration tests.
- `cd apphost/TickerHub.AppHost && dotnet run --launch-profile http` - start the Aspire development environment (requires Docker; the frontend source is in `frontend/`).

## Key Architecture
- `backend/TickerHub.Api/Program.cs` configures the API and its services.
- `backend/TickerHub.Api/Controllers/` contains HTTP endpoints.
- `backend/TickerHub.Api/Services/` contains application services; `backend/TickerHub.Api/Repositories/` contains persistence access.
- `backend/TickerHub.Api/Database/`, `Models/`, and `Migrations/` contain database configuration, domain/persistence models, and EF Core migrations.
- `backend/TickerHub.Api/Crawlers/` and `Exchanges/` contain market-data crawling and exchange-related code.
- `apphost/ServiceDefaults/` contains shared Aspire service configuration.
- `apphost/TickerHub.AppHost/` orchestrates local services.
- `backend/TickerHub.UnitTests/` and `backend/TickerHub.DevTests/` contain automated tests.

Read `CONTEXT.md` for the project domain glossary and preserve those definitions when changing domain behavior.

## Data and Configuration
- The API uses PostgreSQL through EF Core and Npgsql. Keep schema changes in EF Core migrations; do not make an untracked manual schema change.
- Local connection strings and credentials belong in .NET user-secrets or environment configuration, never committed `appsettings` files.
- The `ci/build.*.sh` scripts pass `ci/.env` (checked in, server defaults such as `PG_HOST=pg_db`) to Docker Compose with `--env-file`; a dev PC overrides those values by passing the git-ignored `ci/.env.dev` as a second `--env-file`. Never commit machine-specific hosts or credentials.
- The application reads only the single connection string `ConnectionStrings:StockHubDatabase` (`backend/TickerHub.Api/Program.cs`). Keep three user-secret keys locally as a vault: `ConnectionStrings:StockHubDatabaseTest` (TEST), `ConnectionStrings:StockHubDatabase` (UAT), `ConnectionStrings:StockHubDatabaseProd` (PROD). Target selection happens by exporting the chosen value as `ConnectionStrings__StockHubDatabase` (the `__` env form of the `:` key); `ci/with-db.sh` does this for VS Code tasks and launch configs. Check the selected environment before running database commands.
- Firebase Authentication is used for JWT bearer authentication. Follow the existing authentication and endpoint conventions when changing API access.

## EF Core Migration
Use the `ef-core-migration` skill for any migration work (`migrations add`, `database update`, `migrations remove`, `migrations script`). It documents how `ci/with-db.sh` maps a target to the user-secret vault key, how to verify the target without printing the secret, and the inspect-before-apply and rollback steps.

The VS Code EF tasks (`ef-migrations-add`, `ef-update-test`, `ef-update-uat`, `ef-update-prod`, `ef-migrations-remove`) resolve their target via `ci/with-db.sh`, which copies the matching user-secret vault key into the `ConnectionStrings__StockHubDatabase` environment override (`migrations-add`/`migrations-remove` default to UAT). The VS Code launch configs (`Launch (UAT DB)`, `Launch (PROD DB)`) do the same via a generated `envFile`. Treat these as real environment-changing operations:

- Do not run `database update`, migration removal, or other database-mutating commands unless the requested target is explicit and authorized.
- Never target PROD for routine development or verification.
- For migration work, inspect the generated migration and model snapshot before applying it.
- Configure local secrets as documented in `README.md`; do not include secret values in code, logs, or this guide.

## Change and Test Practices
- Keep changes focused in the owning layer and follow the surrounding C# patterns and namespace/layout conventions.
- When changing an API contract, check its callers and related tests; update the relevant tests with the behavior change.
- Add or update automated test cases for code changes whenever a practical test path exists; prefer focused unit tests that cover both valid and invalid boundary cases. If testing is not feasible, state why and what remains unverified.
- Prefer the narrowest relevant test project. Dev tests may require PostgreSQL, credentials, or other external services; do not assume they are safe to run against a shared database.
- Do not edit generated build output under `bin/` or `obj/`.
- Avoid unrelated formatting and cleanup.

## Documentation
Use `README.md` for setup and run instructions, `CONTEXT.md` for domain terminology, and `document/` for project documentation. Keep these references current when a change alters their documented behavior.
