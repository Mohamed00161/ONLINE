import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const GoogleSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const userJson = searchParams.get("user");

    if (token && userJson) {
      try {
        // 1. Save the token
        localStorage.setItem("token", token);

        // 2. The user data is already stringified from the backend, 
        // so we can save it directly or parse it to verify.
        localStorage.setItem("user", userJson);

        // 3. Immediately send them to the dashboard
        navigate("/dashboard");
      } catch (error) {
        console.error("Authentication redirect failed", error);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Finalizing login...</p>
    </div>
  );
};

export default GoogleSuccess;