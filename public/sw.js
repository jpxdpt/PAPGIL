// Service Worker para notificações no telemóvel
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  event.waitUntil(self.clients.claim());
});

// Escutar mensagens do dashboard
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'NOTIFICATION') {
    const { title, options } = event.data;
    
    event.waitUntil(
      self.registration.showNotification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        ...options
      })
    );
  }
});

// Escutar cliques nas notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event.notification.title);
  
  event.notification.close();
  
  // Focar na janela do dashboard
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      } else {
        return self.clients.openWindow('/');
      }
    })
  );
});
