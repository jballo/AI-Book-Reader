# PlayAI Book Reader

## Overview
PlayAI Book Reader is a web application that allows users to upload and read PDF files while providing text-to-speech functionality using PlayAI’s API. The app enables smooth navigation between pages and audio playback of the displayed text.

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

3. **Run the Application**
    - Start the Backend:
        ```sh
        cd server
        npm start
        ```
    - Start the Frontend:
        ```sh
        npm run dev
        ```

4. Access the Application Open http://localhost:3000 in your web browser.