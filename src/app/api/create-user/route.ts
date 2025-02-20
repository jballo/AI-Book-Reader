"use server";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
    const body = await request.json();

    const { id, email } = body;
    console.log("Id: ", id);
    console.log("Email: ", email);
    
    const apiSecret = request.headers.get("X-API-SECRET");

    if (apiSecret !== process.env.NEXT_API_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401});
    }
    
    try {
        const url = new URL(process.env.API_ENDPOINT || "http://localhost:5001/users");
        url.searchParams.set("id", id);
        url.searchParams.set("email", email);

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": process.env.API_KEY || ""
            }
        });

        if(!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        console.log("Result: ", result);

        return NextResponse.json({
            success: true,
            response: result.content
        });

    } catch (error) {
        console.log("Error: ", error);
        return NextResponse.json(
            { success: false, error: "Failed to create user in db. "},
            { status: 500 }
        )
    };
}