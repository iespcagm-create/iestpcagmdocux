import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './sessionContext';
import { Brand } from '../../../shared/ui/Brand';
import { Icon } from '../../../shared/ui/Icon';
import { usePageTitle } from '../../../shared/ui/usePageTitle';

export function AccessPage() {
  const { startSession } = useSession();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  usePageTitle('Acceso');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Autenticación provisional de Fase 1: contraseña fija y sesión en
    // sessionStorage. No es seguridad de producción y se sustituirá por
    // autenticación local verificada en una fase posterior.
    if (password === '123') {
      startSession();
      navigate('/panel', { replace: true });
      return;
    }

    setError('Contraseña incorrecta');
    setPassword('');
  };

  return (
    <main className="access-page" id="contenido-principal">
      <section className="access-card" aria-labelledby="access-title">
        <Brand variant="hero" />

        <p className="eyebrow">DOCUX · Fase 1</p>
        <h1 id="access-title">Acceso local</h1>
        <p className="access-card__lead">
          Ingrese la contraseña de esta instalación para abrir DOCUX.
        </p>

        <form className="access-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="access-password">Contraseña</label>
            <input
              aria-describedby={error ? 'access-error' : undefined}
              aria-invalid={error ? true : undefined}
              autoComplete="current-password"
              id="access-password"
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              type="password"
              value={password}
            />
          </div>

          {error ? (
            <p className="field-error" id="access-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            className="button button--primary button--wide"
            type="submit"
          >
            Ingresar
            <Icon name="arrow-right" size={20} />
          </button>
        </form>

        <p className="access-card__footnote">
          DOCUX · Digitaliza. Gestiona. Avanza.
        </p>
      </section>
    </main>
  );
}
