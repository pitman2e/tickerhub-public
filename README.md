# Run TickerHub Locally
- TODO: Migrating to monorepo, expect breakage and inaccurate documents information
- TODO: Renaming `StockHub` to `TickerHub`, expect mixed name usage
- TODO: Missing optional database entries, 
- Crawling latest prices need to manually triggered from the "Admin" page (Cooldown applies)

## TL;DR (Requires: docker, npm, dotnet)
```
git clone https://github.com/pitman2e/tickerhub-public.git
cd ./tickerhub-public/apphost/TickerHub.AppHost
dotnet run --launch-profile http
```

## TL;DR (Requires: docker)
Frontend: http://localhost:3100/
```
git clone https://github.com/pitman2e/tickerhub-public.git
cd tickerhub-public
docker compose -p sh-test-stack -f ci/docker-compose-test-stack.yml --profile app up -d
docker compose -p sh-test-stack -f ci/docker-compose-test-stack.yml --profile app down
```

## Steps
### Aspire
- Spin up PostgreSQL database, backend, crawler and frontend
- The frontend is included under `frontend/` in this repository
- Open the link of the 'vite' project from the Aspire Dashboard

#### Via IDE
- Run the Aspire Project with Launch Profile `http`

#### Via Commandline
```
cd apphost/TickerHub.AppHost
dotnet run --launch-profile http
```

### Docker Compose test stack
The isolated test stack includes PostgreSQL, the API, yfinance, and an optional Docker frontend. The frontend service is profile-gated. Use Vite's `npm run start:test` for frontend work.

Start the core stack from the repository root:
```
docker compose -p sh-test-stack -f ci/docker-compose-test-stack.yml up -d
```

Use `--build` when source changes need to be included in the images. For manual inspection of the Docker frontend, start the stack with `--profile app`.

# Run locally (For my reference only)
Add database secrets (local vault; `Program.cs` reads only the bare UAT key, `ci/with-db.sh` selects the target via the `ConnectionStrings__StockHubDatabase` override):
```
dotnet user-secrets set "ConnectionStrings:StockHubDatabase" "<UatConStrHere>" --project ./backend/TickerHub.Api/StockHub.csproj
dotnet user-secrets set "ConnectionStrings:StockHubDatabaseTest" "<TestConStrHere>" --project ./backend/TickerHub.Api/StockHub.csproj
dotnet user-secrets set "ConnectionStrings:StockHubDatabaseProd" "<ProdConStrHere>" --project ./backend/TickerHub.Api/StockHub.csproj
```

## Jetbrain Rider
- Open the solution and `SH UAT DB`
- This configuration uses my own setup

## VSCode
- Launch via `Launch (UAT DB)` or `Launch (PROD DB)`; the `gen-env-uat`/`gen-env-prod` pre-launch task copies the matching user-secret into a git-ignored `.vscode/.env.<ENV>.generated` file consumed via `envFile` (the `launch.json` `"env"` block is static and cannot call scripts directly).

# Add EF Core migration (For my reference only)
For convenience, use `Ctrl + Shift + B` in Visual Studio Code and use the following Tasks (each resolves its DB via `ci/with-db.sh TEST|UAT|PROD`; `ef-migrations-add`/`ef-migrations-remove` default to UAT):
```
ef-migrations-add
ef-update-test
ef-update-uat
ef-update-prod
ef-migrations-remove
```

Requires setting up `dotnet user-secrets` as mentioned above. Equivalent manual form without VS Code:
```
./ci/with-db.sh UAT ${HOME}/.dotnet/tools/dotnet-ef database update
```

## JetBrains Rider
Rider's EF migration preview runs `dotnet ef` with an explicit `--connection "<ConStrHere>"`, e.g.:
```
dotnet ef database update --project backend/TickerHub.Api/StockHub.csproj --startup-project backend/TickerHub.Api/StockHub.csproj \
  --context StockHub.Database.StockHubContext --configuration Debug \
  "<migration>" --connection "<ConStrHere>"
```

Design-time `DbContext` creation order and how it interacts with this repo:

1. The tools look for an `IDesignTimeDbContextFactory<StockHubContext>` — there is none, so they fall through to building the app host from `Program.cs` and resolving `DbContextOptions<StockHubContext>` from DI.
2. `Program.cs` therefore executes up to `builder.Build()` (service registration, `GetConnectionString("StockHubDatabase")`, `AddDbContext`, entity configuration, `AuditInterceptor`). `app.Run()` is not invoked. The `StockHubContext(string connectionString)` constructor plays no role here — it is test-only (`backend/TickerHub.UnitTests/`, `backend/TickerHub.DevTests/`); the tools construct the context from the DI-resolved options.
3. After the options are built, `--connection` replaces just the relational connection string on them. The migration model comes from your code; the target server comes from `--connection`, never from user-secrets or `ConnectionStrings__StockHubDatabase`.

Practical consequences:

- The bare `ConnectionStrings:StockHubDatabase` user-secret must still exist locally: `Program.cs:228-231` throws `InvalidOperationException("No connection string is configured")` at host-build time when it is missing, which fails even a PROD-targeted `--connection` command before anything is applied.
- Always verify the `--connection` value's `Database=` segment (`sh_test` vs `sh_uat` vs `sh_prod`) in Rider's preview before applying — unlike the VS Code tasks, nothing maps or labels the target for you, and `database update` against PROD runs immediately.

# Build docker image and run (For UAT)
```
cd ci
cp build.uat.example.sh build.uat.sh
```
Modify `build.uat.sh` as needed, then run
```
./build.uat.sh
```

## Environment settings (`ci/.env` and `ci/.env.dev`)
`ci/build.test.sh`, `ci/build.uat.sh` and `ci/build.prod.sh` pass `ci/.env` to Docker Compose with `--env-file`. That file is checked in and holds the defaults that work on the remote build server, where containers reach PostgreSQL by its Docker service name (`PG_HOST=pg_db`).

A development PC cannot resolve that name, so it needs the database's IP address instead. Create the git-ignored `ci/.env.dev` with the machine-specific override:
```
printf 'PG_HOST=192.168.1.110\n' > ci/.env.dev
```
When that file exists the scripts pass it as a second `--env-file`, and later files win, so it overrides `.env`. `PG_PORT` and `STOCKHUB_YFINANCE_GRPC` live in `.env` too, so they can be overridden the same way.

These are Compose env files, not shell scripts: use plain `KEY=VALUE` lines, no `export`. Values reach the containers through `${VAR}` interpolation in the Compose YAML. Running `docker compose` directly needs the same flags:
```
docker compose --env-file .env --env-file .env.dev -f docker-compose.yml up -d
```

# Authentication and Authorization
- Firebase Authentication - Accepts JWT bearer from Google Cloud Firebase authentication services:

## Settings:
In `Program.cs`
```
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    ...)
```

- No Authorization control

# Jenkins Schedule Job Setting:
- Required plugins: [Environment Injector](https://plugins.jenkins.io/envinject/)
- Create as a `Pipeline` project

## Settings:
`Triggers` > `Build periodically`
```
H/5 * * * *
```
### Environment
- Checks `Delete workspace before build starts`
#### Inject passwords to the build as environment variables
```
Job passwords:
Name: JWT
Password: Bearer MDZjOGxFN1hrS0abcd1234
```
Checks `Mask password parameters`

### Build Steps
```
curl -f -H "Authorization: $JWT" http://localhost:4000/api/ScheduledJobs/CrawlStockPrice_Minutely
```

# AI Usage Disclosure
- Originally hand-written and mostly AI-assisted recently
- LLM: GPT-Luna 6 (Github Copilot/Chat), DeepSeek Flash (OpenCode), Gemini Flash (Chat), and any other agnetic free tier models I can get
