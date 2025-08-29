📝 AI-ToDo Assistant
An AI-powered To-Do application that uses Google Gemini AI to understand natural language requests and convert them into structured JSON actions.

🚀 Features
    1. Take user input (prompt) in plain English.
    2. Build a full prompt with rules for Gemini.
    3. Call the Gemini AI model with API Key authentication.

⚙️ Receive JSON response with actions:
    1. get_all_todos
    2. create_todo
    3. update_todo
    4. delete_todo
    5. search_todos

Send the structured response back to the frontend.

🔧 Tech Stack
    1. Backend: Node.js, Express.js
    2. AI: Google Gemini AI (@google/generative-ai)
    3. Database: MongoDB (for storing todos)
    4. Frontend: React.js (or any UI consuming the API)

⚙️ How It Works
    1.Take input (prompt) from the user
    Example: "Add buy milk to my list"

   2. Build full prompt with instructions
      - Call Gemini model
      - Initialize the Gemini model using API key
      - Send the full prompt as input
      - Receive structured response
   3. Process response
      - Extract action and parameters
      - Perform database operations (create, update, delete, search)
   4. Send response to frontend
      - Frontend consumes the JSON and updates UI accordingly

📂 Project Structure
AI-ToDo/
├── backend/
│   ├── server.js        # Express server setup
│   └── .env             # API keys & configs
├── frontend/
│   ├── src/
│   │   ├── App.js       # React entry point
└── README.md

🔑 Example API Endpoint
1. const { prompt } = req.body;
2. const fullPrompt = " ";
3. const result = await model.generateContent(fullPrompt);
4. const response = result.response;
5. const text = response.text ? await response.text() : response.output_text || "";
6.  res.json({ output: text || { action: "error", parameters: { message: "No output from Gemini" } } });

📖 Example Prompts
User: "Show me all my todos"
Response: { "action": "get_all_todos", "parameters": {} }

📖 Example Prompts
User: "Add Buy groceries to my list"
{ "action": "create_todo", "parameters": { "todo": "Buy groceries" } }

📖 Example Prompts
User: "Search todos for shopping"
Response: { "action": "search_todos", "parameters": { "query": "shopping" } }

⚡ Setup
1. Run backend
nodemon server.js

