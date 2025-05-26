
# AI Code Reviewer

The AI Code Reviewer is a web application that leverages the Google Gemini API to provide automated code reviews for entire software projects. Users can select a project folder, and the tool will analyze the code, offering feedback on architecture, code quality, potential bugs, UI/UX design for frontend components, security, and more.

## Features

*   **Project-Wide Analysis**: Reviews entire project folders, not just single files.
*   **Comprehensive Feedback**: Utilizes Gemini to provide insights on:
    *   Overall project architecture and structure.
    *   Code consistency, reusability, and correctness.
    *   Potential bugs and edge cases.
    *   Security vulnerabilities.
    *   Performance considerations.
    *   **UI/UX & Design Review**: Specific feedback for UI components (e.g., `.tsx`, `.jsx`, `.html`/`.css`) on usability, accessibility, visual design, responsiveness, and user flow.
    *   Best practices and language-specific advice.
*   **Intelligent File Filtering**:
    *   Focuses on common text-based code and configuration files.
    *   Automatically ignores directories like `node_modules`, `.git`, build outputs.
    *   Excludes binary files, media assets, and overly large individual files.
*   **User-Friendly Interface**: Simple folder selection and clear presentation of review feedback.
*   **Responsive Design**: Built with Tailwind CSS for adaptability across devices.
*   **Loading States & Error Handling**: Provides user feedback during processing and for any issues encountered.

## Tech Stack

*   **Frontend**: React 19, TypeScript
*   **AI Backend**: Google Gemini API (`gemini-2.5-flash-preview-04-17` model) via `@google/genai` SDK
*   **Build Tool/Dev Server**: Vite
*   **Styling**: Tailwind CSS
*   **Package Manager**: npm (or Yarn)

## Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended, e.g., v20.x or later. v22.x has been used but can sometimes have issues with native modules on Windows).
*   `npm` (comes with Node.js) or `yarn` (optional, can be installed via `npm install --global yarn`).
*   A Google Gemini API Key.

## Setup & Configuration

1.  **Download or Clone the Project**:
    Obtain all project files and place them in a local directory (e.g., `ai-code-reviewer`).

2.  **Set Up Your API Key**:
    *   The application requires a Google Gemini API key to function.
    *   In the root of your project directory, create a file named `.env`.
    *   Add your API key to this file in the following format:
        ```env
        API_KEY=YOUR_ACTUAL_GEMINI_API_KEY_HERE
        ```
    *   Replace `YOUR_ACTUAL_GEMINI_API_KEY_HERE` with your real API key.
    *   The `.env` file is used by `vite.config.js` to make the API key available to the application.
    *   An example can be found in `.env.example`. **Do not commit your `.env` file to version control.**

3.  **Install Dependencies**:
    Open your terminal, navigate to the project directory, and run:
    ```bash
    npm install
    ```
    Or, if you prefer Yarn:
    ```bash
    yarn install
    ```
    *Troubleshooting Note*: If you encounter errors related to `Cannot find module @rollup/rollup-win32-x64-msvc` (especially on Windows during `npm start` after `npm install`), try the following:
    1. Delete `node_modules` and `package-lock.json`.
    2. Run `npm install --omit=optional`.
    Alternatively, using `yarn install` sometimes resolves these native dependency issues more smoothly.

## Running the Application

1.  **Start the Development Server**:
    Once dependencies are installed, run:
    ```bash
    npm start
    ```
    Or with Yarn:
    ```bash
    yarn start
    ```
    This will start the Vite development server, typically at `http://localhost:5173/`, and should open it automatically in your default web browser.

2.  **Using the Application**:
    *   Click the "Choose Project Folder" button.
    *   Select the root folder of the project you want to review.
    *   The application will process and filter the files.
    *   Click the "Review Project" button to send the project data to the Gemini API.
    *   Wait for the analysis to complete. Feedback will be displayed on the page.

## Project Structure & Component Overview

Here's a breakdown of the key files and directories:

*   **`index.html`**: The main HTML entry point for the application. It includes Tailwind CSS setup and the root div where the React app is mounted.
*   **`index.tsx`**: The entry point for the React application. It uses React 18's `createRoot` API to render the main `App` component.
*   **`App.tsx`**: The main application component. It manages the overall state, including selected project files, the project name, API feedback, loading status, and errors. It orchestrates the interaction between child components and the Gemini service.
*   **`package.json`**: Defines project metadata, dependencies (`react`, `@google/genai`, etc.), development dependencies (`vite`, `@types/react`), and npm scripts (`start`, `build`).
*   **`vite.config.js`**: Configuration file for Vite. It sets up the React plugin and, crucially, defines how environment variables (like `API_KEY` from `.env`) are exposed to the client-side application code.
*   **`.env.example`**: An example file showing the format for the `.env` file where the `API_KEY` should be stored.
*   **`metadata.json`**: Contains metadata about the application, like its name and description. It can also be used to request specific permissions if needed (e.g., camera, microphone, though not used in this app).
*   **`README.md`**: This file – providing information about the project.

*   **`services/`**
    *   **`geminiService.ts`**:
        *   Handles all communication with the Google Gemini API.
        *   Initializes the `GoogleGenAI` client with the `API_KEY`.
        *   Contains the `SYSTEM_INSTRUCTION_PROJECT`, a detailed prompt guiding the Gemini model on how to perform the project review, including specific instructions for UI/UX analysis.
        *   The `getProjectReviewFeedback` function formats the project files into a single large prompt, sends it to the API, and handles the response or errors.
        *   Includes a client-side check for oversized payloads to prevent extremely large requests to the API.

*   **`components/`**
    *   **`ProjectInput.tsx`**:
        *   Provides the "Choose Project Folder" functionality using a hidden file input with `webkitdirectory` attribute.
        *   Reads files from the selected folder, including their relative paths.
        *   Implements sophisticated filtering logic:
            *   Uses `ALLOWED_EXTENSIONS_AND_FILENAMES` to select relevant code/text files.
            *   Uses `IGNORED_PATTERNS` to skip common unwanted directories (e.g., `node_modules`, `.git`) and file types (e.g., binaries, archives, media).
            *   Enforces `MAX_FILE_SIZE_BYTES` per file and `MAX_TOTAL_FILES` to prevent overwhelming the browser or API.
        *   Displays the selected folder name and a summary of files collected/skipped.
        *   Communicates the selected `ProjectFile[]` (array of `{path: string, content: string}`) and folder name back to `App.tsx`.
    *   **`ReviewOutput.tsx`**:
        *   A simple component responsible for displaying the feedback received from the Gemini API.
        *   Uses a `<pre>` tag to preserve formatting (like line breaks and spacing) from the Markdown-formatted API response.
    *   **`Header.tsx`**:
        *   Displays the application title ("AI Code Reviewer") and a brief tagline.
        *   Includes the `CodeIcon`.
    *   **`ActionButton.tsx`**:
        *   A reusable button component used for the main "Review Project" action.
        *   Shows a loading spinner and disabled state when an action is in progress.
    *   **`Spinner.tsx`**:
        *   A simple SVG animated loading spinner component.
    *   **`icons/CodeIcon.tsx`**:
        *   An SVG component for the code-related icon used in the header.

*   **`components/CodeInput.tsx`**: This file is deprecated and no longer used, as the application now focuses on project-level reviews via `ProjectInput.tsx`.

## How It Works

1.  **Folder Selection**: The user selects a project folder using the `ProjectInput` component.
2.  **File Processing & Filtering**: The browser reads the files from the selected folder. `ProjectInput.tsx` filters these files based on predefined rules (allowed extensions, ignored paths, file size). Only relevant text-based files are retained.
3.  **Prompt Construction**: The content of the selected files, along with their relative paths and the project name, are combined into a single, large text prompt by `geminiService.ts`. A detailed system instruction is prepended to this prompt to guide the AI.
4.  **API Request**: This combined prompt is sent to the Google Gemini API (`gemini-2.5-flash-preview-04-17` model).
5.  **Feedback Generation**: The Gemini model analyzes the provided code and instructions, generating a comprehensive review.
6.  **Display**: The response from the API (which is Markdown text) is displayed to the user via the `ReviewOutput` component.

## Important Considerations & Limitations

*   **API Key**: A valid Google Gemini API key is **required** and must be configured correctly in the `.env` file.
*   **API Costs**: Use of the Gemini API may incur costs depending on your usage and Google's pricing model. Be mindful of this, especially with large projects or frequent use.
*   **Project Size**:
    *   Extremely large projects (many files or very large individual files) might exceed the browser's processing capabilities or the Gemini API's token limits / payload size limits.
    *   The application has client-side checks in `geminiService.ts` (e.g., `MAX_CONTENT_LENGTH_BYTES`) and `ProjectInput.tsx` (e.g., `MAX_FILE_SIZE_BYTES`, `MAX_TOTAL_FILES`) to mitigate this, but very large projects might still face issues.
    *   If a project is too large, the review might fail, be truncated, or the API might return an error.
*   **Review Quality**: The quality of the review depends on the Gemini model's capabilities and the clarity of the code provided. While powerful, AI reviews should complement, not replace, human oversight.
*   **Security of API Key**: The API key is exposed to the client-side code in this setup. For a production application intended for wider public use, you would typically proxy API requests through a backend server where the API key is kept secret. For local development or internal tools, this client-side setup can be acceptable.
*   **File Encoding**: The application assumes files are UTF-8 encoded text. Non-text files or files with unusual encodings might cause issues during reading or processing.

## License

This project is intended for educational and illustrative purposes. Please adapt and use responsibly. (No specific license file provided, but you could add one like MIT if desired).
      