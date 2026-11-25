# Book Reader

## Overview

PlayAI Book Reader is a web application that allows users to upload and read PDF files while providing text-to-speech functionality using ElevenLabs' API. The app enables smooth navigation between pages and audio playback of the displayed text. It also integrates with Clerk for user authentication and webhooks.

![Book Reader Image](https://8n9nizq7e9.ufs.sh/f/5Hd9daUmOTNeNPeKGpWBU93HvIS1qR4cVMrnsNXK67dOJPz0)

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
-   **Database**: Postgres
-   **Tunneling**: ngrok

## Setup Instructions

1.  **Clone the Repository**

    ```sh
    git clone git@github.com:jballo/PlayAI-Book-Reader.git
    cd PlayAI-Book-Reader
    ```

2.  **Install Dependencies**

    ```sh
    cd Frontend
    npm install  # Install frontend dependencies
    cd ../Backend
    npm install  # Install backend dependencies
    ```

3.  **Environment Variables Setup**
  *   These environment variables are for local development. For deployment, additional variables may be required depending on the hosting provider and services used.
  *   Create a `.env.local` file in the `Frontend` directory with:

      ```
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
      CLERK_SECRET_KEY=your_clerk_secret_key
      NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
      NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
      NEXT_PUBLIC_UPLOADTHING_URL=http://localhost:5001/api/uploadthing # the server's UploadThing route
      API_BASE_URL=http://localhost:5001 # the server's base URL, used by the server actions
      ```

  *   Create a `.env` file in the `Backend` directory with:

      ```
      PGHOST=your_postgres_host
      PGPORT=5432 # optional: defaults to 5432
      PGUSER=your_postgres_user
      PGDATABASE=your_postgres_database
      PGPASSWORD=your_postgres_password
      PGSSLROOTCERT=./your_provider_ca.crt # optional: CA certificate for providers with a private root (e.g. Supabase, AWS RDS)
      PGSSL_REJECT_UNAUTHORIZED=false # optional: only for providers whose certificate can't be verified (e.g. Railway)

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

      REDIS_URL=your_redis_url
      TTS_MAX_CHARS=5000 # optional: longest text accepted per text-to-speech request
      TTS_DAILY_CHAR_BUDGET=20000 # optional: text-to-speech characters each user may convert per UTC day
      ```

  **Important Notes:**
    *   Replace `your_clerk_publishable_key`, `your_clerk_secret_key`, `your_api_secret`, `your_postgres_*`, `your_redis_url`, `your_uploadthing_token`, `your_elevenlabs_api_key`, `your_elevenlabs_voice_id`, and `your_clerk_webhook_secret` with your actual credentials.
    *   `API_BASE_URL` is the Express server's base URL, e.g. `https://your-server-domain`. The app's server actions call it to list, save and delete PDFs and to generate speech. Under `npm run dev` it defaults to `http://127.0.0.1:5001`. A production build (`npm run build` then `npm start`, or any hosted deploy) has no default: with it unset, those actions fail with "API_BASE_URL is not set".
    *   The `CLERK_WEBHOOK_SECRET` is crucial for verifying Clerk webhooks. You can find this in your Clerk dashboard under Webhooks.
    *   `CLERK_JWT_KEY` is the PEM public key from the Clerk dashboard under API keys → JWT public key. The server uses it to verify each request's Clerk session token locally, without calling Clerk. Keep it multi-line inside double quotes.
    *   `CLERK_AUTHORIZED_PARTIES` lists the origins allowed to issue session tokens (the token's `azp` claim), for example `http://localhost:3000,https://your-domain.com`.
    *   `CORS_ORIGINS` lists the exact origins (scheme, host and port, no trailing slash) whose pages may call the server from the browser, such as the PDF upload to `/api/uploadthing`. Requests from any other origin get no `Access-Control-Allow-Origin` header, so the browser blocks them from reading the response. Leaving it empty allows no browser origin. It usually holds the same values as `CLERK_AUTHORIZED_PARTIES` but is set separately.
    *   PDFs upload from the browser straight to UploadThing through the server's `/api/uploadthing` route. `UPLOADTHING_IS_DEV=true` lets UploadThing report finished uploads back to a local server without a public URL. In production, UploadThing calls that route over the internet; if it can't work out the server's public URL from the request, set `UPLOADTHING_CALLBACK_URL=https://your-server-domain/api/uploadthing`.
    *   `REDIS_URL` points at the Redis that holds the per-user rate limits and daily text-to-speech budgets, so every server instance shares one count. Any Redis you can reach works, local or hosted. The server won't start if it can't connect.
    *   If Redis goes down while the server is running, text-to-speech, PDF uploads and saving PDF details return 503 until it's back. Listing and deleting PDFs keep working without limits.
    *   The server always connects to Postgres over TLS and, by default, verifies the certificate against the system's trusted CAs, or against `PGSSLROOTCERT` when set. `PGSSL_REJECT_UNAUTHORIZED=false` keeps the connection encrypted but skips that check, so the server can't confirm it is talking to your database. Use it only when the provider's certificate can't be verified, and preferably over a private network.
    *   **Railway Postgres:** each database signs its certificate with its own CA, which Railway doesn't publish, so set `PGSSL_REJECT_UNAUTHORIZED=false`.
        *   Server on Railway (private network): set `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` and `PGDATABASE` to the Postgres service's variables of the same name, e.g. `PGHOST=${{Postgres.PGHOST}}`. Its host ends in `.railway.internal` and its port is 5432.
        *   Server outside Railway: turn on public networking for the Postgres service, then use its `RAILWAY_TCP_PROXY_DOMAIN` as `PGHOST` and `RAILWAY_TCP_PROXY_PORT` as `PGPORT`.

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

    *   Run each app in its own terminal, starting from the repo root.

    *   Start the Backend:

        ```sh
        cd Backend
        npm start
        ```

    *   Start the Frontend:

        ```sh
        cd Frontend
        npm run dev
        ```

7.  **Access the Application**

    Open [http://localhost:3000](http://localhost:3000) in your web browser.

## Troubleshooting

*   **"Webhook error: Error: No matching signature found"**: This usually means your `CLERK_WEBHOOK_SECRET` is incorrect or the request body is not being parsed correctly. Double-check your `.env` file and ensure you're using `express.raw({ type: 'application/json' })` middleware for the `/webhooks/clerk` route.
*   **Database Connection Errors**: Verify that your Postgres credentials in the `.env` file are correct and that your database is running.
*   **"self-signed certificate in certificate chain"**: Your Postgres provider signs its certificates with its own CA. If the provider publishes that CA certificate (e.g. Supabase, AWS RDS), download it and point `PGSSLROOTCERT` in `Backend/.env` at it. If it doesn't (e.g. Railway), set `PGSSL_REJECT_UNAUTHORIZED=false`.
*   **Server hangs at startup without logging "Listening on port"**: It is probably dialing the wrong Postgres port. Set `PGPORT` to your provider's port; hosted proxies often use one other than 5432.
*   **ngrok Errors**: Make sure `ngrok` is running correctly and that the forwarding URL is accessible.
    *   Ensure you have added your authtoken using `ngrok config add-authtoken $YOUR_AUTHTOKEN`.
*   **UploadThing Errors**: Make sure `UPLOADTHING_TOKEN` is set correctly.

## Additional Notes

*   This setup is for local development. For production deployments, you'll need to use a proper hosting provider and configure your environment variables and webhooks accordingly.
*   Make sure your ElevenLabs API key is valid, has Text to Speech access, and that your account has enough credits.
