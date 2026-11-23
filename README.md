# Book Reader

## Overview

PlayAI Book Reader is a web application that allows users to upload and read PDF files while providing text-to-speech functionality using ElevenLabs' API. The app enables smooth navigation between pages and audio playback of the displayed text. It also integrates with Clerk for user authentication and webhooks.

![Book Reader Image](https://xrqb2mg56u.ufs.sh/f/DbWOBxCL0tnlGpxZZIKrfb4VW5x78FhpSNPz9asRimtvlD1n)

## Features

-   **PDF Upload**: Users can upload a PDF file through the web interface.
-   **Page Display**: The uploaded PDF is parsed and displayed one page at a time.
    -   Users can navigate between pages using next/previous buttons.
-   **Text-to-Speech (TTS)**: The content of the currently displayed page can be played as audio using the ElevenLabs Text-to-Speech API.
    -   Users can control playback with play/pause functionality.
-   **User Authentication**: Implemented using Clerk.
-   **Webhooks**: Uses Clerk webhooks for user management.

## Tech Stack

-   **Frontend**: Next.js, Typescript, TailwindCSS
-   **Backend**: Express
-   **File Storage**: UploadThing
-   **Auth**: Clerk
-   **APIs**: ElevenLabs Text-to-Speech API, Clerk Webhooks
-   **Database**: Neon Postgres
-   **Tunneling**: ngrok

## Setup Instructions

1.  **Clone the Repository**

    ```sh
    git clone git@github.com:jballo/PlayAI-Book-Reader.git
    cd PlayAI-Book-Reader
    ```

2.  **Install Dependencies**

    ```sh
    npm install  # Install frontend dependencies
    cd server
    npm install  # Install backend dependencies
    ```

3.  **Environment Variables Setup**
  *   These environment variables are for local development. For deployment, additional variables may be required depending on the hosting provider and services used.
  *   Create a `.env.local` file in the root directory with:

      ```
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
      CLERK_SECRET_KEY=your_clerk_secret_key
      NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
      NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
      API_KEY=your_api_key # Generate with 'uuidgen' and keep consistent with server/.env
      NEXT_PUBLIC_UPLOADTHING_URL=http://localhost:5001/api/uploadthing # the server's UploadThing route
      ```

  *   Create a `.env` file in the `server` directory with:

      ```
      PGHOST=your_postgres_host
      PGHOST_UNPOOLED=your_postgres_unpooled_host
      PGUSER=your_postgres_user
      PGDATABASE=your_postgres_database
      PGPASSWORD=your_postgres_password
      PGSSLROOTCERT=./your_provider_ca.crt # optional: CA certificate for providers with a private root (e.g. Supabase, AWS RDS)

      API_KEY=your_api_key # Generate with 'uuidgen' and keep consistent with .env.local

      UPLOADTHING_TOKEN=your_uploadthing_token
      UPLOADTHING_IS_DEV=true # local development only; remove in production

      ELEVENLABS_API_KEY=your_elevenlabs_api_key
      ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
      ELEVENLABS_MODEL_ID=eleven_multilingual_v2 # optional, e.g. eleven_flash_v2_5 for lower latency
      CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
      CLERK_JWT_KEY="-----BEGIN PUBLIC KEY-----
      ...
      -----END PUBLIC KEY-----"
      CLERK_AUTHORIZED_PARTIES=http://localhost:3000 # comma-separated origins of the Next.js app
      CORS_ORIGINS=http://localhost:3000 # comma-separated origins allowed to call the server from a browser
      ```

  **Important Notes:**
    *   Replace `your_clerk_publishable_key`, `your_clerk_secret_key`, `your_api_secret`, `your_api_key`, `your_postgres_*`, `your_uploadthing_token`, `your_elevenlabs_api_key`, `your_elevenlabs_voice_id`, and `your_clerk_webhook_secret` with your actual credentials.
    *   The `CLERK_WEBHOOK_SECRET` is crucial for verifying Clerk webhooks. You can find this in your Clerk dashboard under Webhooks.
    *   `CLERK_JWT_KEY` is the PEM public key from the Clerk dashboard under API keys → JWT public key. The server uses it to verify each request's Clerk session token locally, without calling Clerk. Keep it multi-line inside double quotes.
    *   `CLERK_AUTHORIZED_PARTIES` lists the origins allowed to issue session tokens (the token's `azp` claim), for example `http://localhost:3000,https://your-domain.com`.
    *   `CORS_ORIGINS` lists the exact origins (scheme, host and port, no trailing slash) whose pages may call the server from the browser, such as the PDF upload to `/api/uploadthing`. Requests from any other origin get no CORS headers, so the browser blocks them from reading the response. Leaving it empty allows no browser origin. It usually holds the same values as `CLERK_AUTHORIZED_PARTIES` but is set separately.
    *   PDFs upload from the browser straight to UploadThing through the server's `/api/uploadthing` route. `UPLOADTHING_IS_DEV=true` lets UploadThing report finished uploads back to a local server without a public URL. In production, UploadThing calls that route over the internet; if it can't work out the server's public URL from the request, set `UPLOADTHING_CALLBACK_URL=https://your-server-domain/api/uploadthing`.

4.  **Set up ngrok**

  *   [Download and install ngrok](https://ngrok.com/download).
  *   Connect your ngrok account:

  ```sh
  ngrok config add-authtoken $YOUR_AUTHTOKEN
  ```

  *   Replace `$YOUR_AUTHTOKEN` with your ngrok authtoken. You can find your authtoken in your ngrok dashboard.
  *   **Note:** An ngrok account is required to run locally.
  *   Expose your local server (port 5001) to the internet:

  ```sh
  ngrok http 5001
  ```

  *   **Important:** Take note of the `ngrok` forwarding URL (e.g., `https://your-unique-id.ngrok.io`). You'll need this for configuring your Clerk webhook endpoint.

5.  **Configure Clerk Webhook**

    *   In your Clerk dashboard, add a webhook endpoint.
    *   Set the webhook URL to your `ngrok` forwarding URL, appending `/webhooks/clerk` (e.g., `https://your-unique-id.ngrok.io/webhooks/clerk`).
    *   Make sure the webhook is enabled and subscribed to the events you need (e.g., `user.created`).

6.  **Run the Application**

    *   Start the Backend:

        ```sh
        cd server
        npm start
        ```

    *   Start the Frontend:

        ```sh
        npm run dev
        ```

7.  **Access the Application**

    Open [http://localhost:3000](http://localhost:3000) in your web browser.

## Troubleshooting

*   **"Webhook error: Error: No matching signature found"**: This usually means your `CLERK_WEBHOOK_SECRET` is incorrect or the request body is not being parsed correctly. Double-check your `.env` file and ensure you're using `express.raw({ type: 'application/json' })` middleware for the `/webhooks/clerk` route.
*   **Database Connection Errors**: Verify that your Postgres credentials in the `.env` file are correct and that your database is running.
*   **"self-signed certificate in certificate chain"**: Your Postgres provider signs its certificates with its own CA. Download the provider's CA certificate and point `PGSSLROOTCERT` in `server/.env` at it.
*   **ngrok Errors**: Make sure `ngrok` is running correctly and that the forwarding URL is accessible.
    *   Ensure you have added your authtoken using `ngrok config add-authtoken $YOUR_AUTHTOKEN`.
*   **UploadThing Errors**: Make sure `UPLOADTHING_TOKEN` is set correctly.

## Additional Notes

*   This setup is for local development. For production deployments, you'll need to use a proper hosting provider and configure your environment variables and webhooks accordingly.
*   Make sure your ElevenLabs API key is valid, has Text to Speech access, and that your account has enough credits.
