// Minimal Supabase Database type to satisfy the typed client
export type Database = {
  public: {
    Tables: {
      properties: {
        Row: import('../types/property').Property;
        Insert: import('../types/property').PropertyInsert;
        Update: import('../types/property').PropertyUpdate;
      };
    };
  };
};
