# Frontend Development

## Test stack
Start the API and database using the repository root's `spawn-test-api` skill or the `ci/docker-compose-test-stack.yml` Compose file. From this directory, start the Vite frontend:

```
npm run start:test
```

This uses Vite mode `test`, loads `.env.test`, serves on port 3100, and hot reloads source changes. The VS Code launch configuration is named "Run npm start (Test)".

The Docker frontend is available for manual inspection with the test Compose stack's `app` profile on port 3000. Agent-driven work should use Vite instead.

## Aspire
See the repository root `README.md` for the Aspire development stack.

# Run locally

## JWT Auth Configuration

### Use Firebase Auth
- Create firebase config `src/auth/firebase.ts` (Download from Firebase, see `src/auth/firebase.example.ts` as example)
### Use Custom JWT
- The local test mode provides `VITE_DEMO_JWT` through `.env.test`; deployed demo authentication remains configured separately.

## Configure build-time Envs
Modify `.env.dev` as needed

`VITE_APP_PUBLIC_URL` sets Vite `base` for dev assets at `http://localhost:3000/{VITE_APP_PUBLIC_URL}`

Run the following command:
```
npm run start
```

## Build Docker Image and run its container
Copy `ci/build.example.sh` to `ci/build.sh` and modify accordingly

Execute the script:
```
./ci/build.sh
```

# Outer Reverse Proxy

## Nginx Config
Note that `location` must be ended with forward slash

```
location /sh/uat/app/ {
    access_log /var/log/nginx/sh_app_uat_access.log cuslogformat;
    error_log /var/log/nginx/sh_app_uat_error.log;

    proxy_pass http://127.0.0.1:9101/sh/uat/app/;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
