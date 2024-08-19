import { useState } from 'react';
import { TextInput, TextInputProps } from '@mantine/core';
import classes from './FloatingLabelInput.module.css';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
}

export function FloatingLabelInput({ label, ...props }: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState(props.value || '');
  const floating = value.toString().trim().length !== 0 || focused || undefined;

  return (
    <TextInput
      label={label}
      classNames={classes}
      value={value}
      onChange={(event) => {
        setValue(event.currentTarget.value);
        if (props.onChange) {
          props.onChange(event);
        }
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      mt="md"
      autoComplete="off"
      data-floating={floating}
      labelProps={{ 'data-floating': floating }}
      {...props}
    />
  );
}
