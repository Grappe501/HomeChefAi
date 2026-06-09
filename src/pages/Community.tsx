import { useEffect, useState } from 'react';
import { HandHeart, Plus } from 'lucide-react';
import { swapApi } from '@/lib/api';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/hooks/useToast';

interface SwapPost {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  post_type: string;
  zip_code: string;
  message?: string;
  user_id: string;
}

export default function Community() {
  const { profile, updateProfile } = useApp();
  const toast = useToast();
  const [posts, setPosts] = useState<SwapPost[]>([]);
  const [zip, setZip] = useState((profile as { zip_code?: string })?.zip_code || '');
  const [showForm, setShowForm] = useState(false);
  const [itemName, setItemName] = useState('');
  const [postType, setPostType] = useState<'offer' | 'need'>('offer');
  const [message, setMessage] = useState('');

  const load = () => {
    if (zip.length >= 5) swapApi.list(zip).then((r) => setPosts(r.posts as SwapPost[]));
  };

  useEffect(() => { load(); }, [zip]);

  const saveZip = async () => {
    await updateProfile({ zip_code: zip } as never);
    load();
  };

  const submit = async () => {
    if (!itemName || zip.length < 5) return;
    await swapApi.create({ item_name: itemName, zip_code: zip, post_type: postType, message });
    setItemName('');
    setMessage('');
    setShowForm(false);
    load();
  };

  const respond = async (postId: string) => {
    await swapApi.respond(postId, "I'm interested — let's swap!");
    toast.success('Response sent!');
  };

  return (
    <div className="space-y-4">
      <h2 className="font-sans font-semibold text-xl text-chef">Neighbor Swap</h2>
      <p className="text-sm text-chef-subtle">Share extras or find what you need nearby.</p>

      <div className="card flex gap-2">
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="Zip code"
          className="input-field flex-1"
          maxLength={5}
        />
        <button onClick={saveZip} className="btn-secondary px-4">Save</button>
      </div>

      <button onClick={() => setShowForm(!showForm)} className="btn-primary w-full">
        <Plus size={18} /> Post an offer or need
      </button>

      {showForm && (
        <div className="card space-y-3">
          <div className="flex gap-2">
            {(['offer', 'need'] as const).map((t) => (
              <button key={t} onClick={() => setPostType(t)} className={`tap-item flex-1 ${postType === t ? 'tap-item-selected' : ''}`}>
                {t === 'offer' ? 'I have' : 'I need'}
              </button>
            ))}
          </div>
          <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Item name" className="input-field" />
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Optional message" className="input-field" />
          <button onClick={submit} className="btn-primary w-full">Post</button>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="card text-center py-8 text-chef-subtle">
          <HandHeart className="mx-auto mb-2 text-steel" size={32} />
          <p>{zip.length >= 5 ? 'No posts in your area yet. Be the first!' : 'Enter your zip code to see nearby posts.'}</p>
        </div>
      ) : (
        posts.map((p) => (
          <div key={p.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-xs font-bold uppercase ${p.post_type === 'offer' ? 'text-green-600' : 'text-blue-600'}`}>
                  {p.post_type === 'offer' ? 'Offering' : 'Needs'}
                </span>
                <p className="font-semibold">{p.item_name} — {p.quantity} {p.unit}</p>
                {p.message && <p className="text-sm text-chef-subtle mt-1">{p.message}</p>}
                <p className="text-xs text-steel-dark mt-1">Zip {p.zip_code}</p>
              </div>
              <button onClick={() => respond(p.id)} className="btn-secondary text-sm py-2 px-3">I'm interested</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
