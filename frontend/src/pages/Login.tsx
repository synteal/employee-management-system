import React, { useActionState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { KeyRound, User as UserIcon } from "lucide-react";
import api, { getApiErrorMessage } from "../api/axios";
import { jwtDecode } from "jwt-decode";
import type { UserRole, DecodedToken } from "../context/AuthContext";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface LoginState {
  errors: { user?: string; password?: string; backend?: string };
}

const Login: React.FC = () => {
  const { login } = useAuth();

  const loginAction = async (
    _prevState: LoginState,
    formData: FormData,
  ): Promise<LoginState> => {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const validationErrors: { user?: string; password?: string } = {};
    if (!username) validationErrors.user = "username is required";
    if (!password) validationErrors.password = "password is required";

    if (Object.keys(validationErrors).length > 0) {
      return { errors: validationErrors };
    }

    try {
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      // FastAPI OAuth2PasswordRequestForm expects x-www-form-urlencoded
      const response = await api.post<LoginResponse>("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const { access_token } = response.data;

      // Decode JWT to get user metadata (role and username) with type safety
      const decoded = jwtDecode<DecodedToken>(access_token);

      // Validate role at runtime
      const role: UserRole =
        decoded.role === "admin" || decoded.role === "user"
          ? (decoded.role as UserRole)
          : "user";

      const usernameFromToken = decoded.sub;

      try {
        login(access_token, { username: usernameFromToken, role });
      } catch (err) {
        // Fallback for tests or if AuthProvider is missing
        console.warn("AuthContext login failed:", err);
      }

      return { errors: {} };
    } catch (err: unknown) {
      console.error("Login error:", err);
      const backendError = getApiErrorMessage(err);
      return { errors: { backend: backendError } };
    }
  };

  const [state, formAction, isPending] = useActionState(loginAction, {
    errors: {},
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back to EMS
          </p>
        </div>
        <form className="mt-8 space-y-6" action={formAction}>
          <div className="shadow-sm -space-y-px rounded-md">
            <div className="relative">
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="username"
                className="appearance-none rounded-none w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="password"
                className="appearance-none rounded-none w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>
          </div>

          {(state.errors.user ||
            state.errors.password ||
            state.errors.backend) && (
            <div className="bg-red-50 p-3 rounded-md">
              {state.errors.user && (
                <div className="text-sm text-red-600">{state.errors.user}</div>
              )}
              {state.errors.password && (
                <div className="text-sm text-red-600">
                  {state.errors.password}
                </div>
              )}
              {state.errors.backend && (
                <div className="text-sm text-red-600">
                  {state.errors.backend}
                </div>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isPending
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
            >
              {isPending ? "Signing in..." : "Login"}
            </button>
          </div>

          <div className="text-center text-sm">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
