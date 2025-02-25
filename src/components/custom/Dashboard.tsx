"use client";

import { SignedIn, SignedOut, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { Button } from "../ui/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css'; // Import the TextLayer CSS
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'; // Import AnnotationLayer CSS, if needed

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();



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
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [data, setData] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<string | null>(null);





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

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setData(null);
            setPdfFile(null);
            return;
        }
        setData(file);

        const fileURL = URL.createObjectURL(file);
        setPdfFile(fileURL);
    }, []);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
        setPageNumber(1);
    }

    function changePage(offset: number) {
        setPageNumber(prevPageNumber => (prevPageNumber || 1) + offset);
    }

    function previousPage() {
        changePage(-1);
    }

    function nextPage() {
        changePage(1);
    }

    const MemoizedPage = useMemo(() => {
        return <Page pageNumber={pageNumber} />;
    }, [pageNumber]);

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
        <input type="file" accept=".pdf" onChange={handleFileChange}/>
        <div className="flex flex-col justify-center items-center">
            {pdfFile && (
                <Document
                    file={pdfFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                >
                    {MemoizedPage}
                </Document>
            )}
            <div>
                <p>
                    Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
                </p>
                <Button
                    disabled={(pageNumber || 1) <= 1}
                    onClick={previousPage}
                >
                    Previous
                </Button>
                <Button
                    disabled={(pageNumber || 0) >= (numPages || 0)}
                    onClick={nextPage}
                >
                    Next
                </Button>
            </div>
        </div>    
  </div>);
}