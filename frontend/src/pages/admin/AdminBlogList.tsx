import { useEffect } from 'react';
import { useBlog } from '../../hooks/useBlog';
import { Plus, Search, FileText, Globe, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
export const AdminBlogList = () => {
  const navigate = useNavigate();
  const { posts, loading, fetchPosts, deletePost } = useBlog();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este artículo?')) {
      await deletePost(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-secondary text-[#FAF8F5] uppercase tracking-widest">
            Blog & Insights
          </h1>
          <p className="text-[#A3A3A3] mt-1">Gestiona los artículos, logros y testimonios</p>
        </div>
        <Link
          to="/admin/blog/nuevo"
          className="flex items-center gap-2 bg-[#C9A962] text-black px-6 py-2 rounded-sm font-bold uppercase tracking-widest hover:bg-[#B89A58] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Artículo
        </Link>
      </div>

      <div className="bg-[#1A1A1A] border border-white/10 rounded-sm overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Buscar por título..."
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm pl-10 pr-4 py-2 text-[#FAF8F5] focus:border-[#C9A962] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A0A0A] text-[#A3A3A3] text-sm uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-white/10">Artículo</th>
                <th className="p-4 font-medium border-b border-white/10">Categoría</th>
                <th className="p-4 font-medium border-b border-white/10">Estado</th>
                <th className="p-4 font-medium border-b border-white/10">Fecha</th>
                <th className="p-4 font-medium border-b border-white/10 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#A3A3A3]">
                    <div className="flex justify-center mb-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#C9A962] border-t-transparent" />
                    </div>
                    Cargando artículos...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#A3A3A3]">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No hay artículos todavía. Crea el primero.
                  </td>
                </tr>
              ) : (
                posts.map((post: any) => (
                  <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        {post.cover_image ? (
                          <div className="w-12 h-12 rounded overflow-hidden shrink-0">
                            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-white/20" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#FAF8F5] mb-1">{post.title}</div>
                          <div className="text-xs text-[#A3A3A3] font-mono">/{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-white/5 text-[#FAF8F5] text-xs font-bold uppercase tracking-wider rounded-sm">
                        {post.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold uppercase tracking-wider ${
                        post.status === 'published' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {post.status === 'published' ? <Globe className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                        {post.status === 'published' ? 'Publicado' : 'Borrador'}
                      </div>
                    </td>
                    <td className="p-4 text-[#A3A3A3] text-sm">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/blog/${post.id}/editar`)}
                          className="p-2 hover:bg-[#C9A962]/10 hover:text-[#C9A962] text-[#A3A3A3] rounded transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 hover:bg-red-500/10 hover:text-red-500 text-[#A3A3A3] rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
