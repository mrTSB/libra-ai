# Enron Email Dataset Ingestion & RAG

This system processes the Enron email dataset, creates embeddings, and stores them in Convex vector database for RAG (Retrieval-Augmented Generation).

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file with your API keys:
```bash
OPENAI_API_KEY=your-openai-api-key
CONVEX_URL=your-convex-deployment-url
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Deploy Convex Schema

```bash
cd backend
npx convex dev  # or npx convex deploy
```

### 4. Run Ingestion

```bash
python ingest_enron_emails.py
```

This will:
- Download the Enron email dataset from Kaggle
- Process the first 50,000 emails
- Create embeddings using OpenAI's `text-embedding-3-small`
- Store everything in Convex vector database

### 5. Query the Data

```bash
# Single query
python query_documents.py "financial fraud suspicious payments"

# Interactive mode
python query_documents.py --interactive
```

## 📊 What Gets Stored

### Document Schema
Each document in Convex contains:
```typescript
{
  content: string,           // The email content chunk
  embedding: number[],       // 1536-dimensional vector
  metadata: {
    sender?: string,         // Email sender
    subject?: string,        // Email subject
    date?: string,          // Email date
    messageId?: string,     // Email Message-ID
    originalIndex: number   // Index in original dataset
  },
  createdAt: number         // Timestamp
}
```

### Chunking Strategy
- **Chunk Size**: 1000 characters max
- **Overlap**: 200 characters between chunks
- **Boundary Breaking**: Attempts to break at sentence boundaries
- Long emails are split into multiple chunks for better retrieval

## 🔧 Configuration

### Ingestion Parameters
```python
MAX_EMAILS = 50000        # Process first 50K emails
BATCH_SIZE = 100          # Process emails in batches
EMBED_BATCH_SIZE = 20     # OpenAI embedding batch size
CHUNK_SIZE = 1000         # Max characters per chunk
OVERLAP_SIZE = 200        # Overlap between chunks
```

### OpenAI Embedding Model
- **Model**: `text-embedding-3-small`
- **Dimensions**: 1536
- **Cost**: ~$0.02 per 1M tokens

## 📡 Available Functions

### Convex Mutations
```typescript
// Store single document
documents:insertDocument(content, embedding, metadata)

// Batch store documents (recommended)
documents:batchInsertDocuments(documents[])
```

### Convex Queries
```typescript
// Vector similarity search
documents:searchDocuments(embedding, limit?)

// Get documents count
documents:getDocumentsCount()

// Get document by original index
documents:getDocumentByIndex(originalIndex)

// Get recent documents
documents:getRecentDocuments(limit?)
```

## 🎯 Usage Examples

### Basic Search
```python
from convex import ConvexClient
from openai import OpenAI

# Initialize clients
convex = ConvexClient(CONVEX_URL)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Create query embedding
query = "suspicious financial activity"
response = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=query
)
query_embedding = response.data[0].embedding

# Search documents
results = convex.query("documents:searchDocuments", {
    "embedding": query_embedding,
    "limit": 10
})
```

### RAG Pipeline
```python
# 1. Search for relevant documents
results = search_documents(query)

# 2. Extract content for context
context = "\n".join([doc["content"] for doc in results[:5]])

# 3. Generate response with LLM
response = openai_client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "Answer based on the provided email context."},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
    ]
)
```

## 📈 Performance

### Ingestion Speed
- **~50K emails**: 30-60 minutes (depending on content size)
- **Chunking**: ~500-1000 chunks per minute
- **Embedding**: Limited by OpenAI API rate limits
- **Storage**: Very fast (Convex handles batching)

### Query Performance
- **Vector Search**: <100ms typically
- **Batch Size**: Recommend 10-20 results for RAG context
- **Accuracy**: Good semantic similarity with text-embedding-3-small

## 🔍 Monitoring & Debugging

### Check Ingestion Progress
```bash
# Monitor the script output for:
📦 Processing batch X (emails Y-Z)...
✅ Stored N chunks
📈 Progress: X.X% (Y/50000)
```

### Verify Data in Convex
```bash
python query_documents.py "stats"
# or
python -c "
from convex import ConvexClient
import os
client = ConvexClient(os.getenv('CONVEX_URL'))
print('Total docs:', client.query('documents:getDocumentsCount'))
"
```

### Common Issues

1. **Rate Limits**: Script includes delays to avoid OpenAI rate limits
2. **Memory**: Processes in batches to avoid memory issues  
3. **Convex Limits**: Uses batch inserts for efficiency
4. **Duplicate Content**: Each run will add new documents (no deduplication)

## 🎉 Ready for RAG!

Once ingestion completes, you'll have:
- ✅ 50,000 Enron emails processed and embedded
- ✅ Vector database ready for semantic search
- ✅ Fast retrieval for RAG applications
- ✅ Rich metadata for filtering and context

The data is now ready to power AI applications that need to search and analyze the Enron email corpus!
