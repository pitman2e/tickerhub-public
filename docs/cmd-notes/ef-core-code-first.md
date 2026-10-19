# Installation Entitly Framework

## Installs Core Package
```
dotnet tool install --global dotnet-ef
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL.Design
```

## Set PATH for dotnet Tool
In `~/.bash_profile`, add the following
```
export PATH="$PATH:$HOME/.dotnet/tools/"
```

## Create DB Context
```
using System;
using Microsoft.EntityFrameworkCore;
using StockHub.Models;

namespace StockHub.Database
{
    public class StockHubContext : DbContext
    {
        public DbSet<StockTransaction> StockTransactions { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseNpgsql(@"User ID=pgadmin;Password=pgadminpassword;Host=192.168.1.110;Port=5200;Database=stockhub;");
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder) 
        {
            modelBuilder.Entity<StockTransaction>(b => {
                b.Property(p => p.StockId)
                    .HasColumnName("stock_id");

                b.HasKey(s => s.StockId);
            });
        }
    }
}
```

## "Commit" the database change to ef-migration
```
dotnet ef migrations add "Commit Message"
dotnet ef database update
```

# Add EF Core migration in Visual Studio Code and Jetbrains Rider

## Visual Studio Code
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

The VS Code EF tasks (`ef-migrations-add`, `ef-update-test`, `ef-update-uat`, `ef-update-prod`, `ef-migrations-remove`) resolve their target via `ci/with-db.sh`, which copies the matching user-secret vault key into the `ConnectionStrings__StockHubDatabase` environment override (`migrations-add`/`migrations-remove` default to UAT). The VS Code launch configs (`Launch (UAT DB)`, `Launch (PROD DB)`) do the same via a generated `envFile`. Treat these as real environment-changing operations:

## JetBrains Rider
Rider's EF migration preview runs `dotnet ef` with an explicit `--connection "<ConStrHere>"`, e.g.:
```
dotnet ef database update --project backend/TickerHub.Api/TickerHub.csproj --startup-project backend/TickerHub.Api/TickerHub.csproj \
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
