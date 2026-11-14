import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext';

export default function Login() {
  const { setAuthOpen } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    setAuthOpen(true);
    navigate('/app/scanner', { replace: true });
  }, [setAuthOpen, navigate]);

  return null;
}
