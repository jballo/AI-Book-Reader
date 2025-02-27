"use client";

import { SignedIn, SignedOut, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { Button } from "../ui/button";
import { useCallback, useEffect, useMemo, useState } from "react";
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

interface PDF {
    url: string,
    key: string,
}

interface PdfProps {
    uploadPdf: (
        pdf: FormData
    ) => Promise<{ success: boolean; response?: PDF; error?: string; }>;
    uploadPdfMetadata: (
        userId: string,
        pdf_key: string,
        pdf_url: string,
        pdf_text: string[]
    ) => Promise<{ success: boolean; response?: boolean; error?: string; }>;
}

interface DashboardProps {
    createUser: UserProps["createUser"];
    userExists: UserProps["userExists"];
    uploadPdf: PdfProps["uploadPdf"];
    uploadPdfMetadata: PdfProps["uploadPdfMetadata"];
}

export default function Dashboard({ createUser, userExists, uploadPdf, uploadPdfMetadata }: DashboardProps){
    const { user, isSignedIn } = useUser();
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>();
    // const [data, setData] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<string | null>(null);

     // state for text extraction
    const [pagesText, setPagesText] = useState<string[]>([]);
    const [isExtracting, setIsExtracting] = useState<boolean>(false);
    const [extractionError, setExtractionError] = useState<string | null>(null);



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

    const extractAllPagesText = async (pdfUrl: string) => {
        if (!pdfUrl) return;
        
        try {
            setIsExtracting(true);
            setExtractionError(null);
            
            // Load the PDF document
            const loadingTask = pdfjs.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            
            const extractedText: string[] = [];
            
            // Process each page
            for (let i = 1; i <= pdf.numPages; i++) {
                // Get the page
                const page = await pdf.getPage(i);
                
                // Extract text content
                const textContent = await page.getTextContent();
                
                // Concatenate the text items
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                extractedText.push(pageText);
            }
            
            setPagesText(extractedText);
            console.log(`Extracted text from ${extractedText.length} pages`);
            return extractedText;
        } catch (error) {
            console.error("Error extracting PDF text:", error);
            setExtractionError("Failed to extract text from PDF");
        } finally {
            setIsExtracting(false);
        }
    };


    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            // setData(null);
            setPdfFile(null);
            return;
        }
        // setData(file);

        const actionFormData = new FormData();
        actionFormData.append("pdf", file);

        const uploadpdf_response = await uploadPdf(actionFormData);

        if (!uploadpdf_response.success){
            console.error("PDF upload failed");
            return;
        }
        
        const pdfUrl = uploadpdf_response.response?.url || "";
        const pdfKey = uploadpdf_response.response?.key || "";
        setPdfFile(pdfUrl)

        if (!(pdfUrl && pdfKey)){
            console.error("No pdf url and/or returned from upload");
            return;
        }
        const pdfText = await extractAllPagesText(pdfUrl);
        console.log("pdfText: ", pdfText);

        if(!(user && isSignedIn)){
            console.error("User not signed in and/or authenticated...");
            return;
        }
        await uploadPdfMetadata(user.id, pdfKey, pdfUrl, pdfText || []);

    }, [user, isSignedIn, uploadPdf, uploadPdfMetadata, extractAllPagesText]);

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
                {pagesText.length > 0 && pageNumber && (
                    <div className="mt-4 w-full max-w-md p-4 border rounded">
                        <h3 className="font-medium mb-2">Current Page Text:</h3>
                        <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 text-sm">
                            {pagesText[pageNumber-1] || "No text found on this page"}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Total pages extracted: {pagesText.length}
                        </p>
                    </div>
                )}
            </div>
        </div>    
  </div>);
}