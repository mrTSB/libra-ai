# Sage AI - Document Search & Suspicion Detection

A powerful AI-powered system for searching documents and detecting suspicious emails using semantic search and LLM-based analysis.

## Features

### 🔍 Web Search
- Semantic web search with configurable results
- Easy integration with search APIs (Tavily, SerpAPI, etc.)
- Structured response format

### 📚 Document Search (RAG)
- Vector-based semantic search over email/document corpus
- FAISS-powered fast similarity search
- Automatic text chunking and embedding
- Support for Enron email dataset and custom documents

### 🚨 Suspicion Detection
- AI-powered email analysis for phishing and fraud detection
- Multi-signal analysis including:
  - Content analysis (urgency tactics, financial requests, etc.)
  - Authentication headers (SPF, DKIM, DMARC, ARC)
  - Grammar and spelling assessment
  - Brand impersonation detection
- Structured risk assessment with confidence scores

### 🔗 Combined Analysis
- Search suspicious documents and analyze them in one request
- Batch processing of multiple documents
- Comprehensive reporting

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Environment Variables

```bash
export OPENAI_API_KEY="your-openai-api-key"
# Optional: Add search API keys
export TAVILY_API_KEY="your-tavily-key"
```

### 3. Load Dataset

```python
from sage.services import load_and_index_dataset

# Load Enron email dataset from Kaggle
result = load_and_index_dataset(
    dataset_name="wcukierski/enron-email-dataset",
    force_reload=False
)
print(result.message)
```

### 4. Start the API Server

```bash
python -m sage.controllers
# or
uvicorn sage.controllers:app --reload --port 8000
```

### 5. Test the System

```bash
python test_sage.py
```

## API Endpoints

### Web Search
```bash
POST /search/web
{
  "query": "DMARC email security",
  "max_results": 5
}
```

### Document Search
```bash
POST /search/corpus
{
  "query": "suspicious financial transactions",
  "max_results": 10
}
```

### Suspicion Analysis
```bash
POST /analyze/suspicion
{
  "email_text": "Urgent: verify your account...",
  "from_domain": "suspicious.com",
  "spf": "fail",
  "dkim": "fail",
  "dmarc": "fail"
}
```

### Combined Search & Analysis
```bash
POST /search-and-analyze
{
  "query": "payment fraud suspicious",
  "analyze_suspicion": true,
  "max_results": 10
}
```

### Dataset Management
```bash
POST /dataset/load
{
  "dataset_name": "wcukierski/enron-email-dataset",
  "force_reload": false
}

GET /dataset/status
```

## Python API Usage

### Web Search
```python
from sage.services import perform_web_search

result = perform_web_search("AI security trends", max_results=5)
for item in result.results:
    print(f"{item.title}: {item.url}")
```

### Document Search
```python
from sage.services import perform_corpus_search

result = perform_corpus_search("financial fraud", max_results=10)
for doc in result.results:
    print(f"Score: {doc.score:.3f}")
    print(f"Content: {doc.chunk_text[:100]}...")
    print(f"From: {doc.metadata.sender}")
```

### Suspicion Analysis
```python
from sage.services import analyze_email_suspicion

email_content = """
Subject: URGENT: Account Verification Required
Click here to verify: http://suspicious-site.com
"""

report = analyze_email_suspicion(
    email_content,
    from_domain="suspicious-site.com"
)

print(f"Risk: {report.risk}")
print(f"Confidence: {report.confidence}")
print(f"Action: {report.recommended_action}")

for indicator in report.indicators:
    print(f"- {indicator.type}: {indicator.detail}")
```

## Architecture

### Components

1. **Schemas** (`schemas.py`): Pydantic models for request/response validation
2. **Services** (`services.py`): Core business logic and AI model integration
3. **Controllers** (`controllers.py`): FastAPI endpoints and error handling

### AI Integration

- **OpenAI GPT-4o-mini**: For text generation and structured analysis
- **text-embedding-3-small**: For document embeddings
- **AI-SDK-Python**: Tool definitions and model management
- **FAISS**: Vector similarity search

### Data Flow

1. **Ingestion**: Documents → Email parsing → Text chunking → Embeddings → FAISS index
2. **Search**: Query → Embedding → Vector search → Ranked results
3. **Analysis**: Email content → LLM analysis → Structured risk assessment

## Customization

### Adding Search Providers

Replace the dummy implementation in `web_search()`:

```python
# Example: Tavily integration
def web_search(q: str, top_k: int = 5, include_snippets: bool = True):
    api_key = os.getenv("TAVILY_API_KEY")
    resp = requests.post(
        "https://api.tavily.com/search",
        json={"query": q, "max_results": top_k},
        headers={"Authorization": f"Bearer {api_key}"}
    )
    return resp.json()["results"]
```

### Custom Document Processing

Extend `preprocess_email()` for different document types:

```python
def preprocess_document(doc_content: str, doc_type: str):
    if doc_type == "pdf":
        # Add PDF processing
        pass
    elif doc_type == "docx":
        # Add Word document processing
        pass
    # ... existing email processing
```

### Enhanced Suspicion Detection

Extend the analysis prompt in `check_email_suspicion()`:

```python
prompt = f"""
Additional analysis rules:
- Check for cryptocurrency requests
- Analyze attachment types
- Verify sender reputation
- Cross-reference with threat intelligence

{existing_prompt}
"""
```

## Security Considerations

1. **API Keys**: Store in environment variables, never in code
2. **Input Validation**: All inputs are validated via Pydantic schemas
3. **Rate Limiting**: Consider adding rate limiting for production
4. **Data Privacy**: Email content is processed locally, not stored permanently
5. **Model Security**: Validate LLM outputs before acting on them

## Performance Tips

1. **Batch Processing**: Use `embed_many()` for multiple documents
2. **Index Optimization**: Consider IVF or HNSW indices for large datasets
3. **Caching**: Cache embeddings and search results when possible
4. **Async Processing**: Use async endpoints for I/O-bound operations

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all dependencies are installed
2. **API Key Issues**: Verify OpenAI API key is set correctly
3. **Dataset Loading**: Check Kaggle credentials and dataset availability
4. **Memory Issues**: Reduce sample size for large datasets
5. **FAISS Errors**: Ensure numpy arrays are correct dtype (float32)

### Debug Mode

Enable detailed logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Test Individual Components

```bash
# Test web search only
python -c "from sage.services import perform_web_search; print(perform_web_search('test'))"

# Test suspicion analysis only  
python -c "from sage.services import analyze_email_suspicion; print(analyze_email_suspicion('test email'))"
```

## Contributing

1. Follow the existing code structure (schemas → services → controllers)
2. Add comprehensive error handling
3. Update tests when adding new features
4. Use type hints throughout
5. Document new functions and endpoints

## License

This project is part of the Libra AI hackathon submission.
