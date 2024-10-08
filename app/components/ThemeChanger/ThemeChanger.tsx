import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconSunHigh } from '@tabler/icons-react';
import cx from 'clsx';
import classes from './ThemeChanger.module.css';

export default function ThemeChanger() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  return (
    <ActionIcon
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      variant="light"
      p={5}
      size={'lg'}
      aria-label="Toggle color scheme"
      color='blue'
    >
      <IconSunHigh className={cx(classes.icon, classes.light)} stroke={1.5} />
      <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
    </ActionIcon>
  );
}