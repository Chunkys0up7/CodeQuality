
import React, { ChangeEvent, useCallback, useState, useRef } from 'react';

export interface ProjectFile {
  path: string;
  content: string;
}

interface ProjectInputProps {
  onFilesSelected: (files: ProjectFile[], folderName: string | null) => void;
  disabled?: boolean;
}

// More specific list of text-based code/config files.
// Prioritize common types and explicitly exclude binary-like extensions later.
const ALLOWED_EXTENSIONS_AND_FILENAMES = [
  // JavaScript / TypeScript
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  'package.json', 'tsconfig.json', 'jsconfig.json', 
  '.eslintrc.json', '.prettierrc.json', '.babelrc.json',
  // HTML / CSS
  '.html', '.htm', '.css', '.scss', '.sass', '.less', '.styl',
  // Python
  '.py', 'requirements.txt', 'Pipfile', 'pyproject.toml', '.python-version',
  // Java / Kotlin / Scala / Groovy
  '.java', '.kt', '.kts', '.scala', '.groovy',
  'pom.xml', 'build.gradle', 'build.gradle.kts', 'settings.gradle',
  // Ruby
  '.rb', 'Gemfile', 'Rakefile', '.ruby-version',
  // PHP
  '.php', 'composer.json',
  // Go
  '.go', 'go.mod', 'go.sum',
  // Rust
  '.rs', 'Cargo.toml', 'Cargo.lock', // Cargo.lock is text, might be large but useful context
  // C / C++
  '.c', '.cpp', '.h', '.hpp', 'Makefile', 'CMakeLists.txt',
  // Swift / Objective-C
  '.swift', '.m', '.h', // .h is shared
  // Shell / Docker / Config
  '.sh', '.bash', '.zsh', 'Dockerfile', 'docker-compose.yml', '.yml', '.yaml', '.json', // .json is generic
  '.xml', '.ini', '.toml', '.conf', '.cfg', '.properties',
  // Markdown / Text
  '.md', '.txt', '.rst',
  // SQL
  '.sql',
  // WebAssembly Text Format
  '.wat',
  // Frontend Frameworks
  '.vue', '.svelte',
  // Others
  '.gitignore', '.gitattributes', '.editorconfig', 'LICENSE', 'README' // Allow README without extension
];

const IGNORED_PATTERNS = [
  // Version control
  '/.git/',
  // Node modules
  '/node_modules/',
  // Python virtual environments
  '/venv/', '/.venv/', '/env/', '/.env/', // .env files might be sensitive, good to ignore by default for a general tool
  // Python caches
  '/__pycache__/', '/.pytest_cache/', '/.mypy_cache/',
  // Build outputs
  '/dist/', '/build/', '/out/', '/target/', '/bin/',
  // IDE / Editor specific
  '/.vscode/', '/.idea/', '/.project/', '/.classpath/', '/.settings/',
  // OS specific
  '.DS_Store', 'Thumbs.db',
  // Log files
  '*.log',
  // Lock files (can be very large and change often, sometimes less useful for static review)
  // 'package-lock.json', 'yarn.lock', 'composer.lock', 'Gemfile.lock', // Reconsidering: these can be useful.
  // Archives / Compressed
  '*.zip', '*.tar', '*.gz', '*.rar', '*.7z',
  // Compiled / Binary
  '*.exe', '*.dll', '*.so', '*.o', '*.a', '*.lib', '*.class', '*.pyc', '*.pyo', '*.wasm',
  // Media files
  '*.png', '*.jpg', '*.jpeg', '*.gif', '*.bmp', '*.tiff', '*.ico', '*.webp',
  '*.mp3', '*.wav', '.ogg', '*.mp4', '*.mov', '*.avi', '*.webm', '*.flv',
  '*.pdf', '*.doc', '*.docx', '*.ppt', '*.pptx', '*.xls', '*.xlsx',
  '*.dmg', '*.iso', '*.img',
  // Fonts
  '*.woff', '*.woff2', '*.ttf', '*.otf', '*.eot',
  // Database files
  '*.sqlite', '*.db', '*.mdb',
  // Large data files
  '*.csv', // Can be very large, user should be mindful
  // Temporary files
  '*.tmp', '*.temp', '*.swp', '*.swo',
];

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB per file limit (generous for text files)
const MAX_TOTAL_FILES = 500; // Safety limit for number of files to process

const matchesPattern = (path: string, pattern: string): boolean => {
  if (pattern.startsWith('/') && pattern.endsWith('/')) { // Directory pattern like /node_modules/
    return `/${path}/`.includes(pattern);
  }
  if (pattern.startsWith('*.')) { // Extension pattern like *.log
    return path.toLowerCase().endsWith(pattern.substring(1).toLowerCase());
  }
  return path.toLowerCase().endsWith(pattern.toLowerCase()); // Exact file name or simple suffix
};

const shouldIgnoreFile = (filePath: string, fileSize: number): { ignore: boolean, reason?: string } => {
  const normalizedFilePath = filePath.replace(/\\/g, '/'); // Normalize path separators

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return { ignore: true, reason: `File size ${Math.round(fileSize / (1024*1024))}MB > ${Math.round(MAX_FILE_SIZE_BYTES / (1024*1024))}MB limit`};
  }

  for (const pattern of IGNORED_PATTERNS) {
    if (matchesPattern(normalizedFilePath, pattern)) {
      return { ignore: true, reason: `Matches ignore pattern: ${pattern}` };
    }
  }
  
  const BARE_FILENAME = normalizedFilePath.includes('/') ? normalizedFilePath.substring(normalizedFilePath.lastIndexOf('/') + 1) : normalizedFilePath;
  const EXTENSION = BARE_FILENAME.includes('.') ? BARE_FILENAME.substring(BARE_FILENAME.lastIndexOf('.')).toLowerCase() : '';

  if (ALLOWED_EXTENSIONS_AND_FILENAMES.includes(BARE_FILENAME) || ALLOWED_EXTENSIONS_AND_FILENAMES.includes(EXTENSION)) {
    return { ignore: false };
  }
  
  // If no extension and not explicitly allowed as a bare filename (like 'Dockerfile')
  if (!EXTENSION && !ALLOWED_EXTENSIONS_AND_FILENAMES.includes(BARE_FILENAME)) {
     return { ignore: true, reason: `No extension and '${BARE_FILENAME}' not in allowed filenames list` };
  }
  // If has an extension but it's not in the allowed list
  if (EXTENSION && !ALLOWED_EXTENSIONS_AND_FILENAMES.includes(EXTENSION)) {
     return { ignore: true, reason: `Extension '${EXTENSION}' not in allowed list` };
  }

  return { ignore: false }; // Default to not ignoring if not caught by above rules
};


export const ProjectInput: React.FC<ProjectInputProps> = ({ onFilesSelected, disabled }) => {
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const [fileSummary, setFileSummary] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const htmlFiles = event.target.files;
    if (!htmlFiles || htmlFiles.length === 0) {
      setSelectedFolderName(null);
      setFileSummary('');
      onFilesSelected([], null);
      setError(null);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setFileSummary('Processing files...');
    const projectFiles: ProjectFile[] = [];
    let folderName: string | null = null;

    if (htmlFiles[0].webkitRelativePath) {
      folderName = htmlFiles[0].webkitRelativePath.split('/')[0];
    } else {
      folderName = "Selected_Files"; 
    }
    setSelectedFolderName(folderName);

    const filesToProcess = Array.from(htmlFiles).slice(0, MAX_TOTAL_FILES); // Limit total files
    if (htmlFiles.length > MAX_TOTAL_FILES) {
        console.warn(`Too many files selected (${htmlFiles.length}). Processing the first ${MAX_TOTAL_FILES}.`);
        setError(`Processing the first ${MAX_TOTAL_FILES} files out of ${htmlFiles.length}. Some files were ignored.`);
    }

    let processedFileCount = 0;
    let skippedFileCount = 0;
    const skippedReasons: Record<string, number> = {};

    for (const file of filesToProcess) {
      const filePath = file.webkitRelativePath || file.name;
      const { ignore, reason } = shouldIgnoreFile(filePath, file.size);

      if (ignore) {
        skippedFileCount++;
        if(reason) skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
        // console.log(`Skipping: ${filePath} (Reason: ${reason || 'N/A'})`);
        continue;
      }
      
      try {
        const content = await file.text();
        projectFiles.push({ path: filePath, content });
        processedFileCount++;
      } catch (e) {
        console.error(`Could not read file ${filePath} as text:`, e);
        skippedFileCount++;
        const skipReason = `Could not read as text (binary?)`;
        skippedReasons[skipReason] = (skippedReasons[skipReason] || 0) + 1;
      }
    }
    
    onFilesSelected(projectFiles, folderName);
    setIsProcessing(false);

    let summary = `${processedFileCount} file(s) collected.`;
    if (skippedFileCount > 0) {
      summary += ` ${skippedFileCount} file(s) skipped.`;
      // console.log("Skipped file reasons:", skippedReasons);
    }
    setFileSummary(summary);

    if (projectFiles.length === 0 && filesToProcess.length > 0) {
        setError("No reviewable files found. Check file types or ignored patterns.");
        if (Object.keys(skippedReasons).length > 0) {
          console.warn("Reasons for skipping all files:", skippedReasons);
        }
    } else if (projectFiles.length === 0 && filesToProcess.length === 0) {
        setError("No files selected or folder is empty.");
    }


  }, [onFilesSelected]);

  const triggerFileInput = () => {
    // Reset file input value to allow selecting the same folder again if needed after changes
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <label htmlFor="projectInputTrigger" className="block text-sm font-medium text-slate-300 mb-1">
        Select Project Folder for Review
      </label>
      <input
        id="projectInputNative" // Different ID for the native input
        type="file"
        // @ts-ignore webkitdirectory is not in standard TS lib DOM for input type file but works in browsers
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFileChange}
        className="hidden" 
        ref={fileInputRef}
        disabled={disabled || isProcessing}
        aria-hidden="true" 
      />
      <button
        type="button"
        id="projectInputTrigger" // ID for the button
        onClick={triggerFileInput}
        disabled={disabled || isProcessing}
        className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        aria-label="Select project folder for code review"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
        </svg>
        <span>{isProcessing ? 'Processing...' : (selectedFolderName ? `Folder: ${selectedFolderName}` : 'Choose Project Folder')}</span>
      </button>
      {fileSummary && !isProcessing && <p className="text-sm text-slate-400 mt-1">{fileSummary}</p>}
      {error && <p className="text-sm text-red-400 mt-1" role="alert">{error}</p>}
       <p className="text-xs text-slate-500 mt-1">
        Selects common code/text files. Ignores 'node_modules', '.git', binaries, large files (max {MAX_FILE_SIZE_BYTES/(1024*1024)}MB/file, {MAX_TOTAL_FILES} total files).
      </p>
    </div>
  );
};
