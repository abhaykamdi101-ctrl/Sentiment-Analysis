
const textInput = document.getElementById("text-input");
const charCount = document.getElementById("char-count");
const clearBtn = document.getElementById("clear-btn");
const analyzeBtn = document.getElementById("analyze-btn");
const errorBox = document.getElementById("error");

const results = document.getElementById("results");
const label = document.getElementById("label");
const score = document.getElementById("score");
const gaugeMarker = document.getElementById("gauge-marker");
const positiveList = document.getElementById("positive-list");
const negativeList = document.getElementById("negative-list");

// Update character counter
function updateCharCount() {
    const max = Number(textInput.maxLength);
    charCount.textContent = `${textInput.value.length} / ${max}`;
}

// Display positive or negative sentences
function showPhrases(listElement, phrases, emptyMessage) {
    listElement.replaceChildren();

    if (!phrases || phrases.length === 0) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = emptyMessage;
        listElement.appendChild(li);
        return;
    }

    phrases.forEach((phrase) => {
        const li = document.createElement("li");
        li.textContent = phrase;
        listElement.appendChild(li);
    });
}

// Display analysis results
function displayResults(data) {
    label.textContent = data.sentiment;
    label.className = data.sentiment.toLowerCase();

    score.textContent = Number(data.polarity).toFixed(3);

    const position = ((data.polarity + 1) / 2) * 100;
    gaugeMarker.style.left = `${position}%`;

    showPhrases(
        positiveList,
        data.positive_words,
        "No positive words detected."
    );

    showPhrases(
        negativeList,
        data.negative_words,
        "No negative words detected."
    );

    results.classList.remove("hidden");
}

// Analyze button
analyzeBtn.addEventListener("click", async () => {
    const text = textInput.value.trim();

    errorBox.textContent = "";

    if (!text) {
        results.classList.add("hidden");
        errorBox.textContent = "Please enter some text.";
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    try {
        const response = await fetch("/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to analyze text.");
        }

        displayResults(data);
    } catch (error) {
        results.classList.add("hidden");
        errorBox.textContent =
            error.message || "Something went wrong. Please try again.";
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analyze Sentiment";
    }
});

// Clear button
clearBtn.addEventListener("click", () => {
    textInput.value = "";
    updateCharCount();

    errorBox.textContent = "";
    results.classList.add("hidden");
    textInput.focus();
});

// Character counter updates while typing
textInput.addEventListener("input", updateCharCount);

updateCharCount();
