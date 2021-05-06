import React from 'react';
import { render } from 'react-dom';
import CowinNotification from './CowinNotification';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
  .then(function(registration) {
    registration.addEventListener('updatefound', function() {
      var installingWorker = registration.installing;
      console.log('A new service worker is being installed:',
        installingWorker);
    });
  })
  .catch(function(error) {
    console.log('Service worker registration failed:', error);
  });
} else {
  console.log('Service workers are not supported.');
}

render(<CowinNotification />, document.getElementById('root'));
