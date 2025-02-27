# PlayAI Book Reader

## Overview
PlayAI Book Reader is a web application that allows users to upload and read PDF files while providing text-to-speech functionality using PlayAI's API. The app enables smooth navigation between pages and audio playback of the displayed text.

## Features
- **PDF Upload**: Users can upload a PDF file through the web interface.
- **Page Display**: The uploaded PDF is parsed and displayed one page at a time.
  - Users can navigate between pages using next/previous buttons or a page number input.
- **Text-to-Speech (TTS)**: The content of the currently displayed page can be played as audio using the PlayAI Text-to-Speech API.
  - Users can control playback with play/pause functionality.

## Tech Stack
- **Frontend**: Next.js, TailwindCSS
- **Backend**: Express
- **File Storage**: UploadThing
- **APIs**: PlayAI Text-to-Speech API
- **DB**: Neon Postgres

## Setup Instructions
1. **Clone the Repository**
    ```sh
    git clone git@github.com:jballo/PlayAI-Book-Reader.git
    cd playai-book-reader
    ```
2. **Install Dependences**
    ```sh
    npm install  # Install frontend dependencies
    cd server
    npm install  # Install backend dependencies
    ```

3. **Environment Variables Setup**
    - Create a [.env.local](http://_vscodecontentref_/1) file in the root directory with:
      ```
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
      CLERK_SECRET_KEY=your_clerk_secret_key
      NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
      NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
      NEXT_API_SECRET=your_api_secret
      API_KEY=your_api_key
      ```

    - Create a [.env](http://_vscodecontentref_/2) file in the server directory with:
      ```
      PGHOST=your_postgres_host
      PGHOST_UNPOOLED=your_postgres_unpooled_host
      PGUSER=your_postgres_user
      PGDATABASE=your_postgres_database
      PGPASSWORD=your_postgres_password
      
      API_KEY=your_api_key
      
      UPLOADTHING_TOKEN=your_uploadthing_token
      
      PLAYAI_AUTH_KEY=your_playai_auth_key
      PLAYAI_USER_ID=your_playai_user_id
      ```

4. **Run the Application**
    - Start the Backend:
        ```sh
        cd server
        npm start
        ```
    - Start the Frontend:
        ```sh
        npm run dev
        ```

5. Access the Application Open http://localhost:3000 in your web browser.