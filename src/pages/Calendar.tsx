import { useEffect, useState } from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import { CalendarDays, Check } from 'lucide-react';
import { calendarApi } from '@/lib/api';

interface CalEvent {
  id?: string;
  event_date: string;
  event_type: string;
  title: string;
  description?: string;
  completed?: boolean;
}

export default function Calendar() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    calendarApi.list().then((r) => setEvents(r.events)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const days = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));

  const forDay = (d: Date) => events.filter((e) => e.event_date === format(d, 'yyyy-MM-dd'));

  const complete = async (id: string) => {
    if (!id || id.startsWith('exp-')) return;
    await calendarApi.complete(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-sans font-semibold text-xl text-chef">Kitchen Calendar</h2>
        <button onClick={() => calendarApi.syncMeals().then(load)} className="text-sm text-chef-muted font-medium">
          Sync meal plan
        </button>
      </div>
      <p className="text-sm text-chef-subtle">Meals, expiring items, and reminders for the next 2 weeks.</p>

      {loading ? (
        <p className="text-chef-subtle text-center py-8">Loading...</p>
      ) : (
        <div className="space-y-3">
          {days.map((d) => {
            const dayEvents = forDay(d);
            const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            return (
              <div key={d.toISOString()} className={`card ${isToday ? 'border-chef bg-stainless-200/50' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays size={16} className="text-chef" />
                  <span className="font-semibold text-sm">{format(d, 'EEE, MMM d')}</span>
                  {isToday && <span className="text-xs bg-chef text-white px-2 py-0.5 rounded-full">Today</span>}
                </div>
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-steel-dark">Nothing scheduled</p>
                ) : (
                  <ul className="space-y-2">
                    {dayEvents.map((e, i) => (
                      <li key={e.id || i} className="flex items-start gap-2 text-sm">
                        {!e.completed && e.id && !e.id.startsWith('exp-') ? (
                          <button onClick={() => complete(e.id!)} className="text-steel-dark hover:text-green-600 mt-0.5">
                            <Check size={16} />
                          </button>
                        ) : (
                          <Check size={16} className="text-green-500 mt-0.5" />
                        )}
                        <div>
                          <span className={e.event_type === 'expire' ? 'text-amber-700' : ''}>{e.title}</span>
                          {e.description && <p className="text-xs text-chef-subtle">{e.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
