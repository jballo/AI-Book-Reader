"use server";
import { auth } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

const UNAUTHORIZED = { success: false, error: "Unauthorized" } as const;

function apiUrl(path: string) {
    const baseUrl = process.env.API_BASE_URL?.trim().replace(/\/+$/, "");
    if (baseUrl) return new URL(`${baseUrl}${path}`);
    if (process.env.NODE_ENV === "production") {
        throw new Error("API_BASE_URL is not set. Set it to the URL of the Express server.");
    }
    return new URL(`http://127.0.0.1:5001${path}`);
}

async function failedRequestError(response: Response, fallback: string) {
    if (response.status !== 429 && response.status !== 503) return fallback;
    const body = await response.json().catch(() => null);
    return typeof body?.error === "string" ? body.error : fallback;
}

export async function UploadPdfMetadata({
    pdf_key,
    pdf_name,
    pdf_url,
    pdf_text,
}: {
    pdf_key: string;
    pdf_name: string;
    pdf_url: string;
    pdf_text: string;
}) {
    const { userId, getToken } = await auth();
    const sessionToken = userId ? await getToken() : null;
    if (!sessionToken) return UNAUTHORIZED;

    console.log("pdf_key: ", pdf_key);
    console.log("pdf_name: ", pdf_name);
    console.log("pdf_url: ", pdf_url);
    try {
        const url_endpoint = apiUrl("/upload-pdf-metadata");

        const response = await fetch(url_endpoint.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sessionToken}`,
            }, 
            body: JSON.stringify({ pdf_key, pdf_name, pdf_url, pdf_text: JSON.parse(pdf_text) })
        })

        if(!response.ok) {
            return {
                success: false,
                error: await failedRequestError(response, "Try uploading it again."),
            }
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
            error: "Try uploading it again.",
        }
    }
}



export async function ListPdfs() {
    const { userId, getToken } = await auth();
    const sessionToken = userId ? await getToken() : null;
    if (!sessionToken) return UNAUTHORIZED;


    try {
        const url_endpoint = apiUrl("/list-pdfs");

        // url_endpoint.searchParams.set("userId", userId);

        const response = await fetch(url_endpoint.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            return {
                success: false,
                error: await failedRequestError(response, "Try again."),
            }
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
            error: "Try again.",
        }
    }
}


export async function DeletePdf(id: string) {
    const { userId, getToken } = await auth();
    const sessionToken = userId ? await getToken() : null;
    if (!sessionToken) return UNAUTHORIZED;

    if (typeof id !== "string" || id.length === 0) {
        return { success: false, error: "Invalid id" };
    }

    console.log("id: ", id);
    try {
        const url_endpoint = apiUrl("/delete-pdf");

        const response = await fetch(url_endpoint.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({ id }),
        })

        if (!response.ok) {
            return {
                success: false,
                error: await failedRequestError(response, "Try again."),
            }
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
            error: "Try again.",
        }
    }
}