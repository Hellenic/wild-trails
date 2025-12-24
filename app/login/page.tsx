"use client";

import { login, signup } from "./actions";
import { Button } from "../components/ui/Button";
import { GlassPanel } from "../components/ui/GlassPanel";
import { Icon } from "../components/ui/Icon";
import { Input } from "../components/ui/Input";

export default function LoginPage() {

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 lg:p-8 dark:bg-background-dark bg-background-light">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop')",
          }}
        />
        {/* Dark Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-background-dark/70 to-black/80" />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 w-full max-w-[1200px] h-full flex flex-col lg:flex-row gap-8 lg:gap-16 items-center justify-center lg:justify-between">
        {/* Left Side: Hero Text (Desktop visible) */}
        <div className="hidden lg:flex flex-col flex-1 max-w-lg gap-6 text-left animate-fade-in-up">
          <div className="inline-flex items-center gap-2 text-primary">
            <Icon name="terrain" size="lg" />
            <span className="text-xl font-bold tracking-widest uppercase">
              Wild Trails
            </span>
          </div>
          <h1 className="text-6xl font-black leading-tight tracking-tight text-white drop-shadow-lg">
            Master the outdoors. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
              Create your path.
            </span>
          </h1>
          <p className="text-lg text-gray-300 font-medium leading-relaxed max-w-md">
            Join the community of explorers. Discover hidden trails, track your
            adventures, and compete with orienteering enthusiasts worldwide.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-background-dark bg-primary/20 flex items-center justify-center">
                <Icon name="person" className="text-primary" />
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-background-dark bg-primary/20 flex items-center justify-center">
                <Icon name="person" className="text-primary" />
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-background-dark bg-primary/20 flex items-center justify-center">
                <Icon name="person" className="text-primary" />
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-background-dark bg-primary flex items-center justify-center text-background-dark font-bold text-xs">
                +2k
              </div>
            </div>
            <span className="text-sm text-gray-400">Active explorers today</span>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="w-full max-w-[480px] flex-shrink-0">
          <GlassPanel className="p-8 sm:p-10 flex flex-col gap-6 w-full">
            {/* Mobile Logo (Only visible on small screens) */}
            <div className="flex lg:hidden flex-col items-center gap-2 mb-2 text-center">
              <Icon name="terrain" size="xl" className="text-primary mb-2" />
              <h1 className="text-3xl font-black text-white tracking-tight">
                Wild Trails
              </h1>
              <p className="text-gray-400 text-sm">
                Master the outdoors. Create your path.
              </p>
            </div>

            {/* Welcome Header (Desktop) */}
            <div className="hidden lg:block mb-2">
              <h2 className="text-2xl font-bold text-white">Get Started</h2>
              <p className="text-gray-400 text-sm mt-1">
                Join the adventure today.
              </p>
            </div>

            {/* Auth Form */}
            <form className="flex flex-col gap-4">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                label="Email"
                required
                data-testid="email-input"
              />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                label="Password"
                required
                data-testid="password-input"
              />

              {/* Primary Actions */}
              <div className="flex flex-col gap-3 mt-2">
                <Button
                  variant="primary"
                  fullWidth
                  formAction={signup}
                  data-testid="signup-button"
                >
                  Sign Up
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  formAction={login}
                  data-testid="login-button"
                >
                  Log In
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-700" />
              <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                Or continue with
              </span>
              <div className="flex-grow border-t border-gray-700" />
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                aria-label="Continue with Apple"
                className="flex items-center justify-center h-12 rounded-lg bg-surface-dark-elevated hover:bg-[#354a35] transition-colors border border-white/5 text-white group"
              >
                <Icon
                  name="album"
                  className="group-hover:scale-110 transition-transform"
                />
              </button>
              <button
                aria-label="Continue with Google"
                className="flex items-center justify-center h-12 rounded-lg bg-surface-dark-elevated hover:bg-[#354a35] transition-colors border border-white/5 text-white group"
              >
                <Icon
                  name="language"
                  className="group-hover:scale-110 transition-transform"
                />
              </button>
              <button
                aria-label="Continue with Facebook"
                className="flex items-center justify-center h-12 rounded-lg bg-surface-dark-elevated hover:bg-[#354a35] transition-colors border border-white/5 text-white group"
              >
                <Icon
                  name="public"
                  className="group-hover:scale-110 transition-transform"
                />
              </button>
            </div>

            {/* Footer Links */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                By continuing, you agree to our{" "}
                <a
                  className="text-primary/80 hover:text-primary hover:underline transition-colors"
                  href="#"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  className="text-primary/80 hover:text-primary hover:underline transition-colors"
                  href="#"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Sticky Footer (Optional for Desktop) */}
      <div className="absolute bottom-4 left-0 right-0 z-10 hidden lg:flex justify-center pointer-events-none">
        <p className="text-[#9db99d] text-xs font-normal opacity-60">
          © 2024 Wild Trails. All rights reserved.
        </p>
      </div>
    </main>
  );
}
