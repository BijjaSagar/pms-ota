import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { BookingProvider } from './lib/context/BookingProvider.jsx';
import { CatalogueProvider } from './lib/context/CatalogueProvider.jsx';
import { WishlistProvider } from './lib/context/WishlistProvider.jsx';
import { TripsProvider } from './lib/context/TripsProvider.jsx';
import { AuthProvider } from './lib/context/AuthProvider.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CatalogueProvider>
          <BookingProvider>
            <WishlistProvider>
              <TripsProvider>
                <App />
              </TripsProvider>
            </WishlistProvider>
          </BookingProvider>
        </CatalogueProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
