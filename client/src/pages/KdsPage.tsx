import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KitchenPage from './KitchenPage';

/** PDF §4 — fixed KDS URL for separate device/tab, no main app nav */
export default function KdsPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    setAuthed(true);
  }, [navigate]);

  if (!authed) return null;
  return <KitchenPage standalone />;
}
