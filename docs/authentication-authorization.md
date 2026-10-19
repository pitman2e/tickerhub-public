# Authentication and authorization

## Firebase authentication

The application uses Firebase Authentication for JWT bearer validation. In practice, the service accepts Firebase-issued JWTs and validates them using the configured bearer authentication pipeline.

The pattern in `Program.cs` is conceptually:

```csharp
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // config goes here
    });
```

The repository does not appear to use a separate custom authorization policy layer beyond the project’s existing endpoint conventions. When changing API access, follow the established auth patterns already used by the service.

## Practical guidance

- Keep the auth configuration in the existing ASP.NET Core setup
- Do not add ad hoc authorization rules without matching the current conventions
- If you change access behavior, update the relevant endpoint tests or callers

## Summary

The important point is not the specific JWT code block itself, but the fact that the app is built around Firebase-issued bearer tokens and that endpoint access should remain consistent with the project’s existing access model.
