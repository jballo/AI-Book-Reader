"use client";

import { OctagonX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { SignedIn, SignedOut, SignInButton, SignOutButton } from "@clerk/nextjs";
import { Button } from "../ui/button";

interface HeaderProps {
    popUpActive: boolean;
    setPdfView: (val: boolean) => void;
}

export default function Header({ popUpActive, setPdfView }: HeaderProps) {
    return (
        <header className="flex justify-between items-center mb-12">
            {popUpActive && (
                   <Alert className="w-80 absolute top-24 left-1/2 transform -translate-x-1/2 z-50 bg-[#C1FF7A] border-black">
                    <AlertTitle className="flex flex-row gap-2 text-xl"> <OctagonX /> Alert!</AlertTitle>
                    <AlertDescription className="flex flex-row justify-between text-lg">
                            Sign In To Use Features
                        <SignInButton>
                            <Button>Sign In</Button>
                        </SignInButton>
                    </AlertDescription>
                </Alert>
            )}
            <h1 onClick={() => {
                setPdfView(false);
            }} className="text-5xl font-bold tracking-tight">PlayAI Book Reader</h1>
            <div className="flex items-center space-x-2">
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
            </div>
        </header>
    );
}