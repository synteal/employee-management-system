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
      const apiBaseUrl = import.meta.env.VITE_API_URL || "";
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      const response = await axios.post(`${apiBaseUrl}/auth/login`, params);
      const { access_token, role } = response.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("role", role);
      navigate("/");
    } catch (err: unknown) {
      console.error("Login error:", err);
      let backendError: string = "An error occurred";
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          // If it's an array of error objects, join their messages
          backendError = detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ");
        } else if (typeof detail === "object") {
          // If it's an object, try to get a message or stringify
          backendError = detail.msg || JSON.stringify(detail);
        } else {
          backendError = String(detail);
        }
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
