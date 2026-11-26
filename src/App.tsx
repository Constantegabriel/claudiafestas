import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CartProvider } from '@/cart/CartContext';
import { AdminPage } from '@/pages/AdminPage';
import { StorePage } from '@/pages/StorePage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <CartProvider>
              <StorePage />
            </CartProvider>
          }
        />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
