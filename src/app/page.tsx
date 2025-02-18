"use client";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, SignOutButton } from "@clerk/nextjs";

export default function Home() {
  return (<div>
    <h1>PlayAI Book Reader</h1>
    <SignedIn>
      <SignOutButton>
        <Button>Sign Out</Button>
      </SignOutButton>
    </SignedIn>
    <SignedOut>
      <SignInButton>
        <Button>Sign In</Button>
      </SignInButton>
    </SignedOut>
  </div>);
}
