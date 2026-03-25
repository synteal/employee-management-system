import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; backend?: string }>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: { email?: string; password?: string } = {};
    if (!email) validationErrors.email = "email is required";
    if (!password) validationErrors.password = "password is required";
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await axios.post("/api/login", { email, password });
      const { access_token, role } = response.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("role", role);
      navigate("/");
    } catch (err: unknown) {
      let backendError = "An error occurred";
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        backendError = err.response.data.detail;
      }
      setErrors({ backend: backendError });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        {errors.email && <div>{errors.email}</div>}
      </div>
      <div>
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {errors.password && <div>{errors.password}</div>}
      </div>
      {errors.backend && <div>{errors.backend}</div>}
      <button type="submit" disabled={loading}>
        Login
      </button>
    </form>
  );
};

export default Login;
