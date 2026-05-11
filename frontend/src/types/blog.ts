export type BlogPostCategory = 'articulos' | 'logros' | 'testimonios' | 'estilo-de-vida' | 'mercado';

export type BlogPostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image?: string;
  category: BlogPostCategory;
  status: BlogPostStatus;
  seo_title?: string;
  seo_description?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPostFormData {
  title: string;
  content: string;
  cover_image?: string;
  category: BlogPostCategory;
  status: BlogPostStatus;
  seo_title?: string;
  seo_description?: string;
  published_at?: string;
}
