import { Routes, Route, Navigate } from "react-router-dom";
import React from "react";
const Auth = React.lazy(() => import('@/layouts/auth'));
const Admin = React.lazy(() => import('@/layouts/admin'));
const SubAdmin = React.lazy(() => import('@/layouts/subAdmin'));
const User = React.lazy(() => import('@/layouts/user'));

const Customer = React.lazy(() => import('@/layouts/customer'));

function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<Admin />} />
      <Route path="/user/*" element={<User />} />
      <Route path="/subAdmin/*" element={<SubAdmin />} />
      <Route path="/customer/*" element={<Customer />} />
      <Route path="/auth/*" element={<Auth />} />
      <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
    </Routes>
  );
}

export default App;
