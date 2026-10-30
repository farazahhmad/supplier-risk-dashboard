import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SupplierDetail from './pages/SupplierDetail';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/suppliers/:id" element={<SupplierDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
