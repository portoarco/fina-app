-- buat function baru / replace di supabase
-- menerima 3 parameter input
CREATE OR REPLACE FUNCTION match_transactions (
  query_embedding vector(768),
    -- query_embedding: representasi vektor yang sedang dicari, dihasilkan oleh model
    match_threshold float,
    -- match_threshold: nilai batas bawah untuk skor kemiripan, ex. transaksi dgn tk kemiripan 80% atau 0.8 
    match_count int
    -- match_count : jumlah data yang ingin dikembalikan, atau disebut LIMIT
    
)
-- ketika AI temukan data, maka return :...
RETURNS TABLE(
    id uuid,
    type text,
    category text,
    amount numeric,
    description text,
    date date,
    user_id uuid,
    similarity float
)
-- logic untuk pencarian, TIDAK UBAH DATA APAPUN, dan hasilnya harus sama pada satu waktu, shg membantu db utk optimasi kinerja
LANGUAGE sql STABLE
AS $$
    SELECT 
        transactions.id,
        transactions.type,
        transactions.category,
        transactions.amount,
        transactions.description,
        transactions.date,
        transactions.user_id,
        1 - (transactions.embedding <=> query_embedding) AS similarity
        -- <=> operator khusus pgvector untuk hitung cosine/cosinus distance antar vektor transaksi yang ada di vector db dengan pencarian vektor/query_embbeding, semakin kecil, maka semakin mirip
        -- 1 - COSINE distance utk ubah jarak menjadi skor kemiripan
    FROM transactions
    WHERE 1 - (transactions.embedding <=> query_embedding) > match_threshold 
    -- fungsinya untuk saring spy sistem hanya ambil yang nilainya lebih dari threshold  
    ORDER BY transactions.embedding <=> query_embedding
    -- diurutkan dari yang paling mirip
    LIMIT match_count 
    -- limit berdasarkan match_count
$$;
