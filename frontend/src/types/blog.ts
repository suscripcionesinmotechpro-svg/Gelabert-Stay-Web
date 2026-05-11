export type BlogPostCategory = 'articulos' | 'logros' | 'testimonios' | 'estilo-de-vida' | 'mercado';

export type BlogPostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  title: string;
  title_en?: string;
  slug: string;
  content: string;
  content_en?: string;
  cover_image?: string;
  cover_video?: string;
  category: BlogPostCategory;
  status: BlogPostStatus;
  seo_title?: string;
  seo_title_en?: string;
  seo_description?: string;
  seo_description_en?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPostFormData {
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  cover_image?: string;
  cover_video?: string;
  category: BlogPostCategory;
  status: BlogPostStatus;
  seo_title?: string;
  seo_title_en?: string;
  seo_description?: string;
  seo_description_en?: string;
  published_at?: string;
}
