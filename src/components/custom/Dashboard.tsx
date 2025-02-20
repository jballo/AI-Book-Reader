"use client";

import { SignedIn, SignedOut, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { Button } from "../ui/button";
import { useEffect } from "react";

interface UserProps {
    createUser: (
        userId: string,
        userEmail: string,
    ) => Promise<{success: boolean; response?: string; error?: string;}>;
    userExists: (
        userId: string,
    ) => Promise<{ success: boolean; response?: boolean; error?: string; }>;
}

interface DashboardProps {
    createUser: UserProps["createUser"];
    userExists: UserProps["userExists"];
}

export default function Dashboard({ createUser, userExists }: DashboardProps){
    const { user, isSignedIn } = useUser();


    useEffect(() => {

        const userSaved = async () => {
            if (user && isSignedIn) {
                
                const userExistResponse = await userExists(user.id);

                if (userExistResponse.success) {

                    if (!userExistResponse.response) {
                        const response = await createUser(user.id, user.primaryEmailAddress?.emailAddress || "");
                        if(!response.success){
                            console.log(response.error);
                        }
                    }

                } else {
                    console.log(userExistResponse.error);
                }


            }
        };
        
        userSaved();
    }, [user, isSignedIn]);
    

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