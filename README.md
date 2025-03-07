# PlayAI Book Reader

## Overview

PlayAI Book Reader is a web application that allows users to upload and read PDF files while providing text-to-speech functionality using PlayAI's API. The app enables smooth navigation between pages and audio playback of the displayed text. It also integrates with Clerk for user authentication and webhooks.

![Book Reader Image](https://8n9nizq7e9.ufs.sh/f/5Hd9daUmOTNecmepElJQnyzb7RhMN8iojZuTFHlraBpvKfIV)

## Features

-   **PDF Upload**: Users can upload a PDF file through the web interface.
-   **Page Display**: The uploaded PDF is parsed and displayed one page at a time.
    -   Users can navigate between pages using next/previous buttons.
-   **Text-to-Speech (TTS)**: The content of the currently displayed page can be played as audio using the PlayAI Text-to-Speech API.
    -   Users can control playback with play/pause functionality.
-   **User Authentication**: Implemented using Clerk.
-   **Webhooks**: Uses Clerk webhooks for user management.

## Tech Stack

-   **Frontend**: Next.js, Typescript, TailwindCSS
-   **Backend**: Express
-   **File Storage**: UploadThing
-   **Auth**: Clerk
-   **APIs**: PlayAI Text-to-Speech API, Clerk Webhooks
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
      ```

  *   Create a `.env` file in the `server` directory with:

      ```
      PGHOST=your_postgres_host
      PGHOST_UNPOOLED=your_postgres_unpooled_host
      PGUSER=your_postgres_user
      PGDATABASE=your_postgres_database
      PGPASSWORD=your_postgres_password

      API_KEY=your_api_key # Generate with 'uuidgen' and keep consistent with .env.local

      UPLOADTHING_TOKEN=your_uploadthing_token

      PLAYAI_AUTH_KEY=your_playai_auth_key
      PLAYAI_USER_ID=your_playai_user_id
      CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
      ```

  **Important Notes:**
    *   Replace `your_clerk_publishable_key`, `your_clerk_secret_key`, `your_api_secret`, `your_api_key`, `your_postgres_*`, `your_uploadthing_token`, `your_playai_auth_key`, `your_playai_user_id`, and `your_clerk_webhook_secret` with your actual credentials.
    *   The `CLERK_WEBHOOK_SECRET` is crucial for verifying Clerk webhooks. You can find this in your Clerk dashboard under Webhooks.

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
*   **ngrok Errors**: Make sure `ngrok` is running correctly and that the forwarding URL is accessible.
    *   Ensure you have added your authtoken using `ngrok config add-authtoken $YOUR_AUTHTOKEN`.
*   **UploadThing Errors**: Make sure `UPLOADTHING_TOKEN` is set correctly.

## Additional Notes

*   This setup is for local development. For production deployments, you'll need to use a proper hosting provider and configure your environment variables and webhooks accordingly.
*   Make sure your PlayAI API keys are valid and that you have sufficient credits to use the Text-to-Speech API.