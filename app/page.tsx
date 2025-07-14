import { LoginForm } from "@/components/auth/login-form";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "RD Realty Group - Login",
  description: "Login to your RD Realty Group account to access the property management system.",
}



  export default function Home() {
    return (
      <main className="flex h-full flex-col items-center justify-center">
        <div className="mt-8">
            <LoginForm />
          </div>
      </main>
    )
  }
