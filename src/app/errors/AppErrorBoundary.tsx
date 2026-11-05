import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Brand } from '../../shared/ui/Brand';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error no controlado en DOCUX', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="standalone-page" id="contenido-principal">
          <section className="error-card" role="alert">
            <Brand variant="hero" />
            <p className="eyebrow">Error inesperado</p>
            <h1>Algo salió mal</h1>
            <p>
              Se produjo un error en la interfaz. No se enviaron datos a ningún
              servidor. La información que ya estuviera guardada en este
              navegador no se modifica al recargar.
            </p>
            <p>
              Recargue la aplicación. Si el problema continúa, cierre el
              navegador y vuelva a abrir DOCUX.
            </p>
            <button
              className="button button--primary"
              onClick={this.handleReload}
              type="button"
            >
              Recargar aplicación
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
