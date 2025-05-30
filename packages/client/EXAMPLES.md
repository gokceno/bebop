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
  concurrency: 3 // Process up to 3 requests simultaneously
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
  concurrency: 2 // Limit concurrent requests
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

    // 🚀 Track user journey events individually
    const trackUserJourney = () => {
      client.sendAsync('product_viewed', { productId: product.id });
      client.sendAsync('category_browsed', { category: product.category });
      client.sendAsync('price_viewed', { price: product.price });
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
    concurrency: 5, // Higher concurrency for better performance
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

  // 🚀 Track multiple related events
  const trackUserFlow = useCallback((events) => {
    events.forEach(event => {
      client.sendAsync(event.eventName, {
        ...event.eventParams,
        sessionId: sessionStorage.getItem('sessionId'),
        timestamp: Date.now()
      }, event.eventTrace);
    });
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
    // 🚀 Track related events
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
  concurrency: 20, // High concurrency for server workloads
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
    // 🚀 Track request completion
    analytics.sendAsync('request_completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - startTime
    });
    
    analytics.sendAsync('performance_metric', {
      type: 'response_time',
      value: Date.now() - startTime,
      endpoint: req.path
    });
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
  concurrency: 10
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

      // 🚀 Track success metrics
      analytics.sendAsync('job_completed', {
        jobId: job.id,
        duration: Date.now() - startTime,
        status: 'success'
      });
      
      analytics.sendAsync('performance_metric', {
        type: 'job_duration',
        jobType: job.type,
        duration: Date.now() - startTime
      });

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
  concurrency: 50 // High concurrency for real-time processing
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
    
    // 🚀 Track processing metrics
    analytics.sendAsync('batch_processed', {
      batchSize: batch.length,
      processedAt: Date.now()
    });
    
    analytics.sendAsync('pipeline_metrics', {
      throughput: batch.length,
      bufferSize: this.eventBuffer.length
    });

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
  concurrency: 3 // Optimal for frontend
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
  concurrency: env === 'browser' ? 3 : 10
  // Uses native fetch + shared queue implementation everywhere!
});

// Works identically in:
const browserClient = createClient('browser');  // Browser: fetch + SimpleQueue
const serverClient = createClient('server');    // Node.js: fetch + SimpleQueue
```

## 🔄 Advanced Event Tracking Patterns

```javascript
const client = Bebop({
  baseUrl: 'https://analytics.com',
  bearerToken: 'token',
  concurrency: 5 // Handle multiple events efficiently
});

// Pattern 1: Page session tracking
const trackPageSession = () => {
  client.sendAsync('session_start', { timestamp: Date.now() });
  client.sendAsync('page_load', { url: location.href });
  client.sendAsync('user_agent', { ua: navigator.userAgent });
};

// Pattern 2: Form interaction tracking
const trackFormInteraction = (formData) => {
  // Track individual field interactions
  Object.keys(formData).forEach(field => {
    client.sendAsync('form_field_filled', { 
      field, 
      hasValue: !!formData[field] 
    });
  });
  
  // Track form completion
  client.sendAsync('form_completion', { 
    totalFields: Object.keys(formData).length 
  });
};

// Pattern 3: E-commerce funnel
const trackPurchaseFunnel = (user, product, payment) => {
  client.sendAsync('product_viewed', { productId: product.id });
  client.sendAsync('add_to_cart', { productId: product.id, price: product.price });
  client.sendAsync('checkout_started', { cartValue: payment.amount });
  client.sendAsync('payment_completed', { userId: user.id, amount: payment.amount });
};
```