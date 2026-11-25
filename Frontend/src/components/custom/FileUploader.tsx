"use client";
import { motion } from "framer-motion";
import { FileUp } from "lucide-react";
import { Button } from "../ui/button";
import { useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { pdfjs } from 'react-pdf';
import { genUploader } from "uploadthing/client";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const { uploadFiles } = genUploader({
    url: process.env.NEXT_PUBLIC_UPLOADTHING_URL || "http://localhost:5001/api/uploadthing",
    package: "uploadthing/client",
});

interface BasePDF {
    url: string,
    key: string,
}

interface ListedPDF extends BasePDF {
    type: 'listed';
    name: string;
    text: string[];
}

interface PdfProps {
    uploadPdfMetadata: (metadata: {
        pdf_key: string;
        pdf_name: string;
        pdf_url: string;
        pdf_text: string;
    }) => Promise<{ success: boolean; response?: boolean; error?: string; }>;
}


interface FileUploaderProps {
    setPopUpActive: (val: boolean) => void;
    uploadPdfMetadata: PdfProps["uploadPdfMetadata"];
    setPdfFile: (val: string) => void;
    setPdfName: (val: string) => void;
    setPagesText: (text: string[]) => void;
    userPdfs: ListedPDF[];
    setPdfView: (val: boolean) => void;
    setUserPdfs: (pdfs: ListedPDF[]) => void;

}

export default function FileUploader({ setPopUpActive, uploadPdfMetadata, setPdfFile, setPdfName, setPagesText, userPdfs, setPdfView, setUserPdfs }: FileUploaderProps){
    const { user, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const [isDragging, setIsDragging] = useState<boolean>(false)
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const extractAllPagesText = async (pdfUrl: string) => {
        if (!pdfUrl) return;
        
        try {
            
            // Load the PDF document
            const loadingTask = pdfjs.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            
            const extractedText: string[] = [];
            
            // Process each page
            for (let i = 1; i <= pdf.numPages; i++) {
                
                const page = await pdf.getPage(i);
                
                
                const textContent = await page.getTextContent();
                
                
                const pageText = textContent.items
                    .map(item => ('str' in item ? item.str : ''))
                    .join(' ');
                extractedText.push(pageText);
            }
            
            setPagesText(extractedText);
            console.log(`Extracted text from ${extractedText.length} pages`);
            return extractedText;
        } catch (error) {
            console.error("Error extracting PDF text:", error);
        }
    };

    const savePdf = async(file: File) => {
        if(!(user && isSignedIn)){
            console.log("User not signed in and/or authenticated...");
            setPopUpActive(true);
            return;
        }

        const pdfName = file.name;
            console.log("pdfName: ", pdfName);

            const uploadResult = await uploadFiles("pdfUploader", {
                files: [file],
                headers: async () => ({ Authorization: `Bearer ${await getToken()}` }),
            }).catch((error) => {
                console.error("PDF upload failed: ", error);
                return null;
            });

            if (!uploadResult){
                return;
            }

            const pdfUrl = uploadResult[0]?.ufsUrl || "";
            const pdfKey = uploadResult[0]?.key || "";
            setPdfFile(pdfUrl);
            setPdfName(pdfName);

            if (!(pdfUrl && pdfKey)){
                console.error("No pdf url and/or returned from upload");
                return;
            }
            const pdfText = await extractAllPagesText(pdfUrl);
            console.log("pdfText: ", pdfText);

           await uploadPdfMetadata({
                pdf_key: pdfKey,
                pdf_name: pdfName,
                pdf_url: pdfUrl,
                pdf_text: JSON.stringify(pdfText || []),
            })
            const newPdf: ListedPDF = {
                url: pdfUrl,
                key: pdfKey,
                name: pdfName,
                text: pdfText || [],
                type: "listed",
            }

            setUserPdfs([...userPdfs, newPdf]);

            setPdfView(true);
    }


    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file && file.type === "application/pdf") {
            savePdf(file);
        }
    }

    const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {

        const file = event.target.files?.[0]
        if (file && file.type === "application/pdf") {
            savePdf(file);
        }
    }
    

    return(
        <motion.div
            className={`border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ease-in-out ${
                isDragging ? "border-highlight bg-highlight/5" : "border-border hover:border-zinc-600"
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            <div className="text-center">
                <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="mt-6 font-serif text-3xl font-normal">Upload your PDF</h2>
                <p className="mt-2 text-muted-foreground">Drag and drop your file here, or click to select</p>
                <input ref={fileInputRef} type="file" accept=".pdf" className="sr-only" onChange={onFileChange} />
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 rounded-full bg-highlight px-6 text-highlight-foreground transition-colors hover:bg-highlight/90"
                >
                    Select PDF file
                </Button>
            </div>
        </motion.div>
    );
}