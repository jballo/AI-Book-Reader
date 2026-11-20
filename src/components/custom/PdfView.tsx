"use client";

import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import AudioPlayer from "./Audioplayer";
import { Document, Page, pdfjs } from 'react-pdf';
import { useEffect, useRef, useState } from "react";
import 'react-pdf/dist/esm/Page/TextLayer.css'; // Import the TextLayer CSS
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'; // Import


// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.mjs',
//   import.meta.url,
// ).toString();

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
//    import.meta.url,
// ).toString();

const MAX_PAGE_WIDTH = 640;
const FALLBACK_PAGE_WIDTH = 400;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

const ICON_BUTTON =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

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
    const [pdfError, setPdfError] = useState<Error | null>(null);
    const [pageAreaWidth, setPageAreaWidth] = useState(0);
    const [zoom, setZoom] = useState(1);
    const pageAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const pageArea = pageAreaRef.current;
        if (!pageArea) return;

        const observer = new ResizeObserver(([entry]) => {
            setPageAreaWidth(entry.contentRect.width);
        });
        observer.observe(pageArea);

        return () => observer.disconnect();
    }, []);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
        setPageNumber(1);
    }

    function changePage(offset: number) {
        setPageNumber(Math.min(Math.max(pageNumber + offset, 1), numPages));
    }

    function changeZoom(offset: number) {
        setZoom((current) => Math.min(Math.max(current + offset, MIN_ZOOM), MAX_ZOOM));
    }

    const pageText = pagesText[pageNumber - 1] || "";
    const pageWidth = Math.round(Math.min(pageAreaWidth || FALLBACK_PAGE_WIDTH, MAX_PAGE_WIDTH) * zoom);

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-6">
                <div className="flex min-w-0 items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setPdfView(false)}
                        className="flex shrink-0 items-center gap-1.5 py-3 pr-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Library
                    </button>
                    <span aria-hidden="true" className="h-6 w-px shrink-0 bg-border" />
                    <h1 className="truncate font-serif text-2xl font-normal">{pdfName}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="Previous page"
                        className={ICON_BUTTON}
                        disabled={pageNumber <= 1}
                        onClick={() => changePage(-1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-1.5 text-sm tabular-nums text-muted-foreground" aria-live="polite">
                        Page <span className="text-foreground">{pageNumber}</span> of {numPages}
                    </span>
                    <button
                        type="button"
                        aria-label="Next page"
                        className={ICON_BUTTON}
                        disabled={pageNumber >= numPages}
                        onClick={() => changePage(1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </header>

            {pdfError && (
                <div role="alert" className="border-b border-border bg-destructive/20 px-6 py-3 text-sm">
                    Couldn&apos;t load this PDF: {pdfError.message}
                </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
                <section
                    aria-label="PDF page"
                    className="flex flex-col items-center gap-4 bg-card px-4 py-8 sm:px-6 md:min-h-0 md:flex-1 md:overflow-auto"
                >
                    <div ref={pageAreaRef} className="w-full">
                        <div className="mx-auto w-fit overflow-hidden rounded-sm shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
                            <Document
                                file={pdfFile}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={(error) => {
                                    console.error("PDF Load Error: ", error);
                                    setPdfError(error);
                                }}
                                loading={<p className="p-10 text-sm text-muted-foreground">Loading PDF...</p>}
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    width={pageWidth}
                                    loading={<p className="p-10 text-sm text-muted-foreground">Loading page...</p>}
                                    onError={(error) => {
                                        console.error("Page Render Error: ", error);
                                        setPdfError(error);
                                    }}
                                />
                            </Document>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-border bg-secondary p-1">
                        <button
                            type="button"
                            aria-label="Zoom out"
                            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-zinc-800 disabled:opacity-40"
                            disabled={zoom <= MIN_ZOOM}
                            onClick={() => changeZoom(-ZOOM_STEP)}
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center text-sm tabular-nums text-muted-foreground">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            type="button"
                            aria-label="Zoom in"
                            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-zinc-800 disabled:opacity-40"
                            disabled={zoom >= MAX_ZOOM}
                            onClick={() => changeZoom(ZOOM_STEP)}
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </section>

                <section
                    aria-label="Page text"
                    className="px-6 py-10 md:min-h-0 md:flex-1 md:overflow-y-auto lg:px-16"
                >
                    <p className="mb-6 text-xs font-semibold uppercase tracking-[0.14em] text-highlight">
                        Now reading · page {pageNumber}
                    </p>
                    <p className="font-serif text-2xl leading-relaxed text-zinc-200">
                        {pageText || "No text found on this page."}
                    </p>
                </section>
            </div>

            <footer className="border-t border-border px-4 py-3 sm:px-6">
                <AudioPlayer
                    text={pageText}
                    convertTextToSpeech={convertTextToSpeech}
                />
            </footer>
        </div>);
}
