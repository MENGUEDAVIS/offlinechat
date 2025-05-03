import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Redirect to home if already logged in
  if (user && !isLoading) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <div className="bg-primary p-6 rounded-t-lg">
          <h1 className="text-xl font-bold text-white text-center">SchoolChat</h1>
          <p className="text-white/80 text-center">Application de messagerie de l'école</p>
        </div>
        
        <div className="p-6">
          <div className="tabs flex border-b border-gray-200 mb-4">
            <button 
              onClick={() => setActiveTab("login")}
              className={`py-2 px-4 font-medium ${
                activeTab === "login" 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-gray-500"
              }`}
            >
              Connexion
            </button>
            <button 
              onClick={() => setActiveTab("register")}
              className={`py-2 px-4 font-medium ${
                activeTab === "register" 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-gray-500"
              }`}
            >
              Inscription
            </button>
          </div>

          {activeTab === "login" ? <LoginForm /> : <RegisterForm />}
          
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 bg-accent rounded-full"></span>
                <p>Connexion locale active</p>
              </div>
              <p className="mt-2">Version 1.0.0 (PWA)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
