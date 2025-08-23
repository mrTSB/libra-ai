#!/usr/bin/env python3
"""
Patent Document Processing and Embedding System
Processes PDF patent documents, creates embeddings, and saves to pickle files.
"""

import os
import re
import pickle
import logging
from typing import List, Dict, Any, Tuple
from pathlib import Path
from datetime import datetime
import PyPDF2
import openai
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PatentDocumentProcessor:
    """
    Processes patent PDF documents and creates vector embeddings for semantic search.
    """
    
    def __init__(self, openai_api_key: str = None):
        """Initialize the processor with OpenAI client."""
        self.openai_client = openai.OpenAI(
            api_key=openai_api_key or os.getenv("OPENAI_API_KEY")
        )
        self.embedding_model = "text-embedding-3-small"
        self.embedding_dimension = 1536
        
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract raw text from PDF file."""
        try:
            text_content = ""
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text_content += f"\n--- Page {page_num + 1} ---\n"
                            text_content += page_text
                    except Exception as e:
                        logger.warning(f"Error extracting text from page {page_num + 1}: {e}")
                        continue
                        
            logger.info(f"Extracted {len(text_content)} characters from {pdf_path}")
            return text_content
            
        except Exception as e:
            logger.error(f"Error reading PDF {pdf_path}: {e}")
            return ""
    
    def clean_patent_text(self, text: str) -> str:
        """Clean and preprocess patent text with patent-specific patterns."""
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove page headers/footers that are common in patent docs
        text = re.sub(r'--- Page \d+ ---', '', text)
        
        # Clean up patent-specific formatting
        # Remove excessive line breaks around patent sections
        text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
        
        # Remove patent office boilerplate (common patterns)
        text = re.sub(r'U\.S\. Patent.*?(?=\n|\s{5,})', '', text, flags=re.IGNORECASE)
        text = re.sub(r'Patent No\..*?(?=\n|\s{5,})', '', text, flags=re.IGNORECASE)
        
        # Clean up claim numbering (preserve structure but clean formatting)
        text = re.sub(r'(\d+\.)\s+', r'\1 ', text)
        
        # Remove excessive punctuation
        text = re.sub(r'[^\w\s\.\,\;\:\!\?\(\)\[\]\-\"\']', ' ', text)
        
        # Clean up spacing
        text = ' '.join(text.split())
        
        return text.strip()
    
    def chunk_patent_text(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> List[Dict[str, Any]]:
        """
        Split patent text into overlapping chunks, respecting patent document structure.
        """
        if not text:
            return []
        
        # Split into sentences for better chunk boundaries
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        chunks = []
        current_chunk = ""
        current_size = 0
        chunk_index = 0
        sentence_index = 0
        
        for i, sentence in enumerate(sentences):
            sentence_length = len(sentence)
            
            # Check if adding this sentence would exceed chunk size
            if current_size + sentence_length > chunk_size and current_chunk:
                # Save current chunk
                chunks.append({
                    'text': current_chunk.strip(),
                    'index': chunk_index,
                    'size': current_size,
                    'start_sentence': sentence_index
                })
                
                # Start new chunk with overlap
                chunk_index += 1
                
                # For overlap, include last few sentences from previous chunk
                if overlap > 0 and len(chunks) > 0:
                    overlap_sentences = []
                    temp_overlap = 0
                    
                    # Work backwards from current sentence to get overlap
                    for j in range(i-1, max(0, i-10), -1):
                        if temp_overlap + len(sentences[j]) <= overlap:
                            overlap_sentences.insert(0, sentences[j])
                            temp_overlap += len(sentences[j])
                        else:
                            break
                    
                    current_chunk = " ".join(overlap_sentences) + " " if overlap_sentences else ""
                    current_size = len(current_chunk)
                    sentence_index = max(0, i - len(overlap_sentences))
                else:
                    current_chunk = ""
                    current_size = 0
                    sentence_index = i
            
            # Add current sentence to chunk
            if current_chunk:
                current_chunk += " " + sentence
            else:
                current_chunk = sentence
            current_size += sentence_length
        
        # Add final chunk if it has content
        if current_chunk.strip():
            chunks.append({
                'text': current_chunk.strip(),
                'index': chunk_index,
                'size': current_size,
                'start_sentence': sentence_index
            })
        
        logger.info(f"Created {len(chunks)} chunks from text")
        return chunks
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI API."""
        try:
            response = self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=text,
                encoding_format="float"
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            # Return zero vector as fallback
            return [0.0] * self.embedding_dimension
    
    def process_document(self, pdf_path: str, document_name: str = None) -> Dict[str, Any]:
        """Process a single patent PDF document."""
        if document_name is None:
            document_name = Path(pdf_path).stem
        
        logger.info(f"Processing patent document: {document_name}")
        
        # Extract text
        raw_text = self.extract_text_from_pdf(pdf_path)
        if not raw_text:
            logger.error(f"No text extracted from {pdf_path}")
            return None
        
        # Clean text with patent-specific cleaning
        clean_text = self.clean_patent_text(raw_text)
        
        # Create chunks
        chunks = self.chunk_patent_text(clean_text)
        logger.info(f"Created {len(chunks)} chunks for {document_name}")
        
        # Generate embeddings for each chunk
        processed_chunks = []
        for i, chunk in enumerate(chunks):
            logger.info(f"Generating embedding for chunk {i+1}/{len(chunks)}")
            embedding = self.generate_embedding(chunk['text'])
            
            processed_chunks.append({
                'chunk_id': f"{document_name}_chunk_{chunk['index']}",
                'document_name': document_name,
                'text': chunk['text'],
                'embedding': embedding,
                'metadata': {
                    'chunk_index': chunk['index'],
                    'size': chunk['size'],
                    'document_path': pdf_path,
                    'start_sentence': chunk.get('start_sentence', 0),
                    'document_type': 'patent'
                }
            })
        
        return {
            'document_name': document_name,
            'document_path': pdf_path,
            'total_chunks': len(processed_chunks),
            'chunks': processed_chunks,
            'metadata': {
                'original_text_length': len(raw_text),
                'clean_text_length': len(clean_text),
                'embedding_model': self.embedding_model,
                'document_type': 'patent'
            }
        }
    
    def process_patent_documents(self, patent_data_dir: str) -> Dict[str, Any]:
        """Process all patent PDFs in the specified directory."""
        patent_data_path = Path(patent_data_dir)
        
        if not patent_data_path.exists():
            raise FileNotFoundError(f"Patent data directory not found: {patent_data_dir}")
        
        pdf_files = list(patent_data_path.glob("*.pdf"))
        if not pdf_files:
            raise FileNotFoundError(f"No PDF files found in {patent_data_dir}")
        
        logger.info(f"Found {len(pdf_files)} patent PDF files to process")
        
        all_documents = []
        all_chunks = []
        
        for pdf_file in pdf_files:
            document_data = self.process_document(str(pdf_file))
            if document_data:
                all_documents.append(document_data)
                all_chunks.extend(document_data['chunks'])
        
        patent_knowledge_base = {
            'documents': all_documents,
            'all_chunks': all_chunks,
            'metadata': {
                'total_documents': len(all_documents),
                'total_chunks': len(all_chunks),
                'embedding_model': self.embedding_model,
                'embedding_dimension': self.embedding_dimension,
                'processed_at': str(datetime.now()),
                'knowledge_base_type': 'patent'
            }
        }
        
        return patent_knowledge_base
    
    def save_to_pickle(self, data: Dict[str, Any], pickle_path: str):
        """Save processed patent data to pickle file."""
        try:
            with open(pickle_path, 'wb') as f:
                pickle.dump(data, f)
            logger.info(f"Patent knowledge base saved to {pickle_path}")
        except Exception as e:
            logger.error(f"Error saving to pickle: {e}")
            raise

class PatentRAGRetriever:
    """Retrieve relevant chunks from patent documents using embeddings."""
    
    def __init__(self, pickle_path: str):
        """Initialize retriever with pickled patent knowledge base."""
        self.openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.embedding_model = "text-embedding-3-small"
        
        with open(pickle_path, 'rb') as f:
            self.knowledge_base = pickle.load(f)
        
        self.chunks = self.knowledge_base['all_chunks']
        self.embeddings = np.array([chunk['embedding'] for chunk in self.chunks])
        
        logger.info(f"Loaded patent knowledge base with {len(self.chunks)} chunks")
    
    def generate_query_embedding(self, query: str) -> List[float]:
        """Generate embedding for search query."""
        response = self.openai_client.embeddings.create(
            model=self.embedding_model,
            input=query,
            encoding_format="float"
        )
        return response.data[0].embedding
    
    def search_similar_chunks(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Find most similar patent chunks to the query."""
        query_embedding = np.array(self.generate_query_embedding(query)).reshape(1, -1)
        
        # Calculate cosine similarities
        similarities = cosine_similarity(query_embedding, self.embeddings)[0]
        
        # Get top-k most similar chunks
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            chunk = self.chunks[idx]
            results.append({
                'text': chunk['text'],
                'similarity': float(similarities[idx]),
                'document_name': chunk['document_name'],
                'chunk_id': chunk['chunk_id'],
                'metadata': chunk['metadata']
            })
        
        return results

def main():
    """Main function to process patent documents."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Process patent PDF documents and create embeddings")
    parser.add_argument("--patent-data-dir", default="patent_data", 
                       help="Directory containing patent PDF files")
    parser.add_argument("--output-pickle", default="patent_knowledge_base.pkl",
                       help="Output pickle file path")
    
    args = parser.parse_args()
    
    # Initialize processor
    processor = PatentDocumentProcessor()
    
    try:
        # Process documents
        knowledge_base = processor.process_patent_documents(args.patent_data_dir)
        
        # Save to pickle
        processor.save_to_pickle(knowledge_base, args.output_pickle)
        
        # Print summary
        print(f"\n🎉 Successfully processed patent documents!")
        print(f"📄 Documents processed: {knowledge_base['metadata']['total_documents']}")
        print(f"📝 Total chunks created: {knowledge_base['metadata']['total_chunks']}")
        print(f"💾 Saved to: {args.output_pickle}")
        
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        raise

if __name__ == "__main__":
    main()
