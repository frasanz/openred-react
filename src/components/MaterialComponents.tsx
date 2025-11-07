// Material Web Components helper types
import React from 'react';

// Helper type for Material Web Components
type MaterialWebComponent<T = {}> = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & T;

// Specific component types
export type MdFilledTextFieldProps = MaterialWebComponent<{
  label?: string;
  type?: string;
  required?: boolean;
  error?: boolean;
  'error-text'?: string;
  value?: string;
  name?: string;
}>;

export type MdFilledButtonProps = MaterialWebComponent<{
  disabled?: boolean;
  type?: string;
}>;

export type MdTextButtonProps = MaterialWebComponent<{
  disabled?: boolean;
  type?: string;
}>;

export type MdIconButtonProps = MaterialWebComponent<{
  disabled?: boolean;
  toggle?: boolean;
}>;

export type MdMenuProps = MaterialWebComponent<{
  anchor?: string;
  open?: boolean;
  quick?: boolean;
  positioning?: string;
}>;

export type MdMenuItemProps = MaterialWebComponent<{
  disabled?: boolean;
  href?: string;
  target?: string;
}>;

export type MdCircularProgressProps = MaterialWebComponent<{
  indeterminate?: boolean;
}>;

export type MdSliderProps = MaterialWebComponent<{
  min?: number;
  max?: number;
  value?: number;
  valueStart?: number;
  valueEnd?: number;
  step?: number;
  disabled?: boolean;
  range?: boolean;
  ticks?: boolean;
  labeled?: boolean;
  name?: string;
  nameStart?: string;
  nameEnd?: string;
  ariaLabelStart?: string;
  ariaLabelEnd?: string;
  valueLabel?: string;
  valueLabelStart?: string;
  valueLabelEnd?: string;
}>;

// Component creators with proper typing
export const MdFilledTextField = (props: MdFilledTextFieldProps) => 
  React.createElement('md-filled-text-field', props);

export const MdFilledButton = (props: MdFilledButtonProps & { children?: React.ReactNode }) => 
  React.createElement('md-filled-button', props, props.children);

export const MdTextButton = (props: MdTextButtonProps & { children?: React.ReactNode }) => 
  React.createElement('md-text-button', props, props.children);

export const MdIconButton = (props: MdIconButtonProps & { children?: React.ReactNode }) => 
  React.createElement('md-icon-button', props, props.children);

export const MdMenu = (props: MdMenuProps & { children?: React.ReactNode }) => 
  React.createElement('md-menu', props, props.children);

export const MdMenuItem = (props: MdMenuItemProps & { children?: React.ReactNode }) => 
  React.createElement('md-menu-item', props, props.children);

export const MdCircularProgress = (props: MdCircularProgressProps) => 
  React.createElement('md-circular-progress', props);

export const MdSlider = (props: MdSliderProps) => {
  // Convert camelCase props to kebab-case attributes for Material Web Components
  const elementProps = { ...props };
  
  // Convert camelCase to kebab-case for specific properties
  if (props.valueStart !== undefined) {
    (elementProps as any)['value-start'] = props.valueStart;
    delete elementProps.valueStart;
  }
  if (props.valueEnd !== undefined) {
    (elementProps as any)['value-end'] = props.valueEnd;
    delete elementProps.valueEnd;
  }
  if (props.nameStart !== undefined) {
    (elementProps as any)['name-start'] = props.nameStart;
    delete elementProps.nameStart;
  }
  if (props.nameEnd !== undefined) {
    (elementProps as any)['name-end'] = props.nameEnd;
    delete elementProps.nameEnd;
  }
  if (props.ariaLabelStart !== undefined) {
    (elementProps as any)['aria-label-start'] = props.ariaLabelStart;
    delete elementProps.ariaLabelStart;
  }
  if (props.ariaLabelEnd !== undefined) {
    (elementProps as any)['aria-label-end'] = props.ariaLabelEnd;
    delete elementProps.ariaLabelEnd;
  }
  if (props.valueLabel !== undefined) {
    (elementProps as any)['value-label'] = props.valueLabel;
    delete elementProps.valueLabel;
  }
  if (props.valueLabelStart !== undefined) {
    (elementProps as any)['value-label-start'] = props.valueLabelStart;
    delete elementProps.valueLabelStart;
  }
  if (props.valueLabelEnd !== undefined) {
    (elementProps as any)['value-label-end'] = props.valueLabelEnd;
    delete elementProps.valueLabelEnd;
  }
  
  return React.createElement('md-slider', elementProps);
};
