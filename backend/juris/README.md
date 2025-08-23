# Patent Document Embedding Pipeline

A comprehensive patent document processing system that extracts text from PDF patent documents, creates vector embeddings, and provides semantic search capabilities.

## 🎯 Overview

This pipeline provides:
- **PDF Processing**: Extracts text from patent PDF documents with patent-specific text cleaning
- **Vector Embeddings**: Creates searchable embeddings using OpenAI's text-embedding-3-small model
- **Semantic Search**: RAG-based retrieval system for finding relevant patent content
- **Pickle Storage**: Efficient storage and loading of processed embeddings

## 📁 Directory Structure

```
backend/juris/
├── patent_data/                           # PDF patent documents
│   ├── Patent-Law-and-Practice-Second-Edition-Schwartz-FJC-1995.pdf
│   └── R46525.1.pdf
├── patent_doc_processor.py                # Core processing & embedding module
├── setup_patent_system.py                 # Automated setup script
├── test_patent_system.py                  # Testing and validation script
├── env.example                            # Environment variables template
├── patent_knowledge_base.pkl              # Generated embeddings (after setup)
└── README.md                              # This documentation
```

## 🚀 Quick Start

### 1. Install Dependencies

The pipeline uses the same dependencies as the main project:

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Copy the environment template and add your API keys:

```bash
cd backend/juris
cp env.example .env

# Edit .env with your OpenAI API key:
# OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run the Complete Setup

The easiest way to get started is to run the automated setup:

```bash
python setup_patent_system.py
```

This will:
- ✅ Check dependencies and environment
- ✅ Validate patent PDF files
- ✅ Process all PDFs and create embeddings
- ✅ Save everything to `patent_knowledge_base.pkl`

### 4. Test the System

Verify everything works correctly:

```bash
# Run all tests
python test_patent_system.py

# Show system information
python test_patent_system.py info

# Interactive search mode
python test_patent_system.py interactive
```

## 📖 Usage Examples

### Basic Document Processing

```python
from patent_doc_processor import PatentDocumentProcessor

# Initialize processor
processor = PatentDocumentProcessor()

# Process a single document
result = processor.process_document("patent_data/your_patent.pdf")
print(f"Created {result['total_chunks']} chunks")

# Process all documents in directory
knowledge_base = processor.process_patent_documents("patent_data")
processor.save_to_pickle(knowledge_base, "patent_knowledge_base.pkl")
```

### Semantic Search

```python
from patent_doc_processor import PatentRAGRetriever

# Initialize retriever
retriever = PatentRAGRetriever("patent_knowledge_base.pkl")

# Search for relevant content
results = retriever.search_similar_chunks("patent application process", top_k=5)

for result in results:
    print(f"Document: {result['document_name']}")
    print(f"Similarity: {result['similarity']:.3f}")
    print(f"Content: {result['text'][:200]}...")
    print("-" * 50)
```

### Command Line Usage

Process documents directly from command line:

```bash
# Process with custom settings
python patent_doc_processor.py --patent-data-dir patent_data --output-pickle my_patents.pkl
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```bash
# Required: OpenAI API key for embeddings
OPENAI_API_KEY=your_openai_api_key_here

# Optional: For future integrations
ANTHROPIC_API_KEY=your_anthropic_api_key_here
EXA_API_KEY=your_exa_api_key_here
```

### Processing Parameters

The system uses these default settings:

- **Embedding Model**: `text-embedding-3-small` (1536 dimensions)
- **Chunk Size**: 1000 characters with 100 character overlap
- **Text Cleaning**: Patent-specific preprocessing (removes boilerplate, cleans formatting)

You can customize these in the `PatentDocumentProcessor` class.

## 📋 Features

### Patent-Specific Text Processing

- **Smart PDF Extraction**: Handles complex patent document layouts
- **Patent Text Cleaning**: Removes common patent office boilerplate and formatting
- **Intelligent Chunking**: Respects sentence boundaries and maintains context
- **Metadata Preservation**: Tracks document sources, chunk indices, and processing details

### Robust Search System

- **Semantic Similarity**: Uses cosine similarity on high-quality embeddings
- **Ranked Results**: Returns results sorted by relevance score
- **Rich Metadata**: Includes document names, chunk IDs, and similarity scores
- **Flexible Queries**: Works with natural language patent-related questions

### Error Handling & Logging

- **Comprehensive Logging**: Detailed processing information and error messages
- **Graceful Failures**: Continues processing even if individual documents fail
- **Validation**: Checks for required files, API keys, and data integrity

## 🧪 Testing

The test suite includes:

1. **Document Processing Test**: Validates PDF extraction and chunking
2. **Full Pipeline Test**: Tests end-to-end processing workflow
3. **Search Functionality Test**: Verifies semantic search accuracy
4. **Interactive Mode**: Manual testing with custom queries

Run tests with different modes:

```bash
python test_patent_system.py           # All automated tests
python test_patent_system.py info      # System information
python test_patent_system.py interactive # Interactive search
```

## 📊 Output Format

The generated `patent_knowledge_base.pkl` contains:

```python
{
    'documents': [
        {
            'document_name': 'Patent-Law-and-Practice...',
            'document_path': '/path/to/pdf',
            'total_chunks': 45,
            'chunks': [/* chunk objects */],
            'metadata': {/* processing info */}
        }
    ],
    'all_chunks': [
        {
            'chunk_id': 'document_chunk_0',
            'document_name': 'Patent-Law-and-Practice...',
            'text': 'Patent law governs...',
            'embedding': [0.1, 0.2, ...],  # 1536-dimensional vector
            'metadata': {
                'chunk_index': 0,
                'size': 950,
                'document_path': '/path/to/pdf',
                'document_type': 'patent'
            }
        }
    ],
    'metadata': {
        'total_documents': 2,
        'total_chunks': 89,
        'embedding_model': 'text-embedding-3-small',
        'processed_at': '2024-01-15 10:30:00',
        'knowledge_base_type': 'patent'
    }
}
```

## 🔍 Search Quality

The system is optimized for patent-related queries such as:

- "patent application process"
- "intellectual property rights"
- "prior art search requirements"
- "patent claims and specifications"
- "patent law principles"

Results include similarity scores (0.0 to 1.0) where higher scores indicate more relevant content.

## 🚨 Troubleshooting

### Common Issues

1. **Missing API Key**
   ```
   Error: Missing required environment variables: OPENAI_API_KEY
   ```
   Solution: Create `.env` file with your OpenAI API key

2. **No PDF Files Found**
   ```
   Error: No PDF files found in patent_data
   ```
   Solution: Ensure PDF files are in the `patent_data/` directory

3. **Empty Text Extraction**
   ```
   Error: No text extracted from PDF
   ```
   Solution: Check if PDF is readable/not image-only

4. **Import Errors**
   ```
   ModuleNotFoundError: No module named 'openai'
   ```
   Solution: Install dependencies with `pip install -r requirements.txt`

### Performance Notes

- Processing time depends on PDF size and complexity
- Embedding generation requires internet connection (OpenAI API)
- Large documents may take several minutes to process
- The pickle file size scales with the number of documents and chunks

## 🌐 Patent Search API

The system includes a REST API for patent similarity search that combines local corpus search with web search in parallel.

### Starting the API Server

```bash
# Quick start
python start_patent_api.py

# Development mode with auto-reload
python start_patent_api.py --reload

# Custom port
python start_patent_api.py --port 8080

# Check requirements only
python start_patent_api.py --check
```

### API Endpoints

#### Main Patent Search
```
POST /patent/search
```

**Request Body:**
```json
{
  "description": "A method for processing digital images using machine learning algorithms",
  "title": "AI Image Processing System",
  "use_web_search": true,
  "use_local_corpus": true,
  "max_local_results": 5,
  "max_web_results": 5
}
```

**Response:**
```json
{
  "query_description": "A method for processing digital images...",
  "similar_patents": [
    {
      "title": "Machine Learning Image Classification",
      "description": "System for automated object detection...",
      "source": "https://patents.google.com/patent/US12345678",
      "similarity_score": 0.892,
      "patent_number": "US12345678",
      "result_type": "web_search"
    }
  ],
  "local_results_count": 3,
  "web_results_count": 4,
  "total_results": 7,
  "search_summary": "Found 3 similar patents in local corpus and 4 from web search"
}
```

#### Other Endpoints

- `GET /` - Health check and system status
- `GET /patent/status` - Detailed system status and configuration
- `GET /patent/search-local` - Search local corpus only
- `POST /patent/reload` - Reload knowledge base
- `GET /docs` - Interactive API documentation

### Testing the API

```bash
# Run all API tests
python test_patent_api.py

# Quick health check
python test_patent_api.py quick

# Interactive search mode
python test_patent_api.py interactive

# Show usage examples
python test_patent_api.py examples
```

### API Demonstration

```bash
# Run complete demo with realistic examples
python api_demo.py

# Show usage tips
python api_demo.py tips

# Demo additional features
python api_demo.py features
```

### Integration Example

```python
import requests

# Search for similar patents
response = requests.post("http://localhost:8001/patent/search", json={
    "description": "Smartphone battery optimization using AI",
    "use_web_search": True,
    "use_local_corpus": True,
    "max_local_results": 5,
    "max_web_results": 5
})

if response.status_code == 200:
    data = response.json()
    print(f"Found {data['total_results']} similar patents")
    
    for patent in data['similar_patents']:
        print(f"- {patent['title']}")
        print(f"  Similarity: {patent['similarity_score']:.3f}")
        print(f"  Source: {patent['result_type']}")
```

## 🔮 Future Enhancements

Potential improvements:

- **Multi-format Support**: Process Word documents, HTML, etc.
- **Advanced Chunking**: Semantic-aware chunking strategies
- **Batch Processing**: Parallel processing for large document sets
- **Web Interface**: User-friendly search interface
- **Integration**: Connect with patent databases and search engines
- **AI Analysis**: Patent novelty assessment and prior art analysis
- **Real-time Monitoring**: Track new patents in specific domains

## 📝 License

This patent processing pipeline is part of the Libra AI project and follows the same licensing terms.

---

For questions or issues, please refer to the main project documentation or create an issue in the project repository.
