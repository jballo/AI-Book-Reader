"use server";


export async function createUser(id: string, email: string){
    console.log("createUser in action...");
    try {
        if (!(id && email)) {
            throw new Error(`Missing parameter`);
        }

        // const url = process.env.NEXT_API_ENDPOINT || "http://localhost:3000";
        const url = new URL(process.env.SAVE_USER_ENDPOINT || "http://localhost:5001/users");
        url.searchParams.set("id", id);
        url.searchParams.set("email", email);


        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": process.env.API_KEY || ""
            },
        })

        
        if(!response.ok) {
            throw new Error(`HTTPS error! Status: ${response.status}`);
        }

        
        const result = await response.json();
        console.log("Result: ", result);

        return {
            sucess: true,
            response: result.content,
        };
    } catch (error) {
        console.log("Error: ", error);
        return {
            success: false,
            error: "Failed to add user to db.",
        }
    };
}


export async function userExists(id: string){
    console.log("userExists in action...");
    try {
        if (!id){
            throw new Error("Missing parameters!");
        }

        const url = new URL(process.env.USER_EXISTS_ENDPOINT || "http://localhost:5001/user-exists");
        url.searchParams.set("id", id);

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": process.env.API_KEY || ""
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Result: ", result);

        return {
            success: true,
            response: result.content,
        };

    } catch (error) {
        console.log("Error: ", error);
        return {
            success: false,
            error: "Failed to look up user in db.",
        }
    }
}