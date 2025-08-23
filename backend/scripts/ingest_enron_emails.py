#!/usr/bin/env python3
"""
Enron Email Dataset Ingestion Script

This script:
1. Downloads the Enron email dataset from Kaggle
2. Processes the first 50,000 emails
3. Creates embeddings using OpenAI's text-embedding-3-small
4. Stores the embeddings in Convex vector database

Usage:
    python ingest_enron_emails.py

Requirements:
    - OPENAI_API_KEY environment variable
    - CONVEX_URL environment variable  
    - pip install kagglehub pandas openai python-dotenv convex psutil
    
Environment variables:
    - MAX_EMAILS: Number of emails to process (default: 1000)
    - Set to smaller values like 100 for testing
"""

import os
import sys
import json
import time
import asyncio
import csv
from datetime import datetime
from typing import List, Dict, Any, Optional
from email import message_from_string
from email.message import EmailMessage
import re

# Third-party imports
import kagglehub
from kagglehub import KaggleDatasetAdapter
import openai
from openai import OpenAI
from dotenv import load_dotenv
from convex import ConvexClient
import gc  # For memory cleanup
import psutil  # For memory monitoring
import logging  # For detailed logging

# Load environment variables
load_dotenv()

# Setup minimal logging to avoid memory issues
logging.basicConfig(
    level=logging.WARNING,  # Only log warnings and errors
    format='%(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]  # Only console, no file
)
logger = logging.getLogger(__name__)

# Ultra-lightweight configuration for memory-constrained environments
MAX_EMAILS = int(os.getenv("MAX_EMAILS", "100"))  # Very small default
BATCH_SIZE = 1  # Process one email at a time to minimize memory
EMBED_BATCH_SIZE = int(os.getenv("EMBED_BATCH_SIZE", "64"))  # Batch embeddings per request
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "300"))  # Tunable chunk size
OVERLAP_SIZE = int(os.getenv("OVERLAP_SIZE", "0"))  # Tunable overlap
MEMORY_LIMIT_MB = int(os.getenv("MEMORY_LIMIT_MB", "512"))  # Realistic default
CONCURRENCY = int(os.getenv("EMBED_CONCURRENCY", "4"))  # Parallel embedding workers
MAX_QUEUE_SIZE = int(os.getenv("MAX_QUEUE_SIZE", "1000"))  # Bounded queue to cap memory
LOG_EVERY_N = int(os.getenv("LOG_EVERY_N", "1000"))  # Print progress every N emails/chunks

class EnronEmailIngester:
    def __init__(self):
        """Initialize the ingester with API clients"""
        # Validate environment variables
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.convex_url = os.getenv("CONVEX_URL")
        
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        if not self.convex_url:
            raise ValueError("CONVEX_URL environment variable is required")
        
        # Initialize clients
        self.openai_client = OpenAI(api_key=self.openai_api_key)
        self.convex_client = ConvexClient(self.convex_url)
        self.doc_queue = asyncio.Queue(maxsize=MAX_QUEUE_SIZE)
        
        # Stats tracking
        self.stats = {
            "total_emails": 0,
            "processed_emails": 0,
            "embedded_chunks": 0,
            "skipped_emails": 0,
            "errors": 0,
            "start_time": None,
            "end_time": None,
            "memory_cleanups": 0
        }
    
    def get_memory_usage_mb(self) -> float:
        """Get current memory usage in MB"""
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024
    
    def check_memory_and_cleanup(self) -> bool:
        """Check memory usage and force cleanup if needed"""
        memory_mb = self.get_memory_usage_mb()
        if memory_mb > MEMORY_LIMIT_MB:
            print(f"🧹 Memory usage ({memory_mb:.1f}MB) exceeds limit ({MEMORY_LIMIT_MB}MB), forcing cleanup...")
            gc.collect()
            self.stats["memory_cleanups"] += 1
            new_memory_mb = self.get_memory_usage_mb()
            print(f"   Memory after cleanup: {new_memory_mb:.1f}MB")
            return True
        return False
    
    def parse_email(self, email_content: str) -> Dict[str, Any]:
        """Parse email content and extract metadata"""
        try:
            # Try to parse as email
            msg = message_from_string(email_content)
            
            # Extract metadata
            metadata = {
                "sender": self.clean_text(msg.get("From", "")),
                "recipient": self.clean_text(msg.get("To", "")),
                "subject": self.clean_text(msg.get("Subject", "")),
                "date": self.clean_text(msg.get("Date", "")),
                "messageId": self.clean_text(msg.get("Message-ID", ""))
            }
            
            # Extract content
            content = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        payload = part.get_payload(decode=True)
                        if payload:
                            content += payload.decode('utf-8', errors='ignore')
            else:
                payload = msg.get_payload(decode=True)
                if payload:
                    content = payload.decode('utf-8', errors='ignore')
                else:
                    content = str(msg.get_payload())
            
            # Clean and validate content
            content = self.clean_text(content)
            
            if len(content.strip()) < 10:  # Skip very short content
                return None
                
            return {
                "content": content,
                "metadata": metadata
            }
            
        except Exception as e:
            logger.warning(f"Error parsing email: {e}")
            return None
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove non-printable characters
        text = ''.join(char for char in text if char.isprintable() or char.isspace())
        
        # Trim and return
        return text.strip()
    
    def chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks"""
        if len(text) <= CHUNK_SIZE:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + CHUNK_SIZE
            if end > len(text):
                end = len(text)
            
            chunk = text[start:end]
            
            # Try to break at sentence boundaries
            if end < len(text):
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                
                if break_point > start + CHUNK_SIZE * 0.7:  # Only break if reasonable position
                    chunk = text[start:start + break_point + 1]
                    end = start + break_point + 1
            
            chunks.append(chunk.strip())
            start = end - OVERLAP_SIZE
            
            if start >= len(text):
                break
        
        valid_chunks = [chunk for chunk in chunks if len(chunk.strip()) > 10]
        return valid_chunks
    
    async def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings for a batch of texts"""
        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )
            
            embeddings = [embedding.embedding for embedding in response.data]
            return embeddings
            
        except Exception as e:
            print(f"Error creating embeddings: {e}")
            raise
    
    async def store_documents_batch(self, documents: List[Dict[str, Any]]) -> bool:
        """Store a batch of documents in Convex"""
        try:
            logger.info(f"Storing {len(documents)} documents in Convex")
            # Prepare documents for Convex
            convex_docs = []
            for doc in documents:
                convex_doc = {
                    "content": doc["content"],
                    "embedding": doc["embedding"],
                    "metadata": {
                        "sender": doc["metadata"].get("sender"),
                        "recipient": doc["metadata"].get("recipient"),
                        "subject": doc["metadata"].get("subject"), 
                        "date": doc["metadata"].get("date"),
                        "messageId": doc["metadata"].get("messageId"),
                        "originalIndex": doc["metadata"]["originalIndex"]
                    }
                }
                convex_docs.append(convex_doc)
                logger.debug(f"Prepared document: sender={convex_doc['metadata']['sender']}, content_length={len(convex_doc['content'])}")
            
            # Store in Convex using batch insert
            logger.info("Calling Convex batchInsertDocuments mutation")
            result = self.convex_client.mutation("documents:batchInsertDocuments", {
                "documents": convex_docs
            })
            
            logger.info(f"Successfully stored {len(documents)} documents, result: {result}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing documents in Convex: {e}")
            print(f"Error storing documents in Convex: {e}")
            return False

    async def worker(self, worker_id: int) -> None:
        """Worker that batches docs from the queue, embeds and stores them."""
        backoff_seconds = 1.0
        while True:
            batch: List[Dict[str, Any]] = []
            # Block for at least one item or sentinel
            doc = await self.doc_queue.get()
            if doc is None:
                # Re-propagate sentinel for other workers and exit
                await self.doc_queue.put(None)
                self.doc_queue.task_done()
                break
            batch.append(doc)
            self.doc_queue.task_done()

            # Try to top up the batch without blocking
            try:
                while len(batch) < EMBED_BATCH_SIZE:
                    next_doc = self.doc_queue.get_nowait()
                    if next_doc is None:
                        # Put back sentinel for other workers and stop topping up
                        await self.doc_queue.put(None)
                        self.doc_queue.task_done()
                        break
                    batch.append(next_doc)
                    self.doc_queue.task_done()
            except asyncio.QueueEmpty:
                pass

            # Embed with simple retry on rate limits/transient errors
            for attempt in range(5):
                try:
                    texts = [d["content"] for d in batch]
                    embeddings = await self.create_embeddings(texts)
                    for d, emb in zip(batch, embeddings):
                        d["embedding"] = emb
                    # Store immediately
                    await self.store_documents_batch(batch)
                    self.stats["embedded_chunks"] += len(batch)
                    gc.collect()
                    break
                except Exception as e:
                    # Backoff for 429s or transient failures
                    wait = min(backoff_seconds * (2 ** attempt), 30.0)
                    print(f"⚠️  Worker {worker_id}: embed/store failed (attempt {attempt+1}), retrying in {wait:.1f}s: {e}")
                    await asyncio.sleep(wait)
            # yield control
            await asyncio.sleep(0)
    
    async def process_email_batch(self, email_batch: List[Dict[str, Any]]) -> int:
        """Process a batch of emails: parse and enqueue chunk docs; workers embed/store."""
        processed_count = 0
        
        # Process each email individually to avoid memory accumulation
        for email_data in email_batch:
            try:
                # Parse email
                parsed = self.parse_email(email_data["content"])
                if not parsed:
                    self.stats["skipped_emails"] += 1
                    continue
                
                # Create chunks and enqueue for workers
                chunks = self.chunk_text(parsed["content"])
                if not chunks:
                    self.stats["skipped_emails"] += 1
                    continue
                
                for chunk in chunks:
                    doc = {
                        "content": chunk,
                        "metadata": {
                            **parsed["metadata"],
                            "originalIndex": email_data["index"],
                        },
                    }
                    await self.doc_queue.put(doc)
                
                processed_count += 1
                # Periodic progress log
                if processed_count % LOG_EVERY_N == 0:
                    print(f"Processed emails so far in this batch: {processed_count}")
                # Force cleanup after each email to minimize memory
                gc.collect()
            except Exception as e:
                print(f"Error processing email {email_data['index']}: {e}")
                self.stats["errors"] += 1
        
        return processed_count
    
    async def process_chunk_batch(self, chunk_docs: List[Dict[str, Any]]):
        """Process a small batch of chunks"""
        try:
            logger.info(f"Processing chunk batch of {len(chunk_docs)} chunks")
            texts = [doc["content"] for doc in chunk_docs]
            
            # Create embeddings
            embeddings = await self.create_embeddings(texts)
            
            # Add embeddings to documents
            for doc, embedding in zip(chunk_docs, embeddings):
                doc["embedding"] = embedding
            
            # Store in Convex immediately
            success = await self.store_documents_batch(chunk_docs)
            
            if success:
                self.stats["embedded_chunks"] += len(chunk_docs)
                if self.stats["embedded_chunks"] % LOG_EVERY_N == 0:
                    logger.info(f"Successfully stored chunks: total {self.stats['embedded_chunks']}")
                    print(f"  ✅ Stored chunks total: {self.stats['embedded_chunks']}")
            else:
                logger.error(f"Failed to store {len(chunk_docs)} chunks")
                print(f"  ❌ Failed to store {len(chunk_docs)} chunks")
                self.stats["errors"] += len(chunk_docs)
            
            # Small delay to avoid rate limits and force cleanup
            await asyncio.sleep(0.05)
            gc.collect()
            logger.debug("Performed garbage collection after chunk batch")
            
        except Exception as e:
            logger.error(f"Error processing chunk batch: {e}")
            print(f"Error processing chunk batch: {e}")
            self.stats["errors"] += len(chunk_docs)
    
    async def run_ingestion(self):
        """Main ingestion process"""
        print("🚀 Starting Enron Email Ingestion")
        print("=" * 50)
        
        self.stats["start_time"] = datetime.now()
        
        try:
            # Download dataset path (more memory efficient)
            print("📥 Downloading Enron email dataset from Kaggle...")
            dataset_path = kagglehub.dataset_download("wcukierski/enron-email-dataset")
            csv_path = os.path.join(dataset_path, "emails.csv")
            
            print(f"📁 Dataset downloaded to: {csv_path}")
            
            # Skip full CSV counting to save memory; process up to MAX_EMAILS
            emails_to_process = MAX_EMAILS
            print(f"🎯 Processing up to {emails_to_process:,} emails (skipping full count to save memory)")
            
            self.stats["total_emails"] = emails_to_process
            
            # Check existing documents in Convex
            try:
                existing_count = self.convex_client.query("documents:getDocumentsCount")
                print(f"📚 Existing documents in Convex: {existing_count}")
                
                if existing_count > 0:
                    response = input("Documents already exist. Continue anyway? (y/N): ")
                    if response.lower() != 'y':
                        print("Aborted by user")
                        return
            except Exception as e:
                print(f"⚠️  Could not check existing documents: {e}")
            
            # Open CSV file for streaming processing
            print("📝 Opening CSV file for streaming processing...")
            
            # Start embedding workers
            worker_tasks = [asyncio.create_task(self.worker(i)) for i in range(CONCURRENCY)]

            with open(csv_path, 'r', encoding='utf-8', errors='ignore') as csvfile:
                reader = csv.DictReader(csvfile)
                
                # Determine content column
                content_column = None
                fieldnames = reader.fieldnames or []
                for col in ['message', 'content', 'body', 'text']:
                    if col in fieldnames:
                        content_column = col
                        break
                
                if not content_column and fieldnames:
                    content_column = fieldnames[0]  # Use first column
                
                if not content_column:
                    raise ValueError("No suitable content column found in dataset")
                
                print(f"📝 Using column '{content_column}' for email content")
                
                # Process in batches using streaming
                batch_count = 0
                email_batch = []
                emails_processed_total = 0
                
                for row_idx, row in enumerate(reader):
                    if emails_processed_total >= emails_to_process:
                        logger.info(f"Reached target of {emails_to_process} emails, stopping")
                        break
                    
                    email_content = row.get(content_column, '')
                    logger.debug(f"Row {row_idx}: email_content length = {len(email_content) if email_content else 0}")
                    
                    if email_content and email_content.strip() and email_content != 'nan':
                        email_batch.append({
                            "index": row_idx,
                            "content": email_content
                        })
                        logger.debug(f"Added email {row_idx} to batch (batch size now: {len(email_batch)})")
                    else:
                        logger.debug(f"Skipped row {row_idx}: empty or invalid email content")
                    
                    # Process batch when it reaches BATCH_SIZE
                    if len(email_batch) >= BATCH_SIZE:
                        batch_count += 1
                        print(f"\n📦 Processing batch {batch_count} ({len(email_batch)} emails)...")
                        
                        # Process batch
                        logger.info(f"Starting to process batch {batch_count} with {len(email_batch)} emails")
                        processed = await self.process_email_batch(email_batch)
                        self.stats["processed_emails"] += processed
                        emails_processed_total += len(email_batch)
                        
                        # Progress update (throttled by LOG_EVERY_N)
                        if emails_processed_total % LOG_EVERY_N == 0:
                            progress = (emails_processed_total / emails_to_process) * 100
                            memory_mb = self.get_memory_usage_mb()
                            print(f"📈 Progress: {progress:.1f}% ({emails_processed_total:,}/{emails_to_process:,}) | Memory: {memory_mb:.1f}MB")
                            print(f"📊 Processed: {self.stats['processed_emails']:,} emails, "
                                  f"{self.stats['embedded_chunks']:,} chunks, "
                                  f"{self.stats['errors']} errors")
                        
                        logger.info(f"Batch {batch_count} completed: {processed} emails processed successfully")
                        
                        # Check memory and cleanup if needed
                        self.check_memory_and_cleanup()
                        
                        # Clear batch and small delay
                        email_batch = []
                        await asyncio.sleep(0.5)
                
                # Process remaining emails in final batch
                if email_batch and emails_processed_total < emails_to_process:
                    batch_count += 1
                    print(f"\n📦 Processing final batch {batch_count} ({len(email_batch)} emails)...")
                    processed = await self.process_email_batch(email_batch)
                    self.stats["processed_emails"] += processed

            # Signal workers to stop and wait for queue to drain
            for _ in range(CONCURRENCY):
                await self.doc_queue.put(None)
            await self.doc_queue.join()
            await asyncio.gather(*worker_tasks, return_exceptions=True)
            
            self.stats["end_time"] = datetime.now()
            self.print_final_stats()
            
        except Exception as e:
            print(f"❌ Error during ingestion: {e}")
            import traceback
            traceback.print_exc()
            self.stats["end_time"] = datetime.now()
            self.print_final_stats()
    
    def print_final_stats(self):
        """Print final ingestion statistics"""
        print("\n" + "=" * 50)
        print("📊 INGESTION COMPLETE")
        print("=" * 50)
        
        duration = self.stats["end_time"] - self.stats["start_time"]
        
        print(f"⏱️  Duration: {duration}")
        print(f"📧 Total emails targeted: {self.stats['total_emails']:,}")
        print(f"✅ Emails processed: {self.stats['processed_emails']:,}")
        print(f"📝 Chunks embedded: {self.stats['embedded_chunks']:,}")
        print(f"⏭️  Emails skipped: {self.stats['skipped_emails']:,}")
        print(f"❌ Errors: {self.stats['errors']:,}")
        print(f"🧹 Memory cleanups: {self.stats['memory_cleanups']:,}")
        
        # Log final summary
        logger.info("=" * 50)
        logger.info("FINAL INGESTION STATS")
        logger.info(f"Duration: {duration}")
        logger.info(f"Total emails targeted: {self.stats['total_emails']:,}")
        logger.info(f"Emails processed: {self.stats['processed_emails']:,}")
        logger.info(f"Chunks embedded: {self.stats['embedded_chunks']:,}")
        logger.info(f"Emails skipped: {self.stats['skipped_emails']:,}")
        logger.info(f"Errors: {self.stats['errors']:,}")
        logger.info(f"Memory cleanups: {self.stats['memory_cleanups']:,}")
        logger.info("=" * 50)
        
        if self.stats["processed_emails"] > 0:
            success_rate = (self.stats["processed_emails"] / self.stats["total_emails"]) * 100
            print(f"📈 Success rate: {success_rate:.1f}%")
            
            chunks_per_email = self.stats["embedded_chunks"] / self.stats["processed_emails"]
            print(f"📄 Avg chunks per email: {chunks_per_email:.1f}")
        
        print(f"\n🎉 Ingestion complete! {self.stats['embedded_chunks']:,} document chunks now available for RAG")

async def main():
    """Main entry point"""
    try:
        ingester = EnronEmailIngester()
        await ingester.run_ingestion()
    except KeyboardInterrupt:
        print("\n⏹️  Ingestion interrupted by user")
    except Exception as e:
        print(f"💥 Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Check dependencies
    required_env_vars = ["OPENAI_API_KEY", "CONVEX_URL"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("\nPlease set these in your .env file:")
        for var in missing_vars:
            print(f"  {var}=your_value_here")
        sys.exit(1)
    
    print("🔍 Environment check passed")
    asyncio.run(main())
