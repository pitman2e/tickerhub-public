# TickerHub API Agent Guide

## Purpose
This repository contains TickerHub's .NET backend, PostgreSQL persistence, crawler services, and .NET Aspire host. The API targets .NET 10 and uses ASP.NET Core, Entity Framework Core, and Npgsql.

## Primary Commands
Run commands from the repository root unless noted:

- `dotnet build backend/TickerHub.Api/TickerHub.csproj` - build the API and its project references.
- `cd backend/TickerHub.UnitTests && dotnet test` - run the unit test project. Run from under `backend/` so its `global.json` selects Microsoft.Testing.Platform.
- For xUnit v3 filters, use `--filter-class` or `--filter-method`, for example: `cd backend/TickerHub.UnitTests && dotnet test --filter-class UnitTests.FoobarTest`.
- `dotnet test --project backend/TickerHub.DevTests/UnitTestsDev.csproj` - DO NOT RUN, intended for human manual testing; run development/integration tests.

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
- For the local database setup, environment overrides, and compose env behavior, see [docs/local-development-setup.md](docs/local-development-setup.md).
- Firebase Authentication is used for JWT bearer validation. Follow the existing authentication and endpoint conventions when changing API access; see [docs/authentication-authorization.md](docs/authentication-authorization.md) for the reference note.

## EF Core Migration
- Use the `ef-core-migration` skill for any migration work (`migrations add`, `database update`, `migrations remove`, `migrations script`).

## Change and Test Practices
- Keep changes focused in the owning layer and follow the surrounding C# patterns and namespace/layout conventions.
- When changing an API contract, check its callers and related tests; update the relevant tests with the behavior change.
- Add or update automated test cases for code changes whenever a practical test path exists; prefer focused unit tests that cover both valid and invalid boundary cases. If testing is not feasible, state why and what remains unverified.
- Prefer the narrowest relevant test project. Dev tests may require PostgreSQL, credentials, or other external services; do not assume they are safe to run against a shared database.
- Avoid unrelated formatting and cleanup.

## Documentation
Use `README.md` for setup and run instructions, `CONTEXT.md` for domain terminology, and `docs/` for project documentation. Keep these references current when a change alters their documented behavior.
