import React, { useActionState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, KeyRound } from "lucide-react";
import api, { getApiErrorMessage } from "../api/axios";

interface RegisterState {
  errors: {
    name?: string;
    email?: string;
    password?: string;
    backend?: string;
  };
  success?: boolean;
}

const Register: React.FC = () => {
  const navigate = useNavigate();

  const registerAction = async (
    _prevState: RegisterState,
    formData: FormData,
  ): Promise<RegisterState> => {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const validationErrors: RegisterState["errors"] = {};
    if (!name) validationErrors.name = "Name/Username is required";
    if (!email) validationErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      validationErrors.email = "Email is invalid";
    if (!password) validationErrors.password = "Password is required";
    else if (password.length < 8)
      validationErrors.password = "Password must be at least 8 characters";

    if (Object.keys(validationErrors).length > 0) {
      return { errors: validationErrors };
    }

    try {
      await api.post("/auth/register", {
        name: name,
        username: name,
        email: email,
        password: password,
      });

      return { errors: {}, success: true };
    } catch (err: unknown) {
      console.error("Registration error:", err);
      const backendError = getApiErrorMessage(err);
      return { errors: { backend: backendError } };
    }
  };

  const [state, formAction, isPending] = useActionState(registerAction, {
    errors: {},
  });

  // Use useEffect to navigate on success as actions should return state
  React.useEffect(() => {
    if (state.success) {
      navigate("/login");
    }
  }, [state.success, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join EMS today
          </p>
        </div>
        <form className="mt-8 space-y-6" action={formAction}>
          <div className="shadow-sm -space-y-px rounded-md">
            <div className="relative">
              <label htmlFor="name" className="sr-only">
                Name / Username
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Name / Username"
                className="appearance-none rounded-none w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>
            <div className="relative">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                className="appearance-none rounded-none w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                placeholder="Password"
                className="appearance-none rounded-none w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>
          </div>

          {(state.errors.name ||
            state.errors.email ||
            state.errors.password ||
            state.errors.backend) && (
            <div className="bg-red-50 p-3 rounded-md">
              {state.errors.name && (
                <div className="text-sm text-red-600">{state.errors.name}</div>
              )}
              {state.errors.email && (
                <div className="text-sm text-red-600">{state.errors.email}</div>
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
              {isPending ? "Creating account..." : "Register"}
            </button>
          </div>

          <div className="text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
