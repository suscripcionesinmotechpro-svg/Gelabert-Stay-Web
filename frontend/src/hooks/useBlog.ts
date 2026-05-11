import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { BlogPost, BlogPostFormData } from '../types/blog';
import toast from 'react-hot-toast';

export const useBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async (filters?: { status?: string; category?: string }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching blog posts:', error);
      toast.error('Error al cargar los artículos del blog');
    } finally {
      setLoading(false);
    }
  }, []);

  const getPost = async (id: string): Promise<BlogPost | null> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching post:', error);
      toast.error('Error al cargar el artículo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (data: BlogPostFormData): Promise<string | null> => {
    try {
      setLoading(true);
      
      // Auto-generate slug from title
      const slug = data.title
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // Auto-generate SEO
      const seo_title = data.seo_title || data.title;
      // Strip HTML tags for description and limit to 160 chars
      const plainTextContent = data.content.replace(/<[^>]*>?/gm, '').trim();
      const seo_description = data.seo_description || (plainTextContent.substring(0, 157) + '...');

      const postData = {
        ...data,
        slug,
        seo_title,
        seo_description,
        published_at: data.status === 'published' && !data.published_at ? new Date().toISOString() : data.published_at
      };

      const { data: newPost, error } = await supabase
        .from('blog_posts')
        .insert([postData])
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation for slug
          toast.error('Ya existe un artículo con ese título o slug similar');
        } else {
          throw error;
        }
        return null;
      }
      
      toast.success('Artículo creado con éxito');
      await fetchPosts();
      return newPost.id;
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error('Error al crear el artículo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (id: string, data: Partial<BlogPostFormData>): Promise<boolean> => {
    try {
      setLoading(true);

      const updateData: any = { ...data };
      
      // Update slug if title changed (optional, sometimes we don't want to break URLs)
      // Let's only update slug if explicitly asked, or if title changed significantly?
      // Better to keep slug stable. We will only auto-generate it on creation.
      
      if (data.status === 'published' && !data.published_at) {
         updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Artículo actualizado con éxito');
      await fetchPosts();
      return true;
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast.error('Error al actualizar el artículo');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Artículo eliminado con éxito');
      await fetchPosts();
      return true;
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error('Error al eliminar el artículo');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `blog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images') // Using existing properties bucket, but inside 'blog/' folder
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    posts,
    loading,
    fetchPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    uploadImage
  };
};
