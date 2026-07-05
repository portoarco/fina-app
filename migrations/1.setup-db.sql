-- setup pg vector extension
CREATE EXTENSION IF NOT EXISTS vector;

--create table transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    --gen_random_uuid itu fungsi bawaan supabase
    type TEXT NOT NULL CHECK (type IN ('income','expense')),
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    -- user id itu sifatnya opsional utk sekarang, bisa dipakai kalau mau aktifkan auth login/register system
    embedding VECTOR(768),
    -- 768 menunjukkan dimensi vector
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- aktivasi sistem RLS (Row level security)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- create policy access untuk semua diperbolehkan
CREATE POLICY "Permissive rules for all" ON public.transactions 
    FOR ALL USING (true);

-- kalau jika sudah ada sistem auth dan punya policy sendiri, maka
-- CREATE POLICY "User can manage their own transactions" ON public.transactions 
--     FOR ALL USING (auth.id() = user_id)