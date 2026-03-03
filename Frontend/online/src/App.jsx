import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import ComplaintForm from "./pages/ComplaintForm";
import MyComplaints from "./pages/MyComplaints";
import ManageComplaints from "./pages/ManageComplaints";
import Forgotpassword from "./pages/Forgotpassword";
import Resetpassword from "./pages/Resetpassword";
import Home from "./pages/Home";
import Dashboard from './pages/Dashboard';
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeRegister from "./pages/EmployeeRegister";

// 1. Import the ThemeProvider
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    // 2. Wrap EVERYTHING inside ThemeProvider
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgotpassword" element={<Forgotpassword />} />
        <Route path="/Resetpassword/:token" element={<Resetpassword />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/complaint" element={<ComplaintForm />} />
        <Route path="/ManageComplaints" element={<ManageComplaints />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/employee/register/:token" element={<EmployeeRegister />} />

        <Route path="/user/submit" element={<ComplaintForm />} />
        <Route path="/user/complaints" element={<MyComplaints />} />
        <Route path="/pages/AdminDashboard" element={<ManageComplaints />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;