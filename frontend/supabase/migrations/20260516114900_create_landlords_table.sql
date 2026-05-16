CREATE TABLE IF NOT EXISTS landlords (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  dni text,
  phone text,
  email text,
  address text,
  notes text
);

ALTER TABLE landlords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their landlords" ON landlords 
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE tenant_contracts
ADD COLUMN IF NOT EXISTS landlord_id uuid REFERENCES landlords(id);
