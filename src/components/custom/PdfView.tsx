"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import AudioPlayer from "./Audioplayer";
import { Document, Page, pdfjs } from 'react-pdf';
import { useMemo } from "react";
import 'react-pdf/dist/esm/Page/TextLayer.css'; // Import the TextLayer CSS
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'; // Import 


pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface AudioProps {
    convertTextToSpeech: (
        text: string
    ) => Promise<{
        audioUrl: string;
        success: boolean;
        error?: string;
    }>;
}

interface PdfViewProps {
    setPdfView: (val: boolean) => void;
    pdfName: string;
    numPages: number;
    pdfFile: string;
    pagesText: string[];
    convertTextToSpeech: AudioProps["convertTextToSpeech"];
    pageNumber: number;
    setNumPages: (val: number) => void;
    setPageNumber: (val: number) => void;

} 

export default function PdfView({ setPdfView, pdfName, numPages, pdfFile, pagesText, convertTextToSpeech, setNumPages, pageNumber, setPageNumber}: PdfViewProps){
    // const [pageNumber, setPageNumber] = useState<number>();

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
        setPageNumber(1);
    }

    function changePage(offset: number) {
        // setPageNumber(prevPageNumber => (prevPageNumber || 1) + offset);
        setPageNumber((pageNumber + offset));

    }

    function previousPage() {
        changePage(-1);
    }

    function nextPage() {
        changePage(1);
    }

    const MemoizedPage = useMemo(() => {
        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    objectFit: 'contain',
                }}
            >
                <Page 
                    pageNumber={pageNumber}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="w-full h-full"
                    scale={0.7}
                    loading={<div className="flex justify-center p-10"><div className="animate-pulse">Loading page...</div></div>}
                />
            </div>
        );
    }, [pageNumber]);

    return (
        <div className="bg-zinc-900 rounded-2xl overflow-hidden">
            <div className="flex flex-col gap-2 p-6">
                <div className="flex justify-between items-center">
                    <Button 
                        variant="ghost"
                        className="hover:bg-zinc-800 hover:text-white" onClick={() => {
                            setPdfView(false);
                        }}
                    >Home</Button>
                    <h2 className="text-xl font-medium">{pdfName}</h2>
                </div>
                <div className="flex justify-between items-center mb-6">
                    <Button
                        variant="ghost"
                        className="hover:bg-zinc-800"
                        disabled={(pageNumber || 1) <= 1}
                        onClick={previousPage}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <span className="text-sm text-zinc-400">
                        Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
                    </span>
                    <Button
                        variant="ghost"
                        className="hover:bg-zinc-800"
                        disabled={(pageNumber || 0) >= (numPages || 0)}
                        onClick={nextPage}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>
                <div className="flex flex-row w-full gap-4 ">  
                    <div className="flex flex-col gap-2 w-1/2">
                        <h2 className="text-lg font-semibold">Pdf Viewer</h2>   
                        <Separator className="bg-gray-700"/>
                        <div className="pdf-container h-[calc(100vh-420px)] min-h-[400px] overflow-y-auto w-full flex justify-center">
                            <Document
                                file={pdfFile}
                                onLoadSuccess={onDocumentLoadSuccess}
                            >
                                {MemoizedPage}
                            </Document>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center space-x-4">
                                <AudioPlayer 
                                    text={pagesText[(pageNumber || 1) - 1] || ""}
                                    convertTextToSpeech={convertTextToSpeech}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 w-1/2">
                        <h2 className="text-lg font-semibold">Current Page</h2>
                        <Separator className="bg-gray-700" />
                        <div className="flex flex-row justify-center">
                            <div className="flex flex-col text-center h-[calc(100vh-422px)] overflow-y-auto text-md w-10/12">
                                {pagesText[(pageNumber || 1)-1] || "No text found on this page"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>);
}