import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';

// Temporary Home Component 
function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <h1 className="text-5xl font-bold tracking-tight mb-4">Welcome to Orbit.</h1>
      <p className="text-lg text-gray-500 max-w-lg">
        The most advanced AI-powered eCommerce platform ever built. Let's start shopping.
      </p>
    </div>
  );
}

function App() {
  return (
    // We wrap the entire app in AuthProvider so every component knows if the user is logged in!
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
