"use client";

import { login, signup } from "./actions";
import Image from "next/image";
import { LoadingButton } from "../components/LoadingButton";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-forest-deep mb-6">
            Wild Trails
          </h1>
          <Image
            src="/wolf_footprint.svg"
            alt="Wolf footprint"
            width={50}
            height={50}
            className="opacity-20 mx-auto mb-6"
          />
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password:
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-3 pt-4">
            <LoadingButton
              formAction={login}
              className="w-full px-6 py-3 bg-forest-pine text-forest-mist rounded-lg hover:bg-forest-moss transition-colors"
            >
              Log in
            </LoadingButton>
            <LoadingButton
              formAction={signup}
              className="w-full px-6 py-3 bg-forest-bark text-forest-mist rounded-lg hover:bg-forest-bark/80 transition-colors"
            >
              Sign up
            </LoadingButton>
          </div>
        </form>
      </div>
    </main>
  );
}
