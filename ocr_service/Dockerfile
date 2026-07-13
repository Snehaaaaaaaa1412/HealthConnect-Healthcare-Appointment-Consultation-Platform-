FROM python:3.11-slim

# Install system dependencies including Tesseract OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libtesseract-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy python app and install dependencies
# We can write dependencies flatly or generate a requirements.txt,
# let's copy and install using pip directly to minimize dependency management files.
RUN pip install --no-cache-dir \
    flask==3.0.2 \
    flask-cors==4.0.0 \
    pytesseract==0.3.10 \
    pypdf==4.1.0 \
    requests==2.31.0 \
    pillow==10.2.0

COPY . .

# Expose OCR port
EXPOSE 5001

CMD ["python", "app.py"]
