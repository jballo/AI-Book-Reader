"use client";
import { motion } from "framer-motion";
import { Download, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { useUser } from "@clerk/nextjs";

interface BasePDF {
    url: string,
    key: string,
}


interface ListedPDF extends BasePDF {
    type: 'listed';
    name: string;
    text: string[];
}


interface PdfListViewProps {
    userPdfs: ListedPDF[],
    isLoadingPdfs: boolean,
    isLoaded: boolean,
    isDeleteDialogOpen: boolean,
    setIsDeleteDialogOpen: (val: boolean) => void,
    setPdfFile: (val: string) => void,
    setPagesText: (val: string[]) => void,
    setNumPages: (val: number) => void,
    setPdfName: (val: string) => void,
    setPageNumber: (val: number) => void,
    setPdfView: (val: boolean) => void,
    deleteOnClick: (val: string) => void,
}

export default function PdfListView({ userPdfs, isLoadingPdfs, isLoaded, isDeleteDialogOpen, setIsDeleteDialogOpen, setPdfFile, setPagesText, setNumPages, setPdfName, setPageNumber, setPdfView, deleteOnClick}: PdfListViewProps) {
    const { isSignedIn } = useUser();

    return (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoadingPdfs ? (
                    <p className="text-zinc-400">Loading PDFs...</p>
                ): (!isSignedIn && isLoaded) ? (
                    <p className="text-zinc-400">Sign in to view your PDFs.</p>
                ) : userPdfs.length === 0 ? (
                    <p className="text-zinc-400">No PDFs uploaded yet.</p>
                ): (
                    userPdfs.map((pdf, index) => (
                        <motion.div
                            key={pdf.key}
                            className="bg-zinc-900 rounded-xl p-4 hover:bg-zinc-800 transition-colors cursor-pointer group"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => {
                                if(!isDeleteDialogOpen){
                                    setPdfFile(pdf.url);
                                    setPagesText(pdf.text);
                                    setNumPages(pdf.text.length);
                                    setPdfName(pdf.name);
                                    setPageNumber(1);
                                    setPdfView(true);
                                }
                            }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-zinc-700 transition-colors">
                                    <Download className="h-5 w-5 text-[#C1FF7A]" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">{pdf.name}</h3>
                                    </div>
                                </div>
                                <AlertDialog
                                    onOpenChange={()=> {
                                        console.log("Hello");
                                    }}
                                >
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent click from propogating to the parent div
                                                setIsDeleteDialogOpen(true);
                                                console.log("Trash button clicked.");
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-zinc-900 text-white border-zinc-700">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are sure you want to delete this pdf?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-zinc-400">
                                                This action cannot be undone. This will permanently delete your
                                                pdf and corresponding your data from our servers.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-zinc-800 hover:bg-zinc-700 text-white" onClick={(e) => {
                                                e.stopPropagation();
                                                setIsDeleteDialogOpen(false);
                                                console.log("Cancel deletion button clicked.");
                                            }}>Cancel</AlertDialogCancel>
                                            <AlertDialogAction className="bg-red-600 hover:bg-red-500 text-white" onClick={(e) => {
                                                e.stopPropagation();
                                                setIsDeleteDialogOpen(false);
                                                        console.log("Final deletion button clicked.");
                                                deleteOnClick(pdf.key);
                                            }}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>);
}