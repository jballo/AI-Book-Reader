"use server";
// import { NextResponse } from "next/server";

export async function UploadPdf(formData: FormData) {
    // const file: File | null = formData.get('pdf') as unknown as File;

    try {
        const file: File | null = formData.get('pdf') as File;

        console.log("file: ", file);

        if (!file) {
            throw new Error(`No file uploaded`);
        }

        const url_endpoint = new URL(process.env.UPLOAD_PDF_ENDPOINT || "http://127.0.0.1:5001/upload-pdf");

        const serverFormData = new FormData();
        serverFormData.append('pdf', file);

        const response = await fetch(url_endpoint, {
            method: "POST",
            headers: {
                "X-API-KEY": process.env.API_KEY || "",
            },
            body: serverFormData,
        });

        if (!response.ok) {
            throw new Error(`Failed to upload pdf`);
        }

        const result = await response.json();
        console.log("Result: ", result);

        // return NextResponse.json({
        //     success: true,
        //     response: result.content
        // });
        return {
            success: true,
            response: result.content
        }

    } catch (error) {
        console.error("Error: ", error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "Failed to upload pdf to uploathing.",
        }
    }
    
}