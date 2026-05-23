-- Phase 4: Retrieval function for similarity search

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  org_id uuid,
  match_count int DEFAULT 5
)
RETURNS TABLE (content text, similarity float)
LANGUAGE sql STABLE
AS $$
  SELECT
    content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE organisation_id = org_id
    AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
