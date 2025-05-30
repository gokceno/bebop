# Bebop Client Usage Examples

> **Universal Architecture**: All examples use the same unified implementation with native fetch and shared queue system across browser and Node.js environments.

## 🚀 Non-Blocking Usage Examples

### React Component with Non-Blocking Analytics

```jsx
import React from 'react';
import { Bebop } from '@gokceno/bebop-client';

// Initialize once at app level - same API everywhere!
const analytics = Bebop({
  baseUrl: 'https://analytics.example.com',
  bearerToken: process.env.NEXT_PUBLIC_BEBOP_TOKEN,
  batching: {
    enabled: true,
    maxBatchSize: 10,
    flushInterval: 2000
  }
  // ✨ Uses native fetch + shared queue (zero dependencies)
});

function LoginButton() {
  const handleClick = () => {
    // ✅ Non-blocking - user sees instant response
    analytics.sendAsync('button_clicked', {
      buttonType: 'login',
      page: window.location.pathname,
      timestamp: Date.now()
    });
    
    // Continue with actual login logic
    window.location.href = '/login';
  };

  return (
    <button onClick={handleClick}>
      Login
    </button>
  );
}
```

### Next.js Page with Multiple Events

```jsx
import { useEffect } from 'react';
import { Bebop } from '@gokceno/bebop-client';

const client = Bebop({
  baseUrl: 'https://analytics.example.com',
  bearerToken: process.env.NEXT_PUBLIC_BEBOP_TOKEN,
  batching: { enabled: true }
  // ✨ Same implementation as Node.js version
});

export default function ProductPage({ product }) {
  useEffect(() => {
    // 🚀 Track page view immediately without blocking render
    client.sendAsync('page_view', {
      page: 'product',
      productId: product.id,
      category: product.category
    });

    // 📦 Track multiple user journey events as batch
    const trackUserJourney = () => {
      client.batch([
        { eventName: 'product_viewed', eventParams: { productId: product.id } },
        { eventName: 'category_browsed', eventParams: { category: product.category } },
        { eventName: 'price_viewed', eventParams: { price: product.price } }
      ]);
    };

    const timer = setTimeout(trackUserJourney, 3000);
    return () => clearTimeout(timer);
  }, [product]);

  const handleAddToCart = () => {
    // ✅ Non-blocking cart tracking
    client.sendAsync('add_to_cart', {
      productId: product.id,
      price: product.price,
      quantity: 1
    });
    
    // Continue with cart logic immediately
    addToCart(product);
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <button onClick={handleAddToCart}>
        Add to Cart
      </button>
    </div>
  );
}
```

### High-Performance Event Tracking Hook

```jsx
import { useCallback, useEffect } from 'react';
import { Bebop } from '@gokceno/bebop-client';

const useAnalytics = () => {
  const client = Bebop({
    baseUrl: process.env.NEXT_PUBLIC_BEBOP_URL,
    bearerToken: process.env.NEXT_PUBLIC_BEBOP_TOKEN,
    batching: {
      enabled: true,
      maxBatchSize: 15,
      flushInterval: 1500
    },
    output: process.env.NODE_ENV === 'development'
  });

  // 🚀 Non-blocking track function
  const track = useCallback((eventName, params = {}) => {
    client.sendAsync(eventName, {
      ...params,
      sessionId: sessionStorage.getItem('sessionId'),
      timestamp: Date.now(),
      url: window.location.href
    });
  }, []);

  // 📦 Batch multiple related events
  const trackUserFlow = useCallback((events) => {
    const enrichedEvents = events.map(event => ({
      ...event,
      eventParams: {
        ...event.eventParams,
        sessionId: sessionStorage.getItem('sessionId'),
        timestamp: Date.now()
      }
    }));
    client.batch(enrichedEvents);
  }, []);

  // ⏳ Flush on page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      await client.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return { track, trackUserFlow, flush: client.flush };
};

// Usage in component
function SearchComponent() {
  const { track, trackUserFlow } = useAnalytics();

  const handleSearch = (query) => {
    // ✅ Instant UI response, analytics tracked in background
    track('search_performed', { query, resultsCount: results.length });
    performSearch(query);
  };

  const handleFilterChange = (filters) => {
    // 📦 Track related events together
    trackUserFlow([
      { eventName: 'filter_applied', eventParams: { filters } },
      { eventName: 'results_filtered', eventParams: { count: newResults.length } },
      { eventName: 'ui_interaction', eventParams: { type: 'filter' } }
    ]);
  };

  return <SearchUI onSearch={handleSearch} onFilterChange={handleFilterChange} />;
}
```

## 🖥️ Node.js Server Examples

### Express.js Middleware

```javascript
import express from 'express';
import { Bebop } from '@gokceno/bebop-client';

const app = express();

// High-performance server analytics
const analytics = Bebop({
  baseUrl: 'https://internal-analytics.company.com',
  jwt: process.env.BEBOP_JWT,
  concurrency: 20,
  batching: {
    enabled: true,
    maxBatchSize: 50,
    flushInterval: 500
  },
  output: process.env.NODE_ENV !== 'production'
  // ✨ Native fetch + shared queue = better performance than got/p-queue
});

// 🚀 Non-blocking request tracking middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Track request start immediately
  analytics.sendAsync('request_started', {
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent'),
    ip: req.ip
  });

  res.on('finish', () => {
    // 📦 Batch request completion data
    analytics.batch([
      {
        eventName: 'request_completed',
        eventParams: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: Date.now() - startTime
        }
      },
      {
        eventName: 'performance_metric',
        eventParams: {
          type: 'response_time',
          value: Date.now() - startTime,
          endpoint: req.path
        }
      }
    ]);
  });

  next();
});

// ⏳ Graceful shutdown with flush
process.on('SIGTERM', async () => {
  console.log('Flushing analytics before shutdown...');
  await analytics.flush();
  process.exit(0);
});
```

### Background Job Processing

```javascript
import { Bebop } from '@gokceno/bebop-client';

const analytics = Bebop({
  baseUrl: process.env.ANALYTICS_URL,
  jwt: process.env.JWT_TOKEN,
  concurrency: 10,
  batching: {
    enabled: true,
    maxBatchSize: 100,
    flushInterval: 1000
  }
  // ✨ Zero dependencies, native fetch everywhere
});

class JobProcessor {
  async processJob(job) {
    const startTime = Date.now();
    
    try {
      // 🚀 Non-blocking job start tracking
      analytics.sendAsync('job_started', {
        jobId: job.id,
        jobType: job.type,
        priority: job.priority
      });

      const result = await this.executeJob(job);

      // 📦 Batch success metrics
      analytics.batch([
        {
          eventName: 'job_completed',
          eventParams: {
            jobId: job.id,
            duration: Date.now() - startTime,
            status: 'success'
          }
        },
        {
          eventName: 'performance_metric',
          eventParams: {
            type: 'job_duration',
            jobType: job.type,
            duration: Date.now() - startTime
          }
        }
      ]);

      return result;
    } catch (error) {
      // ✅ Non-blocking error tracking
      analytics.sendAsync('job_failed', {
        jobId: job.id,
        error: error.message,
        duration: Date.now() - startTime
      });
      
      throw error;
    }
  }
}
```

### Real-time Data Pipeline

```javascript
import { Bebop } from '@gokceno/bebop-client';

const analytics = Bebop({
  baseUrl: process.env.ANALYTICS_URL,
  bearerToken: process.env.BEARER_TOKEN,
  concurrency: 50,
  batching: {
    enabled: true,
    maxBatchSize: 200,
    flushInterval: 100 // Very fast for real-time
  }
  // ✨ Unified implementation = same performance characteristics everywhere
});

class DataPipeline {
  constructor() {
    this.eventBuffer = [];
    this.processInterval = setInterval(() => this.processBatch(), 5000);
  }

  // 🚀 High-throughput event ingestion
  ingestEvent(event) {
    // Add to buffer immediately
    this.eventBuffer.push(event);
    
    // Track ingestion without blocking
    analytics.sendAsync('event_ingested', {
      eventType: event.type,
      size: JSON.stringify(event).length,
      bufferSize: this.eventBuffer.length
    });

    // Process if buffer is large
    if (this.eventBuffer.length >= 1000) {
      this.processBatch();
    }
  }

  processBatch() {
    if (this.eventBuffer.length === 0) return;

    const batch = this.eventBuffer.splice(0);
    
    // 📦 Batch processing metrics
    analytics.batch([
      {
        eventName: 'batch_processed',
        eventParams: {
          batchSize: batch.length,
          processedAt: Date.now()
        }
      },
      {
        eventName: 'pipeline_metrics',
        eventParams: {
          throughput: batch.length,
          bufferSize: this.eventBuffer.length
        }
      }
    ]);

    // Process batch asynchronously
    this.processBatchAsync(batch);
  }

  async shutdown() {
    clearInterval(this.processInterval);
    
    // ⏳ Ensure all analytics are sent before shutdown
    await analytics.flush();
  }
}
```

## ⚡ Performance Comparison

```javascript
// ❌ BLOCKING - Slows down user interactions
const slowClient = Bebop({ baseUrl: 'https://analytics.com' });

button.addEventListener('click', async () => {
  await slowClient.send('click', { button: 'submit' }); // 🐌 User waits
  submitForm(); // Delayed until analytics completes
});

// ✅ NON-BLOCKING - Instant user experience
const fastClient = Bebop({
  baseUrl: 'https://analytics.com',
  batching: { enabled: true }
  // ✨ Same unified implementation, zero dependencies
});

button.addEventListener('click', () => {
  fastClient.sendAsync('click', { button: 'submit' }); // 🚀 Instant
  submitForm(); // Executes immediately
});
```

## 🏗️ Unified Architecture Benefits

```javascript
// ✨ SAME CODE EVERYWHERE - Browser and Node.js
const createClient = (env) => Bebop({
  baseUrl: 'https://analytics.com',
  bearerToken: env === 'browser' ? window.BEBOP_TOKEN : process.env.BEBOP_TOKEN,
  batching: { enabled: true },
  concurrency: env === 'browser' ? 3 : 10
  // Uses native fetch + shared queue implementation everywhere!
});

// Works identically in:
const browserClient = createClient('browser');  // Browser: fetch + SimpleQueue
const serverClient = createClient('server');    // Node.js: fetch + SimpleQueue
```

## 🔄 Advanced Batching Patterns

```javascript
const client = Bebop({
  baseUrl: 'https://analytics.com',
  bearerToken: 'token',
  batching: {
    enabled: true,
    maxBatchSize: 20,
    flushInterval: 2000
  }
});

// Pattern 1: Page session tracking
const trackPageSession = () => {
  const sessionEvents = [
    { eventName: 'session_start', eventParams: { timestamp: Date.now() } },
    { eventName: 'page_load', eventParams: { url: location.href } },
    { eventName: 'user_agent', eventParams: { ua: navigator.userAgent } }
  ];
  
  client.batch(sessionEvents);
};

// Pattern 2: Form interaction tracking
const trackFormInteraction = (formData) => {
  const formEvents = Object.keys(formData).map(field => ({
    eventName: 'form_field_filled',
    eventParams: { field, hasValue: !!formData[field] }
  }));
  
  client.batch([
    ...formEvents,
    { eventName: 'form_completion', eventParams: { totalFields: formEvents.length } }
  ]);
};

// Pattern 3: E-commerce funnel
const trackPurchaseFunnel = (user, product, payment) => {
  client.batch([
    { eventName: 'product_viewed', eventParams: { productId: product.id } },
    { eventName: 'add_to_cart', eventParams: { productId: product.id, price: product.price } },
    { eventName: 'checkout_started', eventParams: { cartValue: payment.amount } },
    { eventName: 'payment_completed', eventParams: { userId: user.id, amount: payment.amount } }
  ]);
};
```