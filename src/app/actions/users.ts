"use server";


export async function createUser(id: string, email: string){
    try {
        if (!(id && email)) {
            throw new Error(`Missing parameter`);
        }

        const url = process.env.NEXT_API_ENDPOINT || "http://localhost:3000";

        const response = await fetch(`${url}/api/create-user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-SECRET": process.env.NEXT_API_SECRET || "",
            },
            body: JSON.stringify({ id, email })
        })

        
        if(!response.ok) {
            throw new Error(`HTTPS error! Status: ${response.status}`);
        }

        
        const result = await response.json();
        console.log("Result: ", result);

        return result;
    } catch (error) {
        return {
            success: false,
            error: "Failed to add user to db.",
        }
    };
}


export async function userExists(id: string){
    try {
        if (!id){
            throw new Error("Missing parameters!");
        }

        const url = process.env.NEXT_API_ENDPOINT || "http://localhost:3000";

        const response = await fetch(`${url}/api/user-exists`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-SECRET": process.env.NEXT_API_SECRET || ""
            },
            body: JSON.stringify({ id })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Result: ", result);

        return result;

    } catch (error) {
        return {
            success: false,
            error: "Failed to look up user in db.",
        }
    }
}