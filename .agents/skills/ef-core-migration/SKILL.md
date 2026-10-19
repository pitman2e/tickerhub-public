---
name: ef-core-migration
description: Use when adding, inspecting, applying, reverting, or scripting EF Core migrations in this repository, including selecting the target database through ci/with-db.sh.
---

# EF Core migrations through with-db.sh

Use this skill for any migration work: `migrations add`, `migrations remove`, `database update`, or `migrations script`. It documents how `ci/with-db.sh` selects the target database and the checks to run before touching it.

Migration commands change a real database. Never run a database-mutating command without an explicit, authorized target. Never target PROD for routine development or verification.

## How the target is selected

The application reads only `ConnectionStrings:StockHubDatabase` (`backend/TickerHub.Api/Program.cs`). Locally it is kept as three user-secret keys:

| Target | User-secret key |
|---|---|
| TEST | `ConnectionStrings:StockHubDatabaseTest` |
| UAT | `ConnectionStrings:StockHubDatabase` |
| PROD | `ConnectionStrings:StockHubDatabaseProd` |

`ci/with-db.sh` copies the selected value into the `ConnectionStrings__StockHubDatabase` environment override and runs the wrapped command:

```sh
ci/with-db.sh [TEST|UAT|PROD] <command> [args...]
ci/with-db.sh --write-env [TEST|UAT|PROD] <outfile>
```

Run migration commands from the API project directory so `Program.cs` can resolve its connection string:

```sh
cd backend/TickerHub.Api
```

The VS Code EF tasks (`ef-migrations-add`, `ef-update-test`, `ef-update-uat`, `ef-update-prod`, `ef-migrations-remove`) and launch configs (`Launch (UAT DB)`, `Launch (PROD DB)`) use the same wrapper. The script itself requires an explicit target; the VS Code `migrations add` and `migrations remove` tasks pass UAT.

## Never print the secret

Do not echo the connection string, the user-secret value, or a full command that embeds it. When the shape must be shown, mask the password. Verify the target before any mutation:

```sh
../../ci/with-db.sh TEST sh -c 'printf "%s\n" "$ConnectionStrings__StockHubDatabase" | sed -E "s/(Password|Pwd)=[^;]*/\1=***/Ig"'
```

Use `~/.dotnet/tools/dotnet-ef` (the path the VS Code tasks use) or `dotnet ef` if it is on `PATH`.

## Adding a migration

`migrations add` reads the model; it does not connect to or change a database. It still needs a connection string because `Program.cs` throws when one is missing.

```sh
../../ci/with-db.sh UAT ~/.dotnet/tools/dotnet-ef migrations add <MigrationName>
```

`migrations add` does not mutate anything. The VS Code `ef-migrations-add` task passes UAT for the connection string, but the command never connects. If the runtime EF version differs from the version that last wrote the snapshot, it bumps the `ProductVersion` annotation in `StockHubContextModelSnapshot.cs`. That is expected tooling noise.

For raw-SQL migrations (triggers, functions, tables not mapped in the model), `dotnet ef migrations add` produces an empty migration. Paste the SQL into its `Up`/`Down` using `migrationBuilder.Sql(""" ... """)`.

## Inspecting before applying

Always inspect the generated migration and the model snapshot before applying:

- The new `Migrations/<timestamp>_<Name>.cs`: `Up`/`Down` statements.
- `Migrations/<timestamp>_<Name>.Designer.cs` and `StockHubContextModelSnapshot.cs`.
- Any raw SQL: confirm it is idempotent where practical and that `Down` reverses it.
- If `Down` drops a table or column that holds history, say so before applying.

To produce the SQL that will run:

```sh
../../ci/with-db.sh TEST ~/.dotnet/tools/dotnet-ef migrations script <FromMigration> <ToMigration> --idempotent
```

## Applying

Check what is pending first. `database update` applies every pending migration, not just the newest one.

```sh
../../ci/with-db.sh TEST ~/.dotnet/tools/dotnet-ef migrations list
../../ci/with-db.sh TEST ~/.dotnet/tools/dotnet-ef database update
```

To stop at a specific migration, pass its name. Earlier pending migrations are still applied.

```sh
../../ci/with-db.sh TEST ~/.dotnet/tools/dotnet-ef database update <MigrationName>
```

Targets:

- TEST is for verification and testing. It may be shared; do not leave test rows behind.
- UAT is a real environment. Only when explicitly authorized.
- PROD is never routine. Only when explicitly authorized.

## Reverting

If the migration has not been applied yet, remove it:

```sh
../../ci/with-db.sh UAT ~/.dotnet/tools/dotnet-ef migrations remove
```

If it has been applied, roll the database back to the previous migration first, then remove the migration file:

```sh
../../ci/with-db.sh TEST ~/.dotnet/tools/dotnet-ef database update <PreviousMigration>
```

Inspect `Down` before reverting. A `Down` that drops an audit or history table destroys that data.

## Testing against a database

For automated PostgreSQL-backed tests, use the isolated stack from the `spawn-test-api` skill (database `sh_test` on port 6432) and `DATABASE_CONSTR`. Do not point automated tests at `TEST`, UAT, or PROD.

For one-off verification against `TEST`, wrap exploratory SQL in a transaction and roll it back so the database is left as it was:

```sql
BEGIN;
-- updates, inserts, deletes to verify behavior
ROLLBACK;
```

To open psql, convert the Npgsql connection string to libpq arguments in memory without printing the secret. Do not pass the .NET `key=value;` string to `psql` directly; it rejects it.

## Checklist

- [ ] Target is explicit and authorized.
- [ ] Secret value was never printed; target was verified masked.
- [ ] Generated migration and `Down` were inspected.
- [ ] `migrations list` shows the expected pending migrations before `database update`.
- [ ] No routine PROD operation.
- [ ] Test data and verification changes were rolled back or cleaned up.
