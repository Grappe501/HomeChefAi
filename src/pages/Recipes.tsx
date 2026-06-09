import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Share2 } from 'lucide-react';
import { recipesApi } from '@/lib/api';
import type { Recipe } from '@/types/billing';

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [tab, setTab] = useState<'feed' | 'mine'>('feed');

  useEffect(() => {
    recipesApi.list(tab === 'feed').then((r) => setRecipes(r.recipes)).catch(() => {});
  }, [tab]);

  const toggleLike = async (id: string) => {
    await recipesApi.like(id);
    recipesApi.list(tab === 'feed').then((r) => setRecipes(r.recipes));
  };

  return (
    <div className="space-y-4">
      <h2 className="font-sans font-semibold text-xl text-chef">Recipes</h2>
      <div className="flex gap-2">
        {(['feed', 'mine'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${tab === t ? 'bg-chef text-white' : 'bg-white border border-steel'}`}
          >
            {t === 'feed' ? 'Community' : 'My Recipes'}
          </button>
        ))}
      </div>
      {recipes.length === 0 ? (
        <div className="card text-center py-8 text-chef-subtle">
          <Share2 className="mx-auto mb-2 text-steel" size={32} />
          <p>No recipes yet. Share a meal from Cook Log (V2 Sprint 3).</p>
        </div>
      ) : (
        recipes.map((r) => (
          <div key={r.id} className="card">
            <h3 className="font-semibold">{r.title}</h3>
            {r.description && <p className="text-sm text-chef-subtle mt-1">{r.description}</p>}
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-steel-dark">{r.author_name || 'Chef'}</span>
              <button onClick={() => toggleLike(r.id)} className="flex items-center gap-1 text-sm text-copper-600">
                <Heart size={16} /> {r.likes_count}
              </button>
            </div>
          </div>
        ))
      )}
      <Link to="/cook" className="btn-secondary w-full block text-center">Log a meal to share</Link>
    </div>
  );
}
