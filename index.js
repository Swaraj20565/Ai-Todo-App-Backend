// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Todo from "./models/Todo.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ================== MongoDB Connection ==================
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

// ================== Google Gemini Setup ==================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Safe Gemini call
async function callGemini(prompt) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 200,
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return text || JSON.stringify({ action: "error", parameters: { message: "No output from Gemini" } });
    } catch (err) {
        console.error("❌ Gemini API call failed:", err.message);
        return JSON.stringify({ action: "error", parameters: { message: "Gemini API call failed: " + err.message } });
    }
}

// ================== CRUD Functions ==================
async function getAllTodos() {
    try {
        return await Todo.find().sort({ createdAt: -1 });
    } catch (error) {
        console.error("Error getting todos:", error);
        throw error;
    }
}

async function createTodo(todoText) {
    try {
        const todo = new Todo({ todo: todoText });
        return await todo.save();
    } catch (error) {
        console.error("Error creating todo:", error);
        throw error;
    }
}

async function deleteTodoById(id) {
    try {
        return await Todo.findByIdAndDelete(id);
    } catch (error) {
        console.error("Error deleting todo:", error);
        throw error;
    }
}

async function updateTodoById(id, todoText) {
    try {
        return await Todo.findByIdAndUpdate(
            id,
            { todo: todoText },
            { new: true, runValidators: true }
        );
    } catch (error) {
        console.error("Error updating todo:", error);
        throw error;
    }
}

async function searchTodo(query) {
    try {
        return await Todo.find({ todo: { $regex: query, $options: "i" } });
    } catch (error) {
        console.error("Error searching todos:", error);
        throw error;
    }
}

// ================== Routes ==================

// Health check
app.get("/", (req, res) => res.send("Server running!"));

// Todos CRUD
app.get("/api/todos", async (req, res) => {
    try {
        const todos = await getAllTodos();
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch todos" });
    }
});

app.post("/api/todos", async (req, res) => {
    try {
        const { todo } = req.body;
        if (!todo || todo.trim() === '') {
            return res.status(400).json({ error: "Todo text is required" });
        }

        const newTodo = await createTodo(todo.trim());
        res.status(201).json(newTodo);
    } catch (error) {
        console.error("Create todo error:", error);
        res.status(500).json({ error: "Failed to create todo" });
    }
});

app.get("/api/todos/search", async (req, res) => {
    try {
        const { q } = req.query;
        const todos = await searchTodo(q || "");
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: "Failed to search todos" });
    }
});

app.put("/api/todos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { todo } = req.body;

        if (!todo || todo.trim() === '') {
            return res.status(400).json({ error: "Todo text is required" });
        }

        const updated = await updateTodoById(id, todo.trim());
        if (!updated) return res.status(404).json({ error: "Todo not found" });
        res.json(updated);
    } catch (error) {
        console.error("Update todo error:", error);
        res.status(500).json({ error: "Failed to update todo" });
    }
});

app.delete("/api/todos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await deleteTodoById(id);
        if (!deleted) return res.status(404).json({ error: "Todo not found" });
        res.json({ message: "Todo deleted", todo: deleted });
    } catch (error) {
        console.error("Delete todo error:", error);
        res.status(500).json({ error: "Failed to delete todo" });
    }
});

// Gemini AI endpoint
app.post("/api/gemini", async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const fullPrompt = `
You are an AI To-Do Assistant.
Respond STRICTLY in JSON format with "action" and "parameters".
Do not include any other text.
Valid actions are: "get_all_todos", "create_todo", "update_todo", "delete_todo", "search_todos", or "error".

Example response for creating a todo:
{"action": "create_todo", "parameters": {"todo": "Buy groceries"}}

Example response for searching todos:
{"action": "search_todos", "parameters": {"query": "shopping"}}

User request: ${prompt}
`;

        const response = await callGemini(fullPrompt);

        try {
            const cleanedResponse = response.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanedResponse);
            res.json(parsed);
        } catch (parseError) {
            console.error("Error parsing Gemini response:", parseError, "Response:", response);
            res.json({ action: "error", parameters: { message: "Invalid AI response format" } });
        }
    } catch (error) {
        console.error("Gemini endpoint error:", error);
        res.status(500).json({ error: "Failed to process AI request" });
    }
});

// ================== Start Server ==================
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));