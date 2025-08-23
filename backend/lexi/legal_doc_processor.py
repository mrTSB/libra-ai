#!/usr/bin/env python3
"""
Legal Document Processing and Embedding System
Processes PDF legal documents, creates embeddings, and saves to pickle files.
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

class LegalDocumentProcessor:
    """Process legal documents and create embeddings for RAG system."""
    
    def __init__(self, openai_api_key: str = None):
        """Initialize the processor with OpenAI client."""
        self.openai_client = openai.OpenAI(
            api_key=openai_api_key or os.getenv("OPENAI_API_KEY")
        )
        self.embedding_model = "text-embedding-3-small"
        self.embedding_dimension = 1536
        
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text content from a PDF file."""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                logger.info(f"PDF has {len(pdf_reader.pages)} pages")
                
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
                        else:
                            logger.warning(f"No text found on page {page_num + 1}")
                    except Exception as e:
                        logger.warning(f"Error extracting page {page_num + 1}: {e}")
                        continue
                
                if not text.strip():
                    logger.error(f"No text extracted from {pdf_path}")
                
                return text
        except Exception as e:
            logger.error(f"Error reading PDF {pdf_path}: {e}")
            return ""
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove page markers but keep section info
        text = re.sub(r'\n--- Page \d+ ---\n', '\n', text)
        
        # Fix common PDF extraction issues
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)  # Split merged words
        text = re.sub(r'(\w)(\d+\.\d+)', r'\1 \2', text)  # Separate text from section numbers
        
        # Normalize quotes
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        
        return text.strip()
    
    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[Dict[str, Any]]:
        """Split text into overlapping chunks for better retrieval."""
        chunks = []
        # Split into sentences more safely
        try:
            sentences = re.split(r'(?<=[.!?])\s+', text)
        except re.error:
            # Fallback to simpler splitting if regex fails
            sentences = text.split('. ')
            sentences = [s + '.' for s in sentences[:-1]] + [sentences[-1]]
        
        current_chunk = ""
        current_size = 0
        chunk_index = 0
        
        for sentence in sentences:
            sentence_size = len(sentence)
            
            # If adding this sentence would exceed chunk size, save current chunk
            if current_size + sentence_size > chunk_size and current_chunk:
                chunks.append({
                    'index': chunk_index,
                    'text': current_chunk.strip(),
                    'size': current_size,
                    'start_sentence': chunk_index * (chunk_size - overlap) // 100  # Approximate
                })
                
                # Start new chunk with overlap
                overlap_text = self._get_overlap_text(current_chunk, overlap)
                current_chunk = overlap_text + " " + sentence
                current_size = len(current_chunk)
                chunk_index += 1
            else:
                current_chunk += " " + sentence if current_chunk else sentence
                current_size += sentence_size
        
        # Add final chunk
        if current_chunk:
            chunks.append({
                'index': chunk_index,
                'text': current_chunk.strip(),
                'size': current_size,
                'start_sentence': chunk_index * (chunk_size - overlap) // 100
            })
        
        return chunks
    
    def _get_overlap_text(self, text: str, overlap_size: int) -> str:
        """Get the last portion of text for overlap."""
        if len(text) <= overlap_size:
            return text
        
        # Try to break at sentence boundary
        overlap_text = text[-overlap_size:]
        sentence_start = overlap_text.find('. ')
        
        if sentence_start > 0:
            return overlap_text[sentence_start + 2:]
        
        return overlap_text
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a piece of text."""
        try:
            response = self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=text,
                encoding_format="float"
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * self.embedding_dimension
    
    def process_document(self, pdf_path: str, document_name: str = None) -> Dict[str, Any]:
        """Process a single PDF document."""
        if document_name is None:
            document_name = Path(pdf_path).stem
        
        logger.info(f"Processing document: {document_name}")
        
        # Extract text
        raw_text = self.extract_text_from_pdf(pdf_path)
        if not raw_text:
            logger.error(f"No text extracted from {pdf_path}")
            return None
        
        # Clean text
        clean_text = self.clean_text(raw_text)
        
        # Create chunks
        chunks = self.chunk_text(clean_text)
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
                    'start_sentence': chunk.get('start_sentence', 0)
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
                'embedding_model': self.embedding_model
            }
        }
    
    def process_legal_documents(self, law_data_dir: str) -> Dict[str, Any]:
        """Process all PDF documents in the law_data directory."""
        law_data_path = Path(law_data_dir)
        
        if not law_data_path.exists():
            raise FileNotFoundError(f"Law data directory not found: {law_data_dir}")
        
        pdf_files = list(law_data_path.glob("*.pdf"))
        if not pdf_files:
            raise FileNotFoundError(f"No PDF files found in {law_data_dir}")
        
        logger.info(f"Found {len(pdf_files)} PDF files to process")
        
        all_documents = []
        all_chunks = []
        
        for pdf_file in pdf_files:
            document_data = self.process_document(str(pdf_file))
            if document_data:
                all_documents.append(document_data)
                all_chunks.extend(document_data['chunks'])
        
        legal_knowledge_base = {
            'documents': all_documents,
            'all_chunks': all_chunks,
            'metadata': {
                'total_documents': len(all_documents),
                'total_chunks': len(all_chunks),
                'embedding_model': self.embedding_model,
                'embedding_dimension': self.embedding_dimension,
                'processed_at': str(datetime.now())
            }
        }
        
        return legal_knowledge_base
    
    def save_to_pickle(self, data: Dict[str, Any], pickle_path: str):
        """Save processed data to pickle file."""
        try:
            with open(pickle_path, 'wb') as f:
                pickle.dump(data, f)
            logger.info(f"Legal knowledge base saved to {pickle_path}")
        except Exception as e:
            logger.error(f"Error saving to pickle: {e}")
            raise

class LegalRAGRetriever:
    """Retrieve relevant chunks from legal documents using embeddings."""
    
    def __init__(self, pickle_path: str):
        """Initialize retriever with pickled knowledge base."""
        self.openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.embedding_model = "text-embedding-3-small"
        
        with open(pickle_path, 'rb') as f:
            self.knowledge_base = pickle.load(f)
        
        self.chunks = self.knowledge_base['all_chunks']
        self.embeddings = np.array([chunk['embedding'] for chunk in self.chunks])
        
        logger.info(f"Loaded knowledge base with {len(self.chunks)} chunks")
    
    def generate_query_embedding(self, query: str) -> List[float]:
        """Generate embedding for search query."""
        response = self.openai_client.embeddings.create(
            model=self.embedding_model,
            input=query,
            encoding_format="float"
        )
        return response.data[0].embedding
    
    def search_similar_chunks(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Find most similar chunks to the query."""
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
    """Main function to process legal documents."""
    import argparse
    parser = argparse.ArgumentParser(description='Process legal documents and create embeddings')
    parser.add_argument('--law-data-dir', default='law_data', help='Directory containing PDF legal documents')
    parser.add_argument('--output-pickle', default='legal_knowledge_base.pkl', help='Output pickle file path')
    
    args = parser.parse_args()
    
    # Initialize processor
    processor = LegalDocumentProcessor()
    
    try:
        # Process all documents
        knowledge_base = processor.process_legal_documents(args.law_data_dir)
        
        # Save to pickle
        processor.save_to_pickle(knowledge_base, args.output_pickle)
        
        logger.info("Legal document processing completed successfully!")
        logger.info(f"Processed {knowledge_base['metadata']['total_documents']} documents")
        logger.info(f"Created {knowledge_base['metadata']['total_chunks']} chunks")
        
    except Exception as e:
        logger.error(f"Error processing legal documents: {e}")
        raise

if __name__ == "__main__":
    main()
