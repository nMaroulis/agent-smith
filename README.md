# AgentSmith

[![Python](https://img.shields.io/badge/python-v3.13-yellow)]()
[![FastAPI](https://img.shields.io/badge/fastapi-v0.116.1-purple)]()
[![langgraph](https://img.shields.io/badge/langgraph-v0.5.4-lightgrey)]()
[![langchain](https://img.shields.io/badge/langchain-v0.3.26-green)]()
[![Llama-CPP](https://img.shields.io/badge/llama_cpp-v0.3.14-black)]()
[![React](https://img.shields.io/badge/react-v19.1-blue)]()

**AgentSmith** is a developer-first, visual framework for building, testing, and exporting **LangGraph-based AI agents**.

Design intelligent workflows using a drag-and-drop interface, describe flows in natural language, define custom state/message schemas, and generate full **runnable Python code**. Whether you're using OpenAI, LLaMA, or your own tools, AgentSmith helps you go from **idea → graph → working agent** in seconds.

> _“Your agent. Your logic. Your code.”_

---

## ✨ Features

- 🧩 **Drag & Drop Agent Builder**  
  Design nodes, edges, and async flows using a canvas powered by React Flow.

- 🧠 **Typed State Definition (LangGraph-native)**  
  Visually define `TypedDict`-based agent state and message schemas.

- 🚀 **Python / LangGraph Code Export**  
  Export your agent as a standalone Python module using LangGraph. Then just copy paste the code that works out of the box.

- 🧬 **Per-Node Code Editing**  
  Modify each node’s logic directly in a Monaco (VSCode-style) editor.

- 🔌 **Modular LLM Backend**  
  Built-in support for OpenAI, Anthropic, Hugging Face Transformers, and **local LLMs**, currently **Llama.cpp** (more to come...).

- 🛠️ **Custom Tool Creation**  
  Define and reuse tools via code or natural language.

- 🤖 **Chatbot**  
  Test your LLMs in a built-in chat interface with debig options and parameter tuning.

- 🧬 **LLM Fine-Tuning**  
  Fine-tune your LLMs on your own datasets using a built-in interface.

---

## 💡 Why AgentSmith?

AgentSmith is built for developers and advanced users who want:
- ✅ Real state management via LangGraph
- ✅ Full Python code and version control
- ✅ Pluggable local/remote LLMs
- ✅ Automated structured LLM outputs for models that do not support it (Llama.cpp etc.) by integrating [outlines](https://github.com/dottxt-ai/outlines)
- ✅ Typed agent state, message schema, and input/output mapping


---

## 🛠️ Tech Stack

| Layer        | Tech Stack                                      |
|--------------|--------------------------------------------------|
| **Frontend** | React + React Flow + TailwindCSS + Monaco Editor |
| **Backend**  | Python + FastAPI + LangChain + LangGraph         |
| **LLM APIs**     | OpenAI, Anthropic, HuggingFace, Llama.cpp        |
| **Local LLMs**     | OpenAI, Anthropic, HuggingFace, Llama.cpp        |
| **Storage**  | SQLite / TinyDB / Local JSON                     |

---

## 📦 Coming Soon

- 🔍 Flow testing with input/output tracing  
- 💾 Flow versioning & Git-based exports  
- 🧰 Tool and flow marketplace  
- 🧪 Integrated local model benchmarking  
- ☁️ Cloud sync & deploy  

---

## 🏗️ Architecture

<div align="center">
  <img src="https://raw.githubusercontent.com/nMaroulis/agent-smith/refs/heads/main/assets/architecture.png">
</div>

---

## 📸 Screenshots

> Coming soon: animated walkthroughs of building agents, customizing state, and exporting LangGraph code.

---

## 🚀 Quickstart

> Full instructions will be added soon — includes local dev, docker setup, and example flows.

```bash
$ git clone https://github.com/nMaroulis/agent-smith
$ cd agent-smith

# Backend
$ cd backend
$ uv venv .venv
$ source .venv/bin/activate
$ uv pip install -r requirements.txt
$ python main.py

# Frontend
$ cd frontend
$ npm install
$ npm run dev
```

## 🤝 Contributing
I welcome contributions, ideas, and extensions. AgentSmith is modular by design — whether you’re adding a new LLM provider or a UI feature, I’d love your input.


## 📄 License
MIT — free for personal and commercial use.
