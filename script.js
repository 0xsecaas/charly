const chatHistory = [];

const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

const typingIndicator = document.createElement("div");
typingIndicator.classList.add("bot");
typingIndicator.innerHTML = `<div class="dots">
  <span class="dot" style="animation-delay: 0s;">.</span>
  <span class="dot" style="animation-delay: 0.2s;">.</span>
  <span class="dot" style="animation-delay: 0.4s;">.</span>
</div>
`;

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    document.getElementById("theme-icon").textContent = "🌞";
  } else {
    document.getElementById("theme-icon").textContent = "🌚";
  }

  // Blur overlay logic
  const blurOverlay = document.getElementById("chat-blur-overlay");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("user-input");
  chatForm.style.pointerEvents = "none";
  chatInput.blur();

  function showGreeting() {
    showTypingIndicator();
    setTimeout(async () => {
      const welcome =
        "Hi, I’m Charly — a Rust blockchain security engineer focused on Ethereum clients. How can I help you today?";
      const botDiv = document.createElement("div");
      botDiv.classList.add("bot");
      chatBox.appendChild(botDiv);

      removeTypingIndicator();

      for (let i = 0; i < welcome.length; i++) {
        const span = document.createElement("span");
        span.textContent = welcome[i];
        span.classList.add("fade-in");
        botDiv.appendChild(span);
        await new Promise((r) => setTimeout(r, 30));
      }
    }, 100); // 100ms after unblur
  }

  blurOverlay.addEventListener("click", () => {
    blurOverlay.classList.add("hide");
    setTimeout(() => {
      blurOverlay.style.display = "none";
      chatForm.style.pointerEvents = "auto";
      chatInput.focus();
      showGreeting();
    }, 400); // match CSS transition
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const message = input.value.trim();
    if (!message || message.length > 1000) return;

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
    let displayBuffer = "";
    let fullText = "";
    let currentIndex = 0;
    let renderTimeout = null;

    const partialDiv = document.createElement("div");
    partialDiv.classList.add("bot");
    chatBox.appendChild(partialDiv);

    removeTypingIndicator();

    function renderNextChar() {
      if (currentIndex < displayBuffer.length) {
        const span = document.createElement("span");
        span.textContent = displayBuffer[currentIndex];
        span.classList.add("fade-in");
        partialDiv.appendChild(span);
        fullText += displayBuffer[currentIndex];
        currentIndex++;
        renderTimeout = setTimeout(renderNextChar, 30);
      } else {
        renderTimeout = null;
      }
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice("data: ".length).trim();
          if (data === "[DONE]") {
            // Wait until all buffered chars are rendered
            return new Promise((resolve) => {
              const finish = () => {
                if (currentIndex >= displayBuffer.length) {
                  resolve(fullText.trim());
                } else {
                  setTimeout(finish, 30);
                }
              };
              finish();
            });
          }

          try {
            const json = JSON.parse(data);
            if (json.response) {
              displayBuffer += json.response;
              if (!renderTimeout) renderNextChar();
            }
          } catch (e) {
            console.error("JSON parse error", e, data);
          }
        }
      }
    }

    return new Promise((resolve) => {
      const finish = () => {
        if (currentIndex >= displayBuffer.length) {
          resolve(fullText.trim());
        } else {
          setTimeout(finish, 30);
        }
      };
      finish();
    });
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

// Modal overlay
function showWorkModal() {
  const modal = document.getElementById("work-modal-overlay");
  if (!modal) return;
  modal.classList.add("show");
  document.body.classList.add("modal-open");
}

function closeWorkModal() {
  const modal = document.getElementById("work-modal-overlay");
  if (modal) {
    modal.classList.remove("show");
    setTimeout(() => {
      document.body.classList.remove("modal-open");
    }, 300);
  }
}

// Add ESC key support for closing the modal
window.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeWorkModal();
  }
});

document.addEventListener("click", function (e) {
  const target = e.target;
  if (target.id === "btn-hire") {
    e.preventDefault();
    showWorkModal();
  }
  if (
    target.classList.contains("work-modal-close") ||
    target.id === "work-modal-overlay"
  ) {
    closeWorkModal();
  }
});
