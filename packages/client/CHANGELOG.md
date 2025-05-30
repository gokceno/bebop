# @gokceno/bebop-client

## 1.1.0

### Major Changes

- **Simplified Architecture**: Removed batching complexity for a cleaner, easier-to-use API
- **Zero Dependencies**: Native fetch everywhere, no external HTTP clients (got, p-queue removed)
- **Unified Implementation**: Same code shared between browser and Node.js (95% code reuse)
- **Smaller Bundle**: 39% smaller browser bundle (5.23KB → 3.19KB), 99% smaller Node.js bundle (288KB → 3.19KB)
- **Native Fetch**: Uses web standard fetch API in both environments (requires Node.js 18+)

### Breaking Changes

- Removed `batch()` method - use individual `sendAsync()` calls instead
- Removed `batching` configuration option
- Requires Node.js 18.0.0+ for native fetch support

### API Changes

- ✅ `send()` - unchanged (blocking)
- ✅ `sendAsync()` - unchanged (non-blocking, fire-and-forget)
- ✅ `flush()` - unchanged (wait for completion)
- ❌ `batch()` - removed (use multiple `sendAsync()` calls)

## 0.3.0

### Minor Changes

- Added non-blocking `sendAsync()` method for fire-and-forget analytics
- Added `batch()` method for sending multiple events efficiently
- Added automatic event batching with configurable settings
- Added `flush()` method to wait for pending events

## 0.2.0

### Minor Changes

- Added browser compatibility with environment-specific builds
- Fixed URL validation logic
- Added conditional exports for proper module resolution

## 0.1.1

### Patch Changes

- Export types.

## 0.1.0

### Minor Changes

- 7f957f6: Added bebop-client.
