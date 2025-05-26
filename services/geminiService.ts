
import { GoogleGenAI } from "@google/genai";

export interface ProjectFile {
  path: string;
  content: string;
}

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn(
    "API_KEY environment variable not found. AI features will not work."
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const model = "gemini-2.5-flash-preview-04-17";

const SYSTEM_INSTRUCTION_PROJECT = `You are an expert Senior Software Engineer and UX/UI Design consultant performing a comprehensive review of an entire software project.
The project files and their content will be provided, with each file's path indicated.
Your review should be holistic, constructive, clear, and actionable.
Please provide feedback on the following aspects:

1.  **Overall Project Summary & Health**:
    *   A brief, high-level assessment of the project. What is its apparent purpose? How well is it structured for this purpose?

2.  **Project Architecture & Structure**:
    *   Clarity of project organization (folder structure, module separation). Is it logical and easy to navigate?
    *   Maintainability and scalability of the architecture. How easy would it be to add new features or fix bugs?
    *   Appropriateness of design patterns used (or lack thereof). Are there clear responsibilities for different parts of the code?

3.  **Code Consistency & Reusability**:
    *   Consistency in coding style, naming conventions, and patterns across the project.
    *   Identification of duplicated code and opportunities for abstraction/reusability.

4.  **Correctness & Potential Bugs**:
    *   Potential bugs, logical errors, or unhandled edge cases, considering inter-file dependencies.
    *   Race conditions or concurrency issues if applicable (e.g., in backend or complex async frontend code).

5.  **Best Practices & Code Quality (General)**:
    *   Adherence to language-specific best practices (e.g., for JavaScript, Python, Java, etc.).
    *   Readability, maintainability, and efficiency of individual files/modules. Effective use of comments and documentation within the code.

6.  **Security Vulnerabilities**:
    *   Potential security risks (e.g., XSS, CSRF, SQL injection, insecure handling of secrets, insecure direct object references, dependency vulnerabilities if discernible from context like package.json). List specific file paths and line numbers if possible.

7.  **Performance Considerations**:
    *   Project-wide performance bottlenecks or areas for optimization (e.g., inefficient algorithms, excessive I/O).
    *   Efficient use of resources (memory, CPU, network).
    *   For frontend: rendering performance, bundle size (if inferable), image optimization.

8.  **UI/UX & Design Review (for UI Components - e.g., files like .tsx, .jsx, .vue, .svelte, or .html with associated .css/.js files)**:
    *   **Usability & Intuitiveness**: Is the UI easy to understand and navigate for its target users? Are interactions clear, predictable, and forgiving?
    *   **Accessibility (A11y)**: Check for common accessibility issues. E.g., proper use of semantic HTML, ARIA attributes (or lack thereof), keyboard navigability, sufficient color contrast (if styles are provided or can be inferred), text alternatives for non-text content.
    *   **Visual Design & Aesthetics**: Comments on layout, typography, spacing, color palette, visual hierarchy, and overall consistency. Does it look professional, polished, and appropriate for its purpose?
    *   **Responsiveness**: If CSS/HTML is provided, assess how well the UI adapts to different screen sizes and devices.
    *   **User Flow & Task Completion**: Does the component or set of components facilitate a smooth user journey for its intended purpose? Are there any friction points or unnecessary steps?
    *   **Feedback & Error Handling**: How does the UI provide feedback to the user on their actions? Is error handling clear, helpful, and non-disruptive?

9.  **Specific Suggestions for Improvement**:
    *   Offer concrete, actionable suggestions for how the project could be improved, refactored, or made more robust. Prioritize high-impact changes.
    *   If suggesting code changes, use Markdown code blocks and specify the file path and relevant line numbers if possible.

10. **Dependencies (if package.json, requirements.txt, pom.xml, etc., is provided)**:
    *   Comment on the use of dependencies. Are there many? Are they up-to-date? Any known vulnerable or deprecated packages? (Your knowledge cutoff applies here).

11. **Documentation & Test Coverage (if files like README.md, test files are present)**:
    *   Assess the quality and completeness of external documentation (READMEs, etc.).
    *   Comment on the presence and apparent quality/thoroughness of tests (unit, integration, e2e).

Format your response using Markdown. Use headings for different sections of your review (e.g., ## Architecture, ## UI/UX Feedback for ComponentX.tsx).
Be specific and reference file paths when discussing issues or making suggestions.
If the project structure or specific files are unclear, you may state that.
Consider the interactions between different files and modules.

Start your review with: "Project Review for: [Project Name]"
Followed by the overall summary.
When reviewing UI components, pay special attention to props, state management, event handling, separation of concerns, and how they contribute to the overall user experience and maintainability.`;


export const getProjectReviewFeedback = async (files: ProjectFile[], projectName: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error(
      "Gemini API key is not configured. Please set the API_KEY environment variable."
    );
  }

  if (files.length === 0) {
    // This case should ideally be caught before calling, but as a safeguard:
    throw new Error("No files were provided for review. Please select a project with reviewable files.");
  }

  let combinedContent = `Project Name: ${projectName}\n\n`;
  combinedContent += files.map(file => 
    `--- File Path: ${file.path} ---\n\`\`\`\n${file.content}\n\`\`\`\n--- End of File: ${file.path} ---\n\n`
  ).join('');
  
  const MAX_CONTENT_LENGTH_BYTES = 3_800_000; // Approx 3.8MB, conservative for ~1M tokens (1 token ~4 chars)
  const currentContentLength = new TextEncoder().encode(combinedContent).length;

  if (currentContentLength > MAX_CONTENT_LENGTH_BYTES) {
      const KBRatio = (currentContentLength / (1024)).toFixed(0);
      const LimitKB = (MAX_CONTENT_LENGTH_BYTES / 1024).toFixed(0);
      console.warn(`Project content is very large (${KBRatio} KB). Exceeds limit of ${LimitKB} KB. Review might fail or be incomplete.`);
      // For now, we'll let it try, but a more robust solution would be to truncate or error out here.
      // The API itself might reject it with a 400 error for payload size.
      // For this exercise, we will throw an error to prevent API call with oversized payload.
      throw new Error(
        `The project content (${KBRatio} KB) is too large and exceeds the processing limit of ${LimitKB} KB. ` +
        `Please try with a smaller project or select fewer files.`
      );
  }


  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: combinedContent,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PROJECT,
      }
    });
    
    return response.text;

  } catch (error) {
    console.error("Error fetching project review from Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             throw new Error("Invalid Gemini API Key. Please check your API_KEY environment variable.");
        }
        // Check for payload size errors from the API (often a 400 status)
        if ((error.message.includes("400") || error.message.toLowerCase().includes("bad request")) && 
            (error.message.toLowerCase().includes("payload size") || error.message.toLowerCase().includes("request entity too large"))) {
            throw new Error("The project is too large to be processed by the API. Please try with a smaller selection of files.");
        }
         throw new Error(`Failed to get project review feedback: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching project review feedback.");
  }
};
