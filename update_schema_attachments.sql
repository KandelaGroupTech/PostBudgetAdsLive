-- Add attachment columns to ads table
alter table ads 
add column attachment_url text,
add column attachment_type text check (attachment_type in ('image', 'document'));

-- Create storage bucket for ad attachments
insert into storage.buckets (id, name, public) 
values ('ad-attachments', 'ad-attachments', true);

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Policy: Allow public read access to all files in ad-attachments
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'ad-attachments' );

-- Policy: Allow anon uploads (for ad submission)
create policy "Anon Uploads"
on storage.objects for insert
with check ( bucket_id = 'ad-attachments' );

-- Policy: Allow admins (service role) to delete
create policy "Admin Delete"
on storage.objects for delete
using ( bucket_id = 'ad-attachments' );
