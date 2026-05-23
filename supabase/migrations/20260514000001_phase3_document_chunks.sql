-- Phase 3: RAG Engine — document chunks with vector embeddings

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Document chunks table
CREATE TABLE public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read their chunks"
  ON public.document_chunks FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Index for fast similarity search
CREATE INDEX ON public.document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
