### Log prefix conventions

#### [SERVER]

Dùng cho log liên quan đến HTTP server hoặc Express app.

```js
console.log(`[SERVER] Server running on http://localhost:${PORT}`);
console.log(`[SERVER] Express initialized`);
console.log(`[SERVER] Listening on port ${PORT}`);
```

#### [DB]

Dùng cho log kết nối và thao tác database.

```js
console.log(`[DB] MongoDB connection established`);
console.error(`[DB] MongoDB connection failed: ${error.message}`);
console.log(`[DB] Database disconnected`);
```

#### [AUTH]

Dùng cho authentication / authorization.

```js
console.log(`[AUTH] User login success: ${userId}`);
console.warn(`[AUTH] Invalid login attempt for email: ${email}`);
console.log(`[AUTH] Token verified for user ${userId}`);
```

#### [API]

Dùng cho request hoặc response của API.

```js
console.log(`[API] GET /api/books`);
console.log(`[API] POST /api/auth/login`);
console.error(`[API] 500 Internal Server Error`);
```

#### [WORKER]

Dùng cho background jobs, queue, cron tasks.

```js
console.log(`[WORKER] Report generation started`);
console.log(`[WORKER] Email job queued`);
console.log(`[WORKER] Cleanup task completed`);
```
