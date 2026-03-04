"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("spark_token");
    if (token) {
      window.location.href = "/admin/dashboard";
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    console.log("Login attempt started...", { username });

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      console.log("Response status:", res.status);

      const data = await res.json();
      console.log("Response data:", data);

      if (res.ok && data.success) {
        console.log("Login successful, saving token...");
        localStorage.setItem("spark_token", data.token);
        console.log("Token saved, redirecting...");
        window.location.href = "/admin/dashboard";
      } else {
        console.log("Login failed:", data.message);
        setError(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-white">Spark Admin</h1>
        {error && <p className="mb-4 text-center text-red-500">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded border border-gray-700 bg-gray-900 p-3 text-white focus:border-blue-500 focus:outline-none"
              required
              suppressHydrationWarning
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-700 bg-gray-900 p-3 pr-12 text-white focus:border-blue-500 focus:outline-none"
              required
              suppressHydrationWarning
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
              suppressHydrationWarning
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full rounded bg-blue-600 p-3 font-bold text-white transition hover:bg-blue-700"
            suppressHydrationWarning
          >
            Login to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
