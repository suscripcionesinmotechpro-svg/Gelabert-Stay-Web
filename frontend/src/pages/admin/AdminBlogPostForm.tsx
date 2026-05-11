import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// removed unused import
import { Save, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useBlog } from '../../hooks/useBlog';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import type { BlogPostFormData } from '../../types/blog';

export const AdminBlogPostForm = () => {
  // t removed
  const navigate = useNavigate();
  const { id } = useParams();
  const { getPost, createPost, updatePost, uploadImage, loading } = useBlog();

  const [formData, setFormData] = useState<BlogPostFormData>({
    title: '',
    content: '',
    category: 'articulos',
    status: 'draft',
    seo_title: '',
    seo_description: '',
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    const post = await getPost(id!);
    if (post) {
      setFormData({
        title: post.title,
        content: post.content,
        category: post.category,
        status: post.status,
        seo_title: post.seo_title || '',
        seo_description: post.seo_description || '',
      });
      if (post.cover_image) {
        setCoverPreview(post.cover_image);
      }
    } else {
      navigate('/admin/blog');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('El título y el contenido son obligatorios');
      return;
    }

    let coverUrl = formData.cover_image;
    if (coverFile) {
      const uploadedUrl = await uploadImage(coverFile);
      if (uploadedUrl) {
        coverUrl = uploadedUrl;
      }
    }

    const finalData = { ...formData, cover_image: coverUrl };

    if (id) {
      await updatePost(id, finalData);
      navigate('/admin/blog');
    } else {
      const newId = await createPost(finalData);
      if (newId) {
        navigate('/admin/blog');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/blog')}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-secondary text-[#FAF8F5] uppercase tracking-widest">
              {id ? 'Editar Artículo' : 'Nuevo Artículo'}
            </h1>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-[#C9A962] text-black px-6 py-2 rounded-sm font-bold uppercase tracking-widest hover:bg-[#B89A58] transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1A1A1A] p-6 rounded-sm border border-white/10 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#A3A3A3] mb-1">Título del Artículo *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm p-3 text-lg font-bold text-[#FAF8F5] focus:border-[#C9A962] focus:outline-none transition-colors"
                placeholder="Ej: Tendencias del mercado inmobiliario..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#A3A3A3] mb-2">Contenido *</label>
              <div className="border border-white/10 rounded-sm overflow-hidden bg-[#0A0A0A]">
                {/* Asumimos que RichTextEditor está implementado */}
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Escribe tu artículo aquí..."
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] p-6 rounded-sm border border-white/10 space-y-4">
            <h3 className="text-lg font-secondary uppercase tracking-widest text-[#FAF8F5]">Optimización SEO</h3>
            <p className="text-sm text-[#A3A3A3]">Si los dejas vacíos, se generarán automáticamente desde el título y el contenido.</p>
            
            <div>
              <label className="block text-sm font-medium text-[#A3A3A3] mb-1">Meta Título (SEO)</label>
              <input
                type="text"
                value={formData.seo_title}
                onChange={e => setFormData({ ...formData, seo_title: e.target.value })}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm p-2 text-[#FAF8F5] focus:border-[#C9A962] focus:outline-none"
                placeholder="Título para Google..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A3A3A3] mb-1">Meta Descripción (SEO)</label>
              <textarea
                value={formData.seo_description}
                onChange={e => setFormData({ ...formData, seo_description: e.target.value })}
                rows={3}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm p-2 text-[#FAF8F5] focus:border-[#C9A962] focus:outline-none"
                placeholder="Breve resumen del artículo para los buscadores..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1A1A1A] p-6 rounded-sm border border-white/10 space-y-4">
            <h3 className="text-lg font-secondary uppercase tracking-widest text-[#FAF8F5]">Configuración</h3>
            
            <div>
              <label className="block text-sm font-medium text-[#A3A3A3] mb-1">Estado</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm p-2 text-[#FAF8F5] focus:border-[#C9A962] focus:outline-none"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A3A3A3] mb-1">Categoría</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm p-2 text-[#FAF8F5] focus:border-[#C9A962] focus:outline-none"
              >
                <option value="articulos">Artículos</option>
                <option value="logros">Logros de Empresa</option>
                <option value="testimonios">Testimonios</option>
                <option value="estilo-de-vida">Estilo de Vida</option>
                <option value="mercado">Mercado Inmobiliario</option>
              </select>
            </div>
          </div>

          <div className="bg-[#1A1A1A] p-6 rounded-sm border border-white/10 space-y-4">
            <h3 className="text-lg font-secondary uppercase tracking-widest text-[#FAF8F5]">Imagen de Portada</h3>
            
            <div className="relative group">
              {coverPreview ? (
                <div className="relative w-full aspect-video rounded-sm overflow-hidden border border-white/10">
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <label className="cursor-pointer bg-[#C9A962] text-black px-4 py-2 rounded-sm font-bold text-xs uppercase tracking-widest">
                      Cambiar Imagen
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="w-full aspect-video border-2 border-dashed border-white/10 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-[#C9A962] hover:bg-[#C9A962]/5 transition-colors">
                  <ImageIcon className="w-8 h-8 text-white/20 mb-2" />
                  <span className="text-sm text-[#A3A3A3]">Haz clic para subir imagen</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
