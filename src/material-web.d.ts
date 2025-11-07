// Type definitions for Material Web Components
declare namespace JSX {
  interface IntrinsicElements {
    // Buttons
    'md-filled-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      type?: string;
    };
    'md-outlined-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      type?: string;
    };
    'md-text-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      type?: string;
    };
    'md-filled-tonal-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      type?: string;
    };
    'md-elevated-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      type?: string;
    };
    'md-fab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    
    // Icon buttons
    'md-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      toggle?: boolean;
    };
    'md-filled-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      toggle?: boolean;
    };
    'md-filled-tonal-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      toggle?: boolean;
    };
    'md-outlined-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      toggle?: boolean;
    };
    
    // Menu components
    'md-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      anchor?: string;
      open?: boolean;
      quick?: boolean;
      positioning?: string;
    };
    'md-menu-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      href?: string;
      target?: string;
    };
    'md-sub-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      anchor?: string;
    };
    
    // Form fields
    'md-filled-text-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      label?: string;
      type?: string;
      required?: boolean;
      error?: boolean;
      'error-text'?: string;
      value?: string;
      name?: string;
    };
    'md-outlined-text-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      label?: string;
      type?: string;
      required?: boolean;
      error?: boolean;
      'error-text'?: string;
      value?: string;
      name?: string;
    };
    'md-filled-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-outlined-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-select-option': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-radio': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-switch': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-slider': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      min?: number;
      max?: number;
      value?: number;
      step?: number;
      disabled?: boolean;
      range?: boolean;
      'value-start'?: number;
      'value-end'?: number;
      'label-start'?: string;
      'label-end'?: string;
      ticks?: boolean;
      labeled?: boolean;
    };
    
    // Navigation
    'md-navigation-bar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-navigation-tab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-navigation-drawer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-navigation-drawer-modal': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-tabs': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-tab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    
    // Layout
    'md-elevated-card': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-dialog': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-divider': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-elevation': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    
    // Feedback
    'md-circular-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      indeterminate?: boolean;
    };
    'md-linear-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-snackbar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    
    // Lists
    'md-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-list-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    
    // Icons
    'md-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-filled-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-filled-tonal-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-outlined-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    
    // Menu
    'md-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-menu-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    
    // Chips
    'md-chip-set': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-filter-chip': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-input-chip': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-suggestion-chip': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'md-assist-chip': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
