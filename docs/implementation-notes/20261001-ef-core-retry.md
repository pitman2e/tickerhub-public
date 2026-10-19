Here is a summary of everything we covered regarding EF Core, connection resiliency, and manual transactions. This is structured so you can easily save it to your notes.

## EF Core Retries vs. Manual Transactions

**The Core Conflict:**
When you enable connection resiliency globally (`EnableRetryOnFailure`), EF Core blocks manual transactions (`BeginTransactionAsync`) by throwing an `InvalidOperationException`.

**The Reason:**
EF Core does not know if your C# code is safe to execute multiple times. If a database command fails halfway through a transaction, EF Core cannot automatically restart it because doing so might duplicate non-database side effects (like sending emails) or corrupt in-memory variables.

---

## 1. The Standard Fix: Execution Strategies

To use manual transactions with global retries enabled, you must wrap the entire transaction block in an Execution Strategy. This tells EF Core exactly what block of code to replay if a transient error occurs.

**Syntax Note:** If `ExecuteAsync` demands 4 parameters instead of 1, you are missing `using Microsoft.EntityFrameworkCore;` at the top of your file.

```csharp
var strategy = context.Database.CreateExecutionStrategy();

await strategy.ExecuteAsync(async () =>
{
    // 1. Reset state (CRITICAL)
    context.ChangeTracker.Clear();

    // 2. Begin transaction INSIDE the lambda
    await using var dbTrans = await context.Database.BeginTransactionAsync();

    // 3. Database operations (SELECT, INSERT, UPDATE)
    var newStock = new Stock { Symbol = "AAPL" };
    context.Stocks.Add(newStock);
    await context.SaveChangesAsync();

    // 4. Commit
    await dbTrans.CommitAsync();
});

```

---

## 2. Managing State Inside a Retry Block

When a failure occurs, EF Core re-runs the entire `ExecuteAsync` lambda from the beginning. You are responsible for ensuring the retry starts with a clean slate.

| Rule | Explanation |
| --- | --- |
| **Clear the ChangeTracker** | Call `context.ChangeTracker.Clear()` at the start of the block. Otherwise, EF Core will throw an error on retry because it is already tracking the entity from the first failed attempt. |
| **Reset Local Variables** | Declare lists, counters, or temporary variables *inside* the strategy block so they are recreated on every attempt. |
| **No External Side Effects** | Never place HTTP calls, file writes, or email dispatches inside the strategy block. EF Core cannot roll these back if the database fails. |

---

## 3. Alternative Approaches (Opt-In Retries)

If you prefer standard manual transactions to fail immediately and only want to apply retries to specific background tasks (like web crawlers), you should remove `EnableRetryOnFailure` from your global `DbContext` configuration.

You can then apply retries manually in two ways:

**Approach A: Manual Strategy Instantiation**
Create the strategy directly in the specific service where it is needed:

```csharp
var strategy = new NpgsqlRetryingExecutionStrategy(context, maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), null);

await strategy.ExecuteAsync(async () => { /* transaction code */ });

```

**Approach B: Use Polly**
Wrap your queries in a Polly retry policy, leaving EF Core transactions completely standard.

```csharp
var retryPolicy = Policy.Handle<NpgsqlException>(ex => ex.IsTransient).WaitAndRetryAsync(3, ...);

await retryPolicy.ExecuteAsync(async () => { /* transaction code */ });

```

---

## 4. Handling Docker Database Startup

If you initially enabled `EnableRetryOnFailure` just to make your API wait for PostgreSQL to boot up in Docker Compose, it is better to remove the EF Core retry logic entirely and solve it at the infrastructure level.

In your `docker-compose.yml`, add a `healthcheck` to the database container, and use `depends_on: condition: service_healthy` on your API container. This prevents the API from starting until the database is truly ready to accept connections.
