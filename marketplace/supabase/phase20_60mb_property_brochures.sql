-- Phase 20: Raise the private property-brochures bucket's per-file limit to 60 MiB.
-- Run this in Supabase SQL Editor before deploying the updated frontend.
-- 60 * 1024 * 1024 = 62,914,560 bytes.
-- The frontend continues to limit floor-plan PDFs to 10 MiB.
-- The Supabase project-wide maximum file size must also be >= 60 MiB.
update storage.buckets
set file_size_limit = 62914560,
    allowed_mime_types = array['application/pdf']::text[]
where id = 'property-brochures';

-- Verify:
select id, file_size_limit, allowed_mime_types
from storage.buckets where id = 'property-brochures';
