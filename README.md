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
dotnet user-secrets set "ConnectionStrings:StockHubDatabase" "<UatConStrHere>" --project ./backend/TickerHub.Api/TickerHub.csproj
dotnet user-secrets set "ConnectionStrings:StockHubDatabaseTest" "<TestConStrHere>" --project ./backend/TickerHub.Api/TickerHub.csproj
dotnet user-secrets set "ConnectionStrings:StockHubDatabaseProd" "<ProdConStrHere>" --project ./backend/TickerHub.Api/TickerHub.csproj
```

## Jetbrain Rider
- Open the solution and `SH UAT DB`
- This configuration uses my own setup

## VSCode
- Launch via `Launch (UAT DB)` or `Launch (PROD DB)`; the `gen-env-uat`/`gen-env-prod` pre-launch task copies the matching user-secret into a git-ignored `.vscode/.env.<ENV>.generated` file consumed via `envFile` (the `launch.json` `"env"` block is static and cannot call scripts directly).

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
For the full local database setup, secret pattern, and compose env override details, see [docs/local-development-setup.md](docs/local-development-setup.md).

# Authentication and Authorization
For the repo’s Firebase JWT setup and the current auth conventions, see [docs/authentication-authorization.md](docs/authentication-authorization.md).

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
