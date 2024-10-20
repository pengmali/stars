const form = document.getElementById("websiteForm");
const audioPlayer = document.getElementById("audioPlayer");
const bookmarkBtn = document.getElementById("bookmarkBtn");
const bookmarkList = document.getElementById("bookmarkList");
let bookmarks = [];
let currentTime = 0; // Track the current time for resume

// Form submission handler: fetches scraped text, converts to speech
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = document.getElementById("url").value;

  // Fetch the website content from the backend (change the port to match your backend)
  const response = await fetch(
    `http://localhost:3000/scrape?url=${encodeURIComponent(url)}`
  );
  const data = await response.json();

  if (data.audioContent) {
    // Convert base64 audio to a Blob and create an audio element
    const audioBlob = base64ToBlob(data.audioContent, "audio/mp3");
    const audioUrl = URL.createObjectURL(audioBlob);

    // Set the audio player source to the generated URL
    audioPlayer.src = audioUrl;
    audioPlayer.load();
    currentTime = 0; // Reset current time for new audio

    // Enable bookmark button after the audio is ready
    bookmarkBtn.disabled = false;

    // Ensure audio plays after user interaction
    audioPlayer.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  } else {
    alert("Error: No audio content returned");
  }
});

// Function to convert base64 string to Blob
function base64ToBlob(base64, mimeType) {
  const byteChars = atob(base64); // Decode base64
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// Bookmark functionality
bookmarkBtn.addEventListener("click", () => {
  const time = audioPlayer.currentTime;
  bookmarks.push(time);
  displayBookmarks();
});

function displayBookmarks() {
  bookmarkList.innerHTML = ""; // Clear current list
  bookmarks.forEach((time, index) => {
    const li = document.createElement("li");
    li.innerHTML = `Bookmark ${index + 1}: ${formatTime(
      time
    )} <button onclick="jumpTo(${time})">Go</button>`;
    bookmarkList.appendChild(li);
  });
}

function jumpTo(time) {
  audioPlayer.currentTime = time;
  audioPlayer.play().catch((error) => {
    console.error("Error playing audio at bookmark:", error);
  });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Automatic resume functionality
window.addEventListener("beforeunload", saveCurrentTime);
window.addEventListener("load", () => {
  const savedTime = localStorage.getItem("savedTime");
  if (savedTime) {
    audioPlayer.currentTime = parseFloat(savedTime);
    audioPlayer.load(); // Ensure audio is loaded before attempting to play

    // Play audio only after user interaction (you may need a button click)
    // You can add a prompt or UI indicator for users to manually start playback
  }
});

function saveCurrentTime() {
  localStorage.setItem("savedTime", audioPlayer.currentTime);
}
