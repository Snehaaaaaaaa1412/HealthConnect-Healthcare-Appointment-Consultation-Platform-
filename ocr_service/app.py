import os
import sys
import json
import requests
import pytesseract
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import pypdf

# Set Tesseract-OCR path conditionally based on operating system
if sys.platform.startswith('win'):
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = Flask(__name__)
CORS(app)  # Enable CORS to allow cross-origin requests from frontend (port 3001)

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path):
    text = ""
    try:
        reader = pypdf.PdfReader(file_path)
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
    return text.strip()

def extract_text_from_image(file_path):
    try:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        return text.strip()
    except Exception as e:
        print(f"Error running OCR on image {file_path}: {e}")
        return ""

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'status': 'UP',
        'service': 'OCR & Triage Microservice API',
        'endpoints': {
            '/extract-text': 'POST (multipart/form-data)',
            '/triage': 'POST (application/json)'
        }
    })

@app.route('/extract-text', methods=['POST'])
def handle_extract_text():
    if 'file' not in request.files:
        return jsonify({'error': 'Missing file payload'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'error': 'Unsupported file format. Please upload PDF or image files.'}), 400
        
    try:
        # Create temp folder inside workspace for file staging
        temp_dir = os.path.join(os.path.dirname(__file__), 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        
        file_path = os.path.join(temp_dir, file.filename)
        file.save(file_path)
        
        ext = file.filename.rsplit('.', 1)[1].lower()
        extracted_text = ""
        
        if ext == 'pdf':
            extracted_text = extract_text_from_pdf(file_path)
        else:
            extracted_text = extract_text_from_image(file_path)
            
        # Clean up staged file
        if os.path.exists(file_path):
            os.remove(file_path)
            
        # If no text could be parsed, return an error block
        if not extracted_text:
            return jsonify({'error': 'No text could be extracted from this document. Please ensure it contains readable text or high-contrast printed letters.'}), 422
            
        return jsonify({
            'filename': file.filename,
            'text': extracted_text
        })
        
    except Exception as e:
        return jsonify({'error': f'Internal service error: {str(e)}'}), 500

@app.route('/triage', methods=['POST'])
def handle_triage():
    data = request.json
    if not data or 'query' not in data:
        return jsonify({'error': 'Missing query'}), 400
        
    query = data['query']
    
    # Prompt Ollama with structured instructions for classification and explanation
    prompt = f"""You are a medical triage assistant. Analyze the patient query and suggest the department.
Choose exactly one of these departments:
- General Practitioner
- Cardiology
- Dermatology
- Pediatrics
- Orthopedics

Guidelines:
- Choose Pediatrics if patient is a child, kid, baby, infant, or referred to as Master/Baby.
- Choose Cardiology for chest pain, heart palpitations, cardiac variables.
- Choose Dermatology for skin issues, rashes, acne, itching.
- Choose Orthopedics for bones, joints, fractures, muscles.
- Default to General Practitioner for cold, viral fever, throat issues, general malaise, or if symptoms are non-specific.

Provide your response in JSON format. Do not write markdown blocks or any other text.
Format:
{{
  "explanation": "A very short, simple 1-sentence explanation recommendation.",
  "department": "Department Name"
}}

Patient query:
{query}

JSON:"""

    try:
        ollama_response = requests.post('http://localhost:11434/api/generate', json={
            'model': 'gemma3:1b',
            'prompt': prompt,
            'stream': False,
            'options': {
                'temperature': 0.1
            }
        }, timeout=15)
        
        if ollama_response.status_code != 200:
            return jsonify({'error': f'Ollama service status: {ollama_response.status_code}'}), 502
            
        result_text = ollama_response.json().get('response', '').strip()
        
        result_text = result_text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        elif result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
        result_text = result_text.strip()
        
        parsed_result = json.loads(result_text)
        
        dept = parsed_result.get('department', 'General Practitioner')
        valid_depts = {"General Practitioner", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics"}
        if dept not in valid_depts:
            dept = "General Practitioner"
            
        # Post-process override for children/pediatrics
        text_lower = query.lower()
        if any(w in text_lower for w in ["child", "kid", "pediatri", "paediatric", "baby", "master", "dch"]):
            dept = "Pediatrics"
            
        return jsonify({
            'explanation': parsed_result.get('explanation', 'Consult a General Practitioner for general symptoms.'),
            'department': dept
        })
        
    except Exception as e:
        # Resilient fallback matching
        print(f"Ollama/JSON Parse Error: {e}")
        text_lower = query.lower()
        dept = "General Practitioner"
        if "heart" in text_lower or "cardio" in text_lower or "palpitation" in text_lower or "chest pain" in text_lower:
            dept = "Cardiology"
        elif "skin" in text_lower or "rash" in text_lower or "acne" in text_lower or "itch" in text_lower:
            dept = "Dermatology"
        elif "child" in text_lower or "kid" in text_lower or "pediatri" in text_lower or "paediatric" in text_lower or "baby" in text_lower or "master" in text_lower:
            dept = "Pediatrics"
        elif "bone" in text_lower or "joint" in text_lower or "fracture" in text_lower or "muscle" in text_lower:
            dept = "Orthopedics"
            
        return jsonify({
            'explanation': "Consult with the suggested specialist department for clinical review.",
            'department': dept
        })

if __name__ == '__main__':
    # Start on port 5001
    app.run(host='0.0.0.0', port=5001, debug=True)
