

from flask import Flask, jsonify, render_template, request
from textblob import TextBlob

app = Flask(__name__)

# Polarity between -NEUTRAL_BAND and +NEUTRAL_BAND is treated as neutral.
NEUTRAL_BAND = 0.05
MAX_CHARS = 5000


def classify(polarity: float) -> str:
    """Turn a polarity score (-1 to +1) into a label."""
    if polarity > NEUTRAL_BAND:
        return "positive"
    if polarity < -NEUTRAL_BAND:
        return "negative"
    return "neutral"


def unique(items):
    """Remove duplicates while keeping the original order."""
    seen = set()
    result = []
    for item in items:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            result.append(item)
    return result


def analyze_text(text: str) -> dict:
    """Run TextBlob on the text and build the response payload."""
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    positive_words, negative_words = [], []

    # Each assessment is (words, polarity, subjectivity, label).
    # `words` can hold several tokens, e.g. ["not", "good"].
    for words, score, *_ in blob.sentiment_assessments.assessments:
        phrase = " ".join(words)
        if score > 0:
            positive_words.append(phrase)
        elif score < 0:
            negative_words.append(phrase)

    return {
        "sentiment": classify(polarity),
        "polarity": round(polarity, 3),
        "subjectivity": round(subjectivity, 3),
        "positive_words": unique(positive_words),
        "negative_words": unique(negative_words),
    }


@app.route("/")
def index():
    return render_template("index.html", max_chars=MAX_CHARS)


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Request must be JSON with a 'text' field."), 400

    text = str(data.get("text", "")).strip()
    if not text:
        return jsonify(error="Enter some text to analyze."), 400
    if len(text) > MAX_CHARS:
        return jsonify(error=f"Text is too long. Limit is {MAX_CHARS} characters."), 400

    try:
        return jsonify(analyze_text(text))
    except Exception:  # noqa: BLE001 - keep the server from leaking internals
        app.logger.exception("Sentiment analysis failed")
        return jsonify(error="Something went wrong on the server. Try again."), 500


if __name__ == "__main__":
    app.run(debug=True)