import { useEffect, useState } from 'react';
import { Users, Copy, Check } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { householdApi } from '@/lib/api';
import type { Household, HouseholdMember } from '@/types/platform';

export default function CookTogetherSection() {
  const { profile, updateProfile } = useApp();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [kitchenName, setKitchenName] = useState((profile as { household_display_name?: string })?.household_display_name || '');
  const [joinCode, setJoinCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    householdApi.get().then((r) => {
      setHousehold(r.household);
      setMembers(r.members ?? []);
    }).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const createHousehold = async () => {
    setLoading(true);
    setMessage('');
    try {
      const r = await householdApi.create(kitchenName || 'Our Kitchen');
      setHousehold(r.household);
      setInviteCode(r.invite_code);
      await updateProfile({ household_display_name: kitchenName || 'Our Kitchen' } as never);
      load();
      setMessage('Kitchen created! Share the invite code with family.');
    } catch {
      setMessage('Could not create kitchen. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinHousehold = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      await householdApi.join(joinCode.trim());
      load();
      setMessage('Welcome to the kitchen!');
      setJoinCode('');
    } catch {
      setMessage('Invalid invite code.');
    } finally {
      setLoading(false);
    }
  };

  const copyInvite = async () => {
    const code = inviteCode || household?.invite_code;
    if (!code) {
      const r = await householdApi.invite();
      setInviteCode(r.invite_code);
      await navigator.clipboard.writeText(r.invite_code);
    } else {
      await navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="card space-y-4 border-steel">
      <div className="flex items-center gap-2">
        <Users className="text-copper-500" size={20} />
        <h3 className="font-semibold">Cook Together</h3>
      </div>
      <p className="text-sm text-chef-subtle">
        One kitchen, many cooks. Share pantry, meal plans, and cook logs with family and friends.
      </p>

      {household ? (
        <div className="space-y-3">
          <div className="bg-stainless-200 rounded-xl p-3">
            <p className="font-medium text-chef">{household.display_name || household.name}</p>
            <p className="text-xs text-chef-subtle mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <code className="flex-1 input-field text-center font-mono tracking-widest">
              {inviteCode || household.invite_code || '······'}
            </code>
            <button onClick={copyInvite} className="btn-secondary px-4" title="Copy invite code">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p className="text-xs text-chef-subtle">Share this code — family joins the same kitchen in SousChef.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-chef-subtle">Name your kitchen</label>
            <input
              value={kitchenName}
              onChange={(e) => setKitchenName(e.target.value)}
              placeholder="The Grappe Family Kitchen"
              className="input-field mt-1"
            />
          </div>
          <button onClick={createHousehold} disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating...' : 'Create Household Kitchen'}
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-steel" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-steel-dark">or join one</span></div>
          </div>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Invite code"
              className="input-field flex-1 font-mono tracking-widest"
              maxLength={8}
            />
            <button onClick={joinHousehold} disabled={loading || !joinCode.trim()} className="btn-secondary px-4">
              Join
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-center text-chef">{message}</p>}
    </section>
  );
}
