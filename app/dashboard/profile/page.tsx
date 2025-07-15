import { ArrowLeft, Wrench } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "RD Realty Group - Profile",
  description: "Manage your profile and account settings",
}

/**
 * A placeholder component for the user profile page.
 * It displays a centered "under development" message using a shadcn/ui Card.
 */
export default function ProfilePage() {
  return (
    // Main container with a gradient background, centering the content
    <div className="flex h-full min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-950 p-4">
      <Card className="w-full max-w-lg text-center shadow-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm transform hover:-translate-y-1 transition-transform duration-300 rounded-xl">
        <CardHeader className="p-8 md:p-12">
          {/* Animated Icon container */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 border-4 border-white shadow-inner">
            <Wrench className="h-10 w-10 text-blue-600 animate-spin" style={{ animationDuration: '3s' }} aria-hidden="true" />
          </div>
          <CardTitle className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
            Profile Page Coming Soon
          </CardTitle>
          <CardDescription className="mt-2 text-lg text-slate-600">
            This feature is currently under construction.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-12">
          <p className="text-base text-slate-500">
            We&apos;re working hard to bring you an amazing profile experience with more features and customization. Please check back later!
          </p>
        </CardContent>
        <CardFooter className="flex justify-center p-8 pt-6">
          <Button asChild>
            <Link href="/dashboard" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
