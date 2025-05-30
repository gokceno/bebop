# Migration Guide: Bebop Client v1.0.0

## Overview

Version 1.0.0 introduces a simplified, unified architecture that uses native fetch and shared code between browser and Node.js environments, eliminating external dependencies and removing batching complexity for a cleaner API.

## Breaking Changes

### 1. Node.js Version Requirement

**Before:**
- Any Node.js version with `got` and `p-queue` support

**After:**
- Node.js 18.0.0+ required (for native fetch support)

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 2. Dependencies Removed

**Before:**
```json
{
  "dependencies": {
    "got": "^14.4.7",
    "p-queue": "^8.1.0"
  }
}
```

**After:**
```json
{
  "dependencies": {}
}
```

Zero external dependencies! The package now uses:
- Native `fetch` API (Node.js 18+ and browsers)
- Custom `SimpleQueue` implementation
- Shared code between environments

## API Compatibility

### ✅ Core Methods Unchanged

Core API calls remain the same:

```javascript
// These work exactly the same
const client = Bebop({ baseUrl: 'https://...', bearerToken: 'token' });
await client.send('event', { data: 'value' });    // ✅ Same
client.sendAsync('event', { data: 'value' });     // ✅ Same
await client.flush();                              // ✅ Same
```

### ❌ Removed Methods

The `batch()` method has been removed for simplicity:

```javascript
// Before v1.0.0
client.batch([                                     // ❌ REMOVED
  { eventName: 'event1', eventParams: { data: 'a' } },
  { eventName: 'event2', eventParams: { data: 'b' } }
]);

// v1.0.0 - Use individual calls instead
client.sendAsync('event1', { data: 'a' });        // ✅ Simple
client.sendAsync('event2', { data: 'b' });        // ✅ Clean
```
</edits>

### ⚠️ Configuration Changes

Most configuration options remain the same, but batching has been removed:

```javascript
// Before v1.0.0
const client = Bebop({
  baseUrl: 'https://analytics.com',
  bearerToken: 'token',
  concurrency: 5,
  output: true,
  batching: {                  // ❌ REMOVED
    enabled: true,
    maxBatchSize: 10,
    flushInterval: 1000
  }
});

// v1.0.0 - Simplified
const client = Bebop({
  baseUrl: 'https://analytics.com',
  bearerToken: 'token',        // ✅ Same
  concurrency: 5,              // ✅ Same
  output: true                 // ✅ Same
});
```

## Bundle Size Improvements

| Version | Browser Bundle | Node.js Bundle | Dependencies | Features |
|---------|----------------|----------------|--------------|----------|
| 0.3.x   | 5.23 KB        | 288 KB         | got, p-queue | Batching |
| 1.0.0   | 3.19 KB        | 3.19 KB        | None         | Simplified |

**Improvements:**
- 📦 Node.js bundle: **99% smaller** (288KB → 3.19KB)
- 🌐 Browser bundle: **39% smaller** (5.23KB → 3.19KB)
- 🚀 Zero dependencies
- ⚡ Better performance with native fetch
- 🎯 Simplified API without batching complexity

## Performance Improvements

### Before (using got + p-queue)
```javascript
// Node.js used heavy HTTP client
import got from 'got';
import PQueue from 'p-queue';

// Different implementations for browser vs Node.js
// Large bundle size with external dependencies
```

### After (unified architecture)
```javascript
// Universal fetch + shared queue
class UniversalHttpClient {
  async post(endpoint, data) {
    const response = await fetch(url, options);
    return response.json();
  }
}

// Same implementation everywhere!
```

## Migration Steps

### 1. Update Node.js Version

Ensure you're running Node.js 18.0.0 or higher:

```bash
node --version  # Should be 18.0.0+
```

### 2. Update Package Version

```bash
npm install @gokceno/bebop-client@^1.0.0
# or
yarn add @gokceno/bebop-client@^1.0.0
```

### 3. Remove Old Dependencies (if manually installed)

If you had manually installed got or p-queue:

```bash
npm uninstall got p-queue
```

### 4. Remove Batching Configuration

Remove any batching configuration from your code:

```javascript
// Before v1.0.0
const client = Bebop({
  baseUrl: 'https://your-analytics.com',
  bearerToken: 'your-token',
  batching: { enabled: true } // ❌ Remove this
});

// v1.0.0
const client = Bebop({
  baseUrl: 'https://your-analytics.com',
  bearerToken: 'your-token'
  // ✅ Clean and simple
});
```

### 5. Replace Batch Calls

Replace any `batch()` calls with individual `sendAsync()` calls:

```javascript
// Before v1.0.0
client.batch([
  { eventName: 'event1', eventParams: { data: 'a' } },
  { eventName: 'event2', eventParams: { data: 'b' } }
]);

// v1.0.0
client.sendAsync('event1', { data: 'a' });
client.sendAsync('event2', { data: 'b' });
```

### 6. Test Your Implementation

Test to ensure everything works:

```javascript
import { Bebop } from '@gokceno/bebop-client';

const client = Bebop({
  baseUrl: 'https://your-analytics.com',
  bearerToken: 'your-token'
});

// Test non-blocking
client.sendAsync('test_migration', { version: '1.0.0' });

// Test blocking
await client.send('test_migration_blocking', { version: '1.0.0' });

console.log('Migration successful!');
```

## Environment Detection Changes

### Before
```javascript
// Different HTTP clients
if (typeof window !== 'undefined') {
  // Browser: fetch
} else {
  // Node.js: got
}
```

### After
```javascript
// Universal implementation
// Same fetch everywhere
// Same queue implementation
// Same batching logic
```

## Error Handling Improvements

### Consistent Error Messages

Both environments now return identical error formats:

```javascript
try {
  await client.send('event', {});
} catch (error) {
  // Same error format in browser and Node.js
  console.error(error.message);
}
```

## Package Exports

### Before
```json
{
  "main": "./dist/index.js",
  "browser": "./dist/browser.js"
}
```

### After
```json
{
  "main": "./dist/index.js",
  "browser": "./dist/browser.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "browser": "./dist/browser.js",
      "node": "./dist/index.js",
      "default": "./dist/browser.js"
    }
  }
}
```

Modern package resolution with proper environment detection.

## TypeScript Changes

### Enhanced Type Safety

All types remain the same, but now with better internal consistency:

```typescript
import { Bebop, BebopConfig, BebopClient } from '@gokceno/bebop-client';

// Same types, better implementation
const config: BebopConfig = {
  baseUrl: 'https://analytics.com',
  bearerToken: 'token'
};

const client: BebopClient = Bebop(config);
```

## Troubleshooting

### Node.js Version Issues

**Error:** `fetch is not defined`
**Solution:** Upgrade to Node.js 18.0.0+

```bash
# Check version
node --version

# Update Node.js
nvm install 18
nvm use 18
```

### Import Issues

**Error:** Module resolution problems
**Solution:** Ensure you're using ES modules:

```json
{
  "type": "module"
}
```

### Performance Differences

If you notice performance differences:

1. **Batching:** Enable batching for high-volume scenarios
2. **Concurrency:** Adjust concurrency based on your needs
3. **Error handling:** The new implementation handles errors more gracefully

## Benefits Summary

✅ **Zero Dependencies:** No external packages to maintain or update
✅ **Unified Codebase:** Same implementation across all environments  
✅ **Better Performance:** Native fetch is faster than third-party HTTP clients
✅ **Smaller Bundle:** 98% smaller Node.js bundle size
✅ **Enhanced Security:** Fewer dependencies = smaller attack surface
✅ **Future-Proof:** Built on web standards (fetch API)
✅ **Same API:** No breaking changes to your existing code

## Support

If you encounter any issues during migration:

1. Check Node.js version (must be 18.0.0+)
2. Verify package version (`@gokceno/bebop-client@^1.0.0`)
3. Test with simple examples first
4. Enable `output: true` for debugging

The migration should be seamless for most use cases, with significant performance and bundle size improvements!