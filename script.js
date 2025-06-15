const chatHistory = [];

const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

// Typing indicator element
const typingIndicator = document.createElement("div");
typingIndicator.classList.add("bot");
typingIndicator.innerHTML = `<div class="dots">
  <span class="dot" style="animation-delay: 0s;">.</span>
  <span class="dot" style="animation-delay: 0.2s;">.</span>
  <span class="dot" style="animation-delay: 0.4s;">.</span>
</div>
`;

// Chatbot greeting after 3 seconds
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    document.getElementById("theme-icon").textContent = "🌞";
  } else {
    document.getElementById("theme-icon").textContent = "🌚";
  }

  showTypingIndicator();
  setTimeout(async () => {
    const welcome = "Welcome, ask me about Rust or Ethereum.";
    const botDiv = document.createElement("div");
    botDiv.classList.add("bot");
    chatBox.appendChild(botDiv);

    removeTypingIndicator();

    for (let i = 0; i < welcome.length; i++) {
      botDiv.textContent += welcome[i];
      await new Promise((r) => setTimeout(r, 30));
    }
    removeTypingIndicator();
  }, 3000);

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const message = input.value.trim();
    if (!message || message.length > 1000) {
      return; // prevent abuse or oversized messages
    }

    appendMessage("user", message);
    chatHistory.push({ role: "user", content: message });
    input.value = "";

    showTypingIndicator();

    const reply = await fetchBotReply(chatHistory);
    chatHistory.push({ role: "assistant", content: reply });
  });
});

function appendMessage(sender, message, extraClass = "") {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(sender);
  if (extraClass) msgDiv.classList.add(extraClass);
  msgDiv.textContent = message;
  chatBox.appendChild(msgDiv);
}

function showTypingIndicator() {
  chatBox.appendChild(typingIndicator);
}

function removeTypingIndicator() {
  if (chatBox.contains(typingIndicator)) {
    chatBox.removeChild(typingIndicator);
  }
}

async function fetchBotReply(messages) {
  try {
    const res = await fetch("https://cbot.ai-everyday817.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullText = "";

    const partialDiv = document.createElement("div");
    partialDiv.classList.add("bot");
    chatBox.appendChild(partialDiv);

    removeTypingIndicator();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split into SSE lines
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep last partial line

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice("data: ".length).trim();

          if (data === "[DONE]") break;

          try {
            const json = JSON.parse(data);
            if (json.response) {
              fullText += json.response;
              partialDiv.textContent = fullText;
            }
          } catch (e) {
            console.error("JSON parse error", e, data);
          }
        }
      }
    }

    return fullText.trim();
  } catch (err) {
    console.error(err);
    return "⚠️ Assistant is unavailable at the moment. will be back within 24 hours or sooner if you get in touch and let me know.";
  }
}

function toggleTheme() {
  document.body.classList.toggle("light-theme");
  const isLight = document.body.classList.contains("light-theme");
  document.getElementById("theme-icon").textContent = isLight ? "🌞" : "🌚";
  localStorage.setItem("theme", isLight ? "light" : "dark");
}
