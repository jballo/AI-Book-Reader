"use client";
import { motion } from "framer-motion";
import { Shuffle } from "lucide-react";
import { Button } from "../ui/button";
import { useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface BasePDF {
    url: string,
    key: string,
}

interface UploadedPDF extends BasePDF{
    type: 'uploaded';
}

interface ListedPDF extends BasePDF {
    type: 'listed';
    name: string;
    text: string[];
}

interface PdfProps {
    uploadPdf: (
        pdf: FormData
    ) => Promise<{ success: boolean; response?: UploadedPDF; error?: string; }>;
    uploadPdfMetadata: (
        userId: string,
        pdf_key: string,
        pdf_name: string,
        pdf_url: string,
        pdf_text: string[]
    ) => Promise<{ success: boolean; response?: boolean; error?: string; }>;
}


interface FileUploaderProps {
    setPopUpActive: (val: boolean) => void;
    uploadPdf: PdfProps["uploadPdf"];
    uploadPdfMetadata: PdfProps["uploadPdfMetadata"];
    setPdfFile: (val: string) => void;
    setPdfName: (val: string) => void;
    setPagesText: (text: string[]) => void;
    userPdfs: ListedPDF[];
    setPdfView: (val: boolean) => void;
    setUserPdfs: (pdfs: ListedPDF[]) => void;

}

export default function FileUploader({ setPopUpActive, uploadPdf, uploadPdfMetadata, setPdfFile, setPdfName, setPagesText, userPdfs, setPdfView, setUserPdfs }: FileUploaderProps){
    const { user, isSignedIn } = useUser();
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

            const actionFormData = new FormData();
            actionFormData.append("pdf", file);

            const uploadpdf_response = await uploadPdf(actionFormData);

            if (!uploadpdf_response.success){
                console.error("PDF upload failed");
                return;
            }
            
            const pdfUrl = uploadpdf_response.response?.url || "";
            const pdfKey = uploadpdf_response.response?.key || "";
            setPdfFile(pdfUrl);
            setPdfName(pdfName);

            if (!(pdfUrl && pdfKey)){
                console.error("No pdf url and/or returned from upload");
                return;
            }
            const pdfText = await extractAllPagesText(pdfUrl);
            console.log("pdfText: ", pdfText);

           await uploadPdfMetadata(
                user.id,
                pdfKey,
                pdfName,
                pdfUrl,
                pdfText || [],
            )
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
                isDragging ? "border-[#C1FF7A] bg-[#C1FF7A] bg-opacity-5" : "border-zinc-800 hover:border-zinc-700"
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            <div className="text-center">
                <Shuffle className="mx-auto h-12 w-12 text-zinc-500" />
                <h2 className="mt-6 text-2xl font-semibold">Upload your PDF</h2>
                <p className="mt-2 text-zinc-400">Drag and drop your file here, or click to select</p>
                <input ref={fileInputRef} type="file" accept=".pdf" className="sr-only" onChange={onFileChange} />
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 bg-[#C1FF7A] text-black hover:bg-[#B1EF6A] transition-colors"
                >
                    Select PDF file
                </Button>
            </div>
        </motion.div>
    );
}