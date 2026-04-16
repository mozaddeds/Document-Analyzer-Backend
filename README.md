=============================================================================
DOCUMENT ANALYZER - BACKEND DOCUMENTATION
=============================================================================

PROJECT OVERVIEW
----------------
A NestJS REST API that receives PDF files, processes them using Google's 
Gemini AI API, and returns structured summaries. Handles file uploads via 
Multer and provides CORS support for frontend integration.

PROJECT LIVE LINK: [Document Analyzer Backend](https://document-analyzer-backend-lb95.onrender.com)

TECH STACK
----------
- Framework: NestJS 10+
- Language: TypeScript
- Runtime: Node.js 18+
- File Upload: Multer (via @nestjs/platform-express)
- AI Integration: Google Generative AI (@google/genai)
- Configuration: @nestjs/config (dotenv)

FILE STRUCTURE
--------------
src/
├── main.ts                     # Application entry point, CORS config
├── app.module.ts               # Root module
├── app.controller.ts           # Root controller (health check)
├── app.service.ts              # Root service
│
├── analyzer/
│   ├── analyzer.module.ts      # Analyzer module definition
│   ├── analyzer.controller.ts  # HTTP endpoint for file upload
│   └── analyzer.service.ts     # Business logic coordinator
│
├── gemini/
│   ├── gemini.module.ts        # Gemini module definition
│   ├── gemini.controller.ts    # Gemini endpoints (currently unused)
│   └── gemini.service.ts       # Gemini API integration logic
│
└── libs/
    └── types.ts                # Shared type definitions

CORE MODULES
------------

1. Analyzer Module
   Purpose: Receives file uploads and coordinates analysis
   
   Dependencies:
   - GeminiService (injected)
   
   Exports:
   - AnalyzerService (for potential use in other modules)

2. Gemini Module
   Purpose: Handles communication with Google's Gemini AI API
   
   Exports:
   - GeminiService (used by AnalyzerModule)

3. App Module
   Purpose: Root module, imports all feature modules
   
   Imports:
   - ConfigModule (global, loads .env)
   - AnalyzerModule
   - GeminiModule

APPLICATION ENTRY POINT
-----------------------
File: src/main.ts

Bootstrap Flow:
1. Create NestJS application
2. Enable CORS with specific origin
3. Start listening on port 8000
4. Log server URL to console

CORS Configuration:
- Origin: http://localhost:3000 (Next.js frontend)
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization
- Credentials: true

Why CORS?
- Frontend (localhost:3000) and backend (localhost:8000) are different origins
- Browser blocks cross-origin requests without CORS headers
- CORS headers tell browser to allow the request

ANALYZER CONTROLLER
-------------------
File: src/analyzer/analyzer.controller.ts

Endpoint: POST /analyzer

Decorators Used:
- @Controller('analyzer'): Sets base route
- @Post(): Handles POST requests
- @UseInterceptors(FileInterceptor('file')): Enables file upload
- @UploadedFile(): Injects uploaded file

Request Flow:
1. Frontend sends multipart/form-data with file
2. Multer intercepts request, extracts file
3. File becomes Express.Multer.File object
4. Controller validates file exists
5. Calls AnalyzerService.analyzeFile()
6. Returns structured response

Response Format:
Success:
{
  "success": true,
  "data": {
    "summary": { ... },
    "fileName": "document.pdf",
    "fileSize": 108106,
    "fileType": "application/pdf",
    "analyzedAt": "2026-04-06T10:57:20.405Z"
  }
}

Error:
{
  "success": false,
  "message": "Error description",
  "error": true
}

Why This Format?
- success field: Frontend can quickly check status
- Consistent structure: Easy to parse
- Nested data: Keeps metadata separate from summary

FILE UPLOAD MECHANICS
----------------------
Library: Multer (via @nestjs/platform-express)

How It Works:
1. Client sends multipart/form-data request
2. Multer parses request body
3. Extracts file from form field named 'file'
4. Creates Express.Multer.File object

Express.Multer.File Properties:
- fieldname: 'file' (form field name)
- originalname: 'resume.pdf' (client filename)
- encoding: '7bit' (transfer encoding)
- mimetype: 'application/pdf' (MIME type)
- size: 108106 (bytes)
- buffer: Buffer (file contents in memory)

Storage Mode:
- Memory storage (default)
- File not saved to disk
- Entire file in buffer
- Suitable for small files (< 10MB)

Alternative: Disk storage
- Would save to /uploads directory
- Better for large files
- Requires cleanup logic

ANALYZER SERVICE
----------------
File: src/analyzer/analyzer.service.ts

Purpose: Coordinates file analysis workflow

Dependencies:
- GeminiService (injected via constructor)

Method: analyzeFile(file: Express.Multer.File)

Flow:
1. Receives file object from controller
2. Calls geminiService.connectGemini(file)
3. Waits for AI response
4. Structures response with metadata
5. Returns to controller

Error Handling:
- try-catch block
- Rethrows with descriptive message
- Controller catches and formats for frontend

Return Structure:
{
  summary: { title, summary, keyPoints, mainTopics },
  fileName: string,
  fileSize: number,
  fileType: string,
  analyzedAt: ISO timestamp
}

GEMINI SERVICE
--------------
File: src/gemini/gemini.service.ts

Purpose: Integrates with Google Gemini AI API

Environment Variable:
- GEMINI_API_KEY (required)

Method: connectGemini(file: Express.Multer.File)

Step-by-Step Process:

1. Validate API Key
   - Check process.env.GEMINI_API_KEY
   - Throw error if missing
   - Prevents silent failures

2. Initialize Gemini Client
   - Create GoogleGenAI instance
   - Pass API key
   - Ready for requests

3. Convert File to Base64
   - file.buffer.toString('base64')
   - Why? Gemini accepts base64-encoded PDFs
   - Binary data → text representation

4. Create Prompt
   - Structured JSON format request
   - Clear instructions for AI
   - Limits: 150 words total
   
   Prompt Breakdown:
   - Role: "Summarize this document"
   - Format: Explicit JSON schema
   - Rules: No markdown, concise
   - Example structure provided

5. Send Request to Gemini
   - Model: gemini-3-flash-preview
   - Contents: [prompt, PDF data]
   - Await response

6. Clean Response
   - Remove markdown code blocks (```json)
   - Trim whitespace
   - Prepare for parsing

7. Parse JSON
   - Try JSON.parse()
   - If fails: Create fallback structure
   - Never crash on bad AI output

8. Return Structured Data
   - text: Parsed JSON object
   - timestamp: ISO string

Why Base64 Encoding?
- JSON cannot contain binary data
- Base64 converts binary → ASCII text
- Gemini API expects this format
- Standard approach for file transmission in JSON APIs

Error Handling Strategy:
- API key missing: Throw immediately
- Empty response: Throw error
- JSON parse fail: Return fallback
- Network error: Propagate to caller
- All errors logged to console

Fallback Structure:
{
  title: "Summary",
  summary: "<first 200 chars of response>",
  keyPoints: [],
  mainTopics: []
}

Why Fallback?
- Prevents crashes when AI returns unexpected format
- Degrades gracefully
- User still gets *something* useful

GEMINI API MODEL SELECTION
---------------------------
Current: gemini-3-flash-preview

Why This Model?
- Fast response times (< 5 seconds typical)
- Free tier: 15 requests/minute
- Handles PDF files natively
- Good at structured output

Alternatives:
- gemini-1.5-flash: Stable version, similar performance
- gemini-1.5-pro: Better quality, slower, more expensive

Cost Comparison (approximate):
- gemini-3-flash-preview: $0.075 per 1M input tokens
- Typical PDF resume: ~1000 tokens
- 1000 resumes: ~$0.075

Free Tier Limits:
- 15 requests per minute
- 1 million tokens per day
- 1500 requests per day
- Sufficient for demo/portfolio use

DEPENDENCY INJECTION FLOW
--------------------------
NestJS uses Inversion of Control (IoC)

Example: How AnalyzerService gets GeminiService

1. GeminiModule declares GeminiService as provider
2. AnalyzerModule imports GeminiService in providers array
3. AnalyzerService constructor requests GeminiService
4. NestJS creates GeminiService instance (singleton)
5. Injects into AnalyzerService constructor
6. AnalyzerService can now call geminiService.connectGemini()

Benefits:
- Loose coupling
- Easy testing (can inject mocks)
- Single responsibility principle
- Framework handles lifecycle

DATA FLOW VISUALIZATION
------------------------
Client Upload
    ↓
POST /analyzer (AnalyzerController)
    ↓
FileInterceptor extracts file
    ↓
AnalyzerController.uploadFile()
    ↓
Validates file exists
    ↓
AnalyzerService.analyzeFile(file)
    ↓
GeminiService.connectGemini(file)
    ↓
Convert file.buffer → base64
    ↓
Send to Gemini API
    ↓
Receive AI response
    ↓
Clean & parse JSON
    ↓
Return to AnalyzerService
    ↓
Add metadata (filename, size, timestamp)
    ↓
Return to AnalyzerController
    ↓
Format response { success, data }
    ↓
Send JSON to client

ENVIRONMENT CONFIGURATION
--------------------------
File: .env (not in version control)

Required Variables:
GEMINI_API_KEY=your_api_key_here
PORT=8000

How to Get API Key:
1. Go to https://aistudio.google.com
2. Sign in with Google account
3. Click "Get API Key"
4. Copy key to .env file

ConfigModule Setup:
- Imported in AppModule
- isGlobal: true (available everywhere)
- Loads .env automatically
- Access via process.env.VARIABLE_NAME

ERROR HANDLING PATTERNS
------------------------

Pattern 1: Controller Level
- try-catch around service call
- Returns { success: false, message, error: true }
- HTTP 200 status (handled by frontend)

Pattern 2: Service Level
- try-catch around external calls
- Throws Error with descriptive message
- Controller catches and formats

Pattern 3: Gemini Service Level
- Validates inputs first (API key)
- try-catch around API call
- Fallback on JSON parse failure
- Logs all errors to console

Why This Approach?
- Each layer handles its concerns
- Errors bubble up with context
- Frontend gets consistent format
- Server logs show full error details

LOGGING STRATEGY
-----------------
Current: console.log statements

Locations:
1. main.ts: Server startup
2. gemini.service.ts: Parsed responses, errors
3. analyzer.service.ts: Could add more

Production Recommendations:
- Replace console.log with proper logger (Winston, Pino)
- Add request IDs for tracing
- Log to file + external service (Datadog, LogRocket)
- Different log levels (debug, info, warn, error)

PERFORMANCE CONSIDERATIONS
---------------------------

1. File Upload Performance
   - Multer stores in memory (fast for small files)
   - Trade-off: Large files use more RAM
   - Mitigation: Frontend validates max 10MB

2. Gemini API Performance
   - Typical response: 2-5 seconds
   - Depends on: File size, API load
   - No caching currently
   - Could add: Result caching by file hash

3. Concurrency
   - NestJS handles concurrent requests
   - Each request gets own file buffer
   - Gemini API has rate limits (15/min)
   - Could add: Queue system for high traffic

SECURITY CONSIDERATIONS
------------------------

Current Security Measures:
1. CORS restricts origins
2. File type validation (mimetype check)
3. No file persistence (deleted after processing)
4. API key in environment variable
5. No database (no injection attacks)

Security Gaps:
1. No authentication
   - Anyone with URL can use service
   - No rate limiting per user
   - Could add: JWT auth, API keys

2. No input sanitization
   - Trusts file.mimetype from client
   - Could spoof file type
   - Could add: Magic byte verification

3. No request size limit
   - Multer accepts any size
   - Could DoS with huge files
   - Fixed: Frontend validates, should add backend limit

4. API key exposure risk
   - Stored in .env (good)
   - Could be logged accidentally
   - Should add: Secret management service

5. No HTTPS in development
   - Localhost uses HTTP
   - Production MUST use HTTPS

TESTING STRATEGIES
-------------------

Manual Testing:
1. Upload valid PDF → Check success response
2. Upload without file → Check error response
3. Upload 11MB file → Check frontend rejects
4. Remove GEMINI_API_KEY → Check error handling
5. Send malformed request → Check graceful failure

Unit Testing (recommended):
- Test GeminiService.connectGemini with mock API
- Test AnalyzerService with mock GeminiService
- Test AnalyzerController with mock AnalyzerService

Integration Testing (recommended):
- Test full flow with real API (use test key)
- Verify response structure
- Test error scenarios

End-to-End Testing:
- Use frontend to upload file
- Verify backend processes correctly
- Check database (if added)

DEBUGGING CHECKLIST
-------------------
Issue: "Upload fails silently"
[ ] Check backend terminal for errors
[ ] Verify CORS headers in browser Network tab
[ ] Check GEMINI_API_KEY is set
[ ] Test endpoint with curl/Postman
[ ] Check Multer is installed

Issue: "Invalid JSON response"
[ ] Check backend returns data
[ ] Verify JSON structure matches frontend expectations
[ ] Test Gemini API separately
[ ] Check for console.log output

Issue: "Gemini API error"
[ ] Verify API key is valid
[ ] Check rate limits not exceeded
[ ] Test with smaller file
[ ] Check internet connection

DEPLOYMENT
----------

Local Development:
1. Install dependencies: npm install
2. Create .env file with GEMINI_API_KEY
3. Run: npm run start:dev
4. Access: http://localhost:8000

Production Deployment:
1. Build: npm run build
2. Set environment variables in hosting platform
3. Start: npm run start:prod
4. Use HTTPS reverse proxy (nginx, Caddy)

Recommended Platforms:
- Railway.app (easy NestJS deployment)
- Render.com (free tier available)
- AWS Elastic Beanstalk
- Google Cloud Run
- DigitalOcean App Platform

Environment Variables in Production:
- GEMINI_API_KEY: From Google AI Studio
- PORT: Usually set by platform
- NODE_ENV: production
- CORS_ORIGIN: Your frontend URL

Pre-Deployment Checklist:
[ ] Replace hardcoded CORS origin with env variable
[ ] Add Helmet.js for security headers
[ ] Add rate limiting (express-rate-limit)
[ ] Set up logging service
[ ] Add health check endpoint
[ ] Configure file upload limits
[ ] Test with production API key
[ ] Set up monitoring/alerts

KNOWN LIMITATIONS
-----------------
1. No persistence
   - Analysis results not saved
   - No user history
   - Could add: Database integration

2. No job queue
   - Long-running analyses block request
   - Could add: Bull, BullMQ for async processing

3. No file validation
   - Trusts mimetype from client
   - Could add: Magic byte checking

4. No result caching
   - Same file analyzed multiple times = wasted API calls
   - Could add: Redis cache by file hash

5. No streaming responses
   - Frontend waits for entire response
   - Could add: Server-Sent Events for progress

FUTURE ENHANCEMENTS
-------------------
1. Authentication & user accounts
2. Database integration (PostgreSQL)
3. Result caching (Redis)
4. Job queue for async processing
5. Webhook support for long analyses
6. Multiple AI provider support (OpenAI, Claude)
7. Batch processing endpoint
8. File storage (S3, GCS) for later retrieval
9. Analytics endpoint (usage stats)
10. Admin dashboard

MONITORING & MAINTENANCE
-------------------------

Recommended Monitoring:
1. Uptime checks (UptimeRobot, Pingdom)
2. Error tracking (Sentry)
3. Performance monitoring (New Relic, Datadog)
4. Log aggregation (Loggly, Papertrail)

Health Check Endpoint:
Add GET /health that returns:
{
  status: 'ok',
  gemini: 'connected',
  uptime: process.uptime()
}

Alerts to Set Up:
- API response time > 10 seconds
- Error rate > 5%
- Memory usage > 80%
- Disk space < 20%
- SSL certificate expiring

Maintenance Tasks:
- Weekly: Review error logs
- Monthly: Update dependencies (npm audit fix)
- Quarterly: Review API usage costs
- Yearly: Rotate API keys

COST ESTIMATION
---------------
Gemini API Costs (Current Usage):
- Free tier: 15 req/min, 1M tokens/day
- Typical resume: ~1000 tokens
- Daily limit: ~1000 analyses

Paid Tier (if needed):
- $0.075 per 1M input tokens
- 10,000 resumes/month = $0.75
- Negligible for portfolio/demo use

Infrastructure Costs:
- Development: $0 (localhost)
- Production (minimal):
  - Railway/Render free tier: $0
  - Custom domain: ~$12/year
  - SSL: $0 (Let's Encrypt)
  
Total Monthly Cost (low traffic): $0-5

=============================================================================