// Tipado mínimo del custom element <esp-web-install-button> de esp-web-tools
// (no trae .d.ts para JSX; la librería solo registra el elemento en el DOM).
// React 19 mueve el namespace JSX dentro de React.JSX, así que hay que aumentar
// el módulo 'react' (no el global JSX de versiones anteriores) para que se fusione.
import type * as React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'esp-web-install-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        manifest?: string;
      };
    }
  }
}
