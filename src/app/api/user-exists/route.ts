"use server";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
    const body = await request.json();

    const { id } = body;

    const apiSecret = request.headers.get("X-API-SECRET");

    if (apiSecret !== process.env.NEXT_API_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401});
    }

    try {

        const url = new URL(process.env.API_ENDPOINT || "http://localhost:5001/user-exists");
        url.searchParams.set("id", id);

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": process.env.API_KEY || ""
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Error: ${errorText}`);
        }

        const result = await response.json();
        console.log("Result: ", result);

        return NextResponse.json({
            success: true,
            response: result.content
        })
    } catch(error) {
        return NextResponse.json({
            sucess: false,
            error: "Failed to look up user in db."
        })
    }

}