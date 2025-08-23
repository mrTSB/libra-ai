# Legal Document RAG System

A comprehensive legal question-answering system that combines local document embeddings with web search and Claude Sonnet 3.5 for expert legal responses.

## 🎯 Overview

This system provides:
- **Document Processing**: Extracts and chunks PDF legal documents
- **Vector Embeddings**: Creates searchable embeddings using OpenAI
- **RAG Pipeline**: Retrieves relevant context from local documents
- **Web Search**: Integrates Exa search for current legal information
- **Expert AI**: Uses Claude Sonnet 3.5 for knowledgeable legal responses
- **FastAPI Server**: RESTful API for legal chat functionality

## 📁 Files Structure

```
backend/
├── law_data/                      # PDF legal documents
│   ├── basic-laws-book-2016.pdf
│   └── rule-of-law.pdf
├── legal_doc_processor.py         # Document processing & embedding
├── legal_chat_api.py              # FastAPI server with endpoints
├── setup_legal_system.py          # Setup script
├── test_legal_chat.py             # Testing script
├── env.example                    # Environment variables template
└── legal_knowledge_base.pkl       # Generated embeddings (after setup)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up Environment

```bash
# Copy environment template
cp env.example .env

# Edit .env with your API keys:
# - OPENAI_API_KEY (for embeddings)
# - ANTHROPIC_API_KEY (for Claude Sonnet 3.5)
# - EXA_API_KEY (for web search)
```

### 3. Process Legal Documents

```bash
# Automated setup (recommended)
python setup_legal_system.py

# Or manual processing
python legal_doc_processor.py --law-data-dir law_data --output-pickle legal_knowledge_base.pkl
```

### 4. Start the API Server

```bash
python legal_chat_api.py
```

### 5. Test the System

```bash
# Run tests
python test_legal_chat.py

# Interactive mode
python test_legal_chat.py interactive
```

## 🔧 API Endpoints

### Main Chat Endpoint
```
POST /legal/chat
```

**Request Body:**
```json
{
  "question": "What are constitutional rights?",
  "use_web_search": true,
  "use_local_docs": true,
  "max_local_results": 5,
  "max_web_results": 3
}
```

**Response:**
```json
{
  "answer": "Constitutional rights are...",
  "sources": [...],
  "local_context_used": [...],
  "web_context_used": [...],
  "reasoning": "Used 3 local sources and 2 web sources"
}
```

### Other Endpoints

- `GET /` - Health check
- `GET /legal/status` - System status
- `GET /legal/search` - Search local documents only
- `POST /legal/reload` - Reload knowledge base
- `GET /docs` - Interactive API documentation

## 🏗️ Architecture

### 1. Document Processing Pipeline

```
PDF Files → Text Extraction → Cleaning → Chunking → Embeddings → Pickle Storage
```

- **Text Extraction**: Uses PyPDF2 to extract text from PDFs
- **Cleaning**: Normalizes whitespace, fixes common OCR issues
- **Chunking**: Splits into overlapping chunks (~1000 chars with 200 char overlap)
- **Embeddings**: Generates OpenAI embeddings for semantic search
- **Storage**: Saves to pickle file for fast loading

### 2. RAG Query Pipeline

```
User Query → Local Search + Web Search → Context Compilation → Claude Response
```

- **Local Search**: Vector similarity search in document embeddings
- **Web Search**: Exa search for current legal information
- **Context Compilation**: Formats and limits context for optimal results
- **AI Response**: Claude Sonnet 3.5 generates expert legal answers

## 🔍 Features

### Local Document Search
- Vector similarity search using cosine similarity
- Relevance scoring and ranking
- Chunk-level retrieval with metadata
- Support for multiple document types

### Web Search Integration
- Exa API for high-quality legal content
- Query enhancement for legal topics
- Highlights and summary extraction
- Source URL and title preservation

### Expert AI Responses
- Claude Sonnet 3.5 (latest model)
- Legal expert system prompt
- Context-aware reasoning
- Professional disclaimers and guidance

### API Features
- FastAPI with automatic documentation
- CORS support for web frontends
- Error handling and logging
- Background tasks support
- Hot reloading in development

## 📚 Usage Examples

### Python Client

```python
import requests

# Ask a legal question
response = requests.post("http://localhost:8000/legal/chat", json={
    "question": "What is due process in constitutional law?",
    "use_web_search": True,
    "use_local_docs": True
})

result = response.json()
print(result['answer'])
```

### curl

```bash
curl -X POST "http://localhost:8000/legal/chat" \
  -H "Content-Type: application/json" \
  -d '{"question": "What are Miranda rights?"}'
```

### Web Frontend Integration

```javascript
async function askLegalQuestion(question) {
  const response = await fetch('http://localhost:8000/legal/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: question,
      use_web_search: true,
      use_local_docs: true
    })
  });
  
  return await response.json();
}
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for embeddings | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | Yes |
| `EXA_API_KEY` | Exa API key for web search | Yes |
| `CONVEX_URL` | Convex database URL (if using) | No |

### Processing Parameters

```python
# In legal_doc_processor.py
chunk_size = 1000        # Characters per chunk
overlap = 200           # Overlap between chunks
embedding_model = "text-embedding-3-small"  # OpenAI model

# In legal_chat_api.py
max_context_length = 15000    # Max context for Claude
max_tokens = 2000            # Max response tokens
```

## 🔒 Security & Legal Considerations

### Data Privacy
- Legal documents are processed locally
- Embeddings stored in pickle files (not cloud)
- API keys managed through environment variables
- No persistent storage of user queries

### Legal Disclaimers
- System includes appropriate legal disclaimers
- Reminds users this is informational only
- Recommends professional legal counsel for specific situations
- Notes jurisdiction-specific law limitations

### Production Deployment
- Configure CORS for specific domains
- Add authentication/authorization
- Use HTTPS in production
- Monitor API usage and rate limiting
- Regular security updates

## 🛠️ Troubleshooting

### Common Issues

**1. "Legal knowledge base not found"**
- Run `python setup_legal_system.py` first
- Ensure law_data directory has PDF files

**2. "OpenAI API Error"**
- Check OPENAI_API_KEY in .env file
- Verify API key has sufficient credits

**3. "Exa search failed"**
- Check EXA_API_KEY configuration
- Verify internet connectivity

**4. "PDF extraction failed"**
- Ensure PDFs are readable (not image-only)
- Try different PDF processing libraries if needed

### Debugging

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
python legal_chat_api.py

# Check system status
curl http://localhost:8000/legal/status

# Test document search
curl "http://localhost:8000/legal/search?query=constitutional%20rights"
```

## 📈 Performance Optimization

### Embedding Storage
- Pickle files for fast loading
- Consider vector databases for larger datasets
- Batch processing for multiple documents

### API Performance
- FastAPI async support
- Background tasks for heavy operations
- Caching for frequently asked questions

### Cost Management
- Monitor OpenAI API usage
- Cache embeddings to avoid regeneration
- Optimize chunk sizes for relevance vs. cost

## 🔄 Future Enhancements

- [ ] Support for more document formats (DOCX, TXT)
- [ ] Vector database integration (Pinecone, Weaviate)
- [ ] Multi-language support
- [ ] Citation extraction and formatting
- [ ] Legal case law integration
- [ ] Conversation history and context
- [ ] Fine-tuned legal embeddings
- [ ] Real-time document updates

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review API logs and status endpoints
3. Test with sample queries
4. Verify all API keys are configured correctly

---

**Disclaimer**: This system provides informational legal content only and is not a substitute for professional legal advice. Always consult with qualified legal professionals for specific legal matters.
