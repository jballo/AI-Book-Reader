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

export async function UploadPdfMetadata(
    userId: string,
    pdf_key: string,
    pdf_name: string,
    pdf_url: string,
    pdf_text: string[]
) {
    console.log("userId: ", userId);
    console.log("pdf_key: ", pdf_key);
    console.log("pdf_name: ", pdf_name);
    console.log("pdf_url: ", pdf_url);
    console.log("pdf_text: ", pdf_text);
    try {
        const url_endpoint = new URL(process.env.UPLOAD_PDF_METADATA_ENDPOINT || "http://127.0.0.1:5001/upload-pdf-metadata");

        const response = await fetch(url_endpoint.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": process.env.API_KEY || "",
            }, 
            body: JSON.stringify({ userId, pdf_key, pdf_name, pdf_url, pdf_text })
        })

        if(!response.ok) {
            throw new Error(`Failed to upload pdf metadata`);
        }

        const result = await response.json();

        console.log("Result: ", result);

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



export async function ListPdfs(userId: string) {
    console.log("userId: ", userId);

    try {
        const url_endpoint = new URL(process.env.LIST_PDFS_ENDPOINT || "http://127.0.0.1:5001/list-pdfs");

        // url_endpoint.searchParams.set("userId", userId);

        const response = await fetch(url_endpoint.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": process.env.API_KEY || "",
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            throw new Error(`Failed to retrieve list of pdfs`);
        }

        const result = await response.json();
        console.log("Result: ", result);

        return {
            success: true,
            response: result.content,
        }

        
    } catch (error) {
        console.log("Error: ", error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "Failed to retrieve list of pdfs",
        }
    }
}