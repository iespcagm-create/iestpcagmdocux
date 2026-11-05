import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from './AppErrorBoundary';

function BrokenView(): never {
  throw new Error('Fallo de prueba');
}

describe('AppErrorBoundary', () => {
  it('muestra una recuperación clara ante un error de interfaz', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <BrokenView />
      </AppErrorBoundary>,
    );

    expect(
      screen.getByRole('heading', { name: 'Algo salió mal' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Recargar aplicación' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se enviaron datos a ningún servidor.',
    );

    consoleError.mockRestore();
  });
});
