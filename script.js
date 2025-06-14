const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  appendMessage("user", message);
  input.value = "";

  const response = generateBotReply(message);
  appendMessage("bot", response);
});

function appendMessage(sender, message) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(sender);
  msgDiv.textContent = message;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function generateBotReply(input) {
  const msg = input.toLowerCase();

  if (msg.includes("hello")) return "Hey there!";
  if (msg.includes("eth")) return "Ethereum is a decentralized platform.";
  if (msg.includes("rust"))
    return "Rust is memory-safe and ideal for blockchain.";
  return "I'm just a basic bot. Ask me about Rust or Ethereum.";
}
