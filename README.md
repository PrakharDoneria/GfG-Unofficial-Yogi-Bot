# 🧘‍♂️ Unofficial Yogi Bot

Yogi Bot is a premium, AI-powered coding companion designed to help developers and students navigate technical concepts, DSA, and computer science fundamentals. Built with a sleek interface inspired by **GeeksforGeeks**, it leverages **Sarvam AI** for high-performance reasoning and fast responses.

![Yogi Bot Banner](https://img.shields.io/badge/Unofficial-Yogi--Bot-2F8D46?style=for-the-badge&logo=geeksforgeeks&logoColor=white)

---

## ✨ Key Features

- **🚀 Dual Modes**:
  - **⚡ Fast Mode**: Instant responses for quick syntax checks and simple definitions (using Sarvam-M).
  - **🧠 Reasoning Mode**: Deep, thoughtful analysis for complex logic and system design (using Sarvam-30B).
- **🧠 Contextual Memory**: Remembers previous messages in the conversation for seamless follow-up questions.
- **🔗 GfG Resource Integration**: Automatically suggests relevant GeeksforGeeks articles based on your questions.
- **🔖 Local Bookmarks & History**: Save your favorite resources and access your chat history directly in the browser.
- **📱 Premium Responsive Design**: A fully modular, glassmorphism-inspired UI that works perfectly on Desktop and Mobile.
- **🧘‍♂️ Animated Mascot**: Features a calming, randomly blinking Yogi mascot to accompany your coding journey.

---

## 🛠️ Technology Stack

- **Backend**: Python, Flask
- **AI Engine**: Sarvam AI API
- **Frontend**: Vanilla JS (ES6 Modules), CSS3 (Custom Properties), HTML5
- **Icons/Fonts**: Google Fonts (Outfit, Inter), Lucide-inspired SVGs
- **Deployment**: Optimized for Docker & Google Cloud Run

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- A [Sarvam AI](https://sarvam.ai/) API Key

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/PrakharDoneria/GfG-Unofficial-Yogi-Bot
   cd yogi-bot
   ```

2. **Set up a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```env
   SARVAM_API_KEY=your_api_key_here
   ```

5. **Run the application**:
   ```bash
   python app.py
   ```
   Visit `http://localhost:5000` in your browser.

---

## 🐳 Docker & Cloud Deployment

### Build Locally
```bash
docker build -t yogi-bot .
docker run -p 8080:8080 -e PORT=8080 -e SARVAM_API_KEY=your_key yogi-bot
```

### Deploy to Google Cloud Run
1. **Submit to Container Registry**:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/yogi-bot
   ```
2. **Deploy**:
   ```bash
   gcloud run deploy yogi-bot --image gcr.io/YOUR_PROJECT_ID/yogi-bot --platform managed --set-env-vars="SARVAM_API_KEY=your_key"
   ```

---

## 📁 Project Structure

```text
├── app.py              # Main Flask application & routes
├── config.py           # Configuration & environment variables
├── services.py         # Sarvam AI & GfG Search logic
├── templates/          # HTML templates
│   └── index.html      # Primary UI
├── static/
│   ├── css/            # Premium styling (style.css)
│   └── js/             # Modular JS (chat.js, ui.js, bookmarks.js, history.js)
├── Dockerfile          # Production container config
└── requirements.txt    # Python dependencies
```

---

## 👨‍💻 Credits & Story

Unofficial Yogi Bot was created by **[Prakhar Doneria](https://github.com/PrakharDoneria)**.

This project was developed during a **Community Internship at GeeksforGeeks**, born out of a desire to create a more integrated, AI-driven learning experience for the GfG community. While unofficial, it strives to maintain the spirit of excellence and knowledge sharing that GfG represents.

---

## 📜 License

This project is for educational and personal use. GeeksforGeeks and the GfG logo are trademarks of GeeksforGeeks.
