"use client";

import { OctagonX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Show, SignInButton, SignOutButton } from "@clerk/nextjs";
import { Button } from "../ui/button";

interface HeaderProps {
  popUpActive: boolean;
  setPdfView: (val: boolean) => void;
}

export default function Header({ popUpActive, setPdfView }: HeaderProps) {
  return (
    <header className="flex justify-between items-center mb-12">
      {popUpActive && (
        <Alert className="w-80 absolute top-24 left-1/2 transform -translate-x-1/2 z-50 bg-highlight border-highlight text-highlight-foreground">
          <AlertTitle className="flex flex-row gap-2 text-xl">
            {" "}
            <OctagonX /> Alert!
          </AlertTitle>
          <AlertDescription className="flex flex-row justify-between text-lg">
            Sign In To Use Features
            <SignInButton>
              <Button>Sign In</Button>
            </SignInButton>
          </AlertDescription>
        </Alert>
      )}
      <h1
        onClick={() => {
          setPdfView(false);
        }}
        className="font-serif text-4xl font-normal sm:text-5xl"
      >
        AI Book Reader
      </h1>
      <div className="flex items-center space-x-2">
        <Show when="signed-in">
          <SignOutButton>
            <Button className="rounded-full px-5">Sign Out</Button>
          </SignOutButton>
        </Show>
        <Show when="signed-out">
          <SignInButton>
            <Button className="rounded-full px-5">Sign In</Button>
          </SignInButton>
        </Show>
      </div>
    </header>
  );
}
