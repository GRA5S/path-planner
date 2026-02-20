const cacheName = 'vex-path-planner-v1.1';
const cacheUrls = [
    '/path/',
    '/path/index.html',
    '/path/styles.css',
    '/path/manifest.json',
    '/path/favicon.png',
    '/path/js/depend/p5.min.js',
    '/path/js/editor.js',
    '/path/js/generator.js',
    '/path/js/simulator.js',
    '/path/js/main.js',
    '/path/js/save.js',
    '/path/js/sw.js',
    '/path/images/V5RC-PushBack-H2H-2000x2000.png',
    '/path/images/V5RC-PushBack-Skills-2000x2000.png'
];

// Installing Service Worker
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    console.log('[Service Worker] Caching all content');

    const stack = [];
    cacheUrls.forEach(file => stack.push(
        cache.add(file).catch(_=>console.error(`can't load ${file} to cache`))
    ));
    return Promise.all(stack);
    //await cache.addAll(cacheUrls);
  })());
});

// Fetching content using Service Worker
self.addEventListener('fetch', (e) => {
    // Cache http and https only, skip unsupported chrome-extension:// and file://...
    if (!(
       e.request.url.startsWith('http:') || e.request.url.startsWith('https:')
    )) {
        return; 
    }

    e.respondWith((async () => { // fetch network first then cache
        console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
        try {
            // Try to fetch from network first
            const response = await fetch(e.request);
            
            // If successful, clone the response and store it in the cache
            const cache = await caches.open(cacheName);
            console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
            cache.put(e.request, response.clone());
            
            return response;
        } catch (error) {
            console.log(`[Service Worker] Network request failed, falling back to cache for: ${e.request.url}`);
            
            // If network request fails, try to get the resource from cache
            const cachedResponse = await caches.match(e.request);
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // If not in cache either, throw the error
            throw error;
        }
    })());

  // e.respondWith((async () => {
  //   const r = await caches.match(e.request);
  //   console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
  //   if (r) return r;
  //   const response = await fetch(e.request);
  //   const cache = await caches.open(cacheName);
  //   console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
  //   cache.put(e.request, response.clone());
  //   return response;
  // })());
});