'use client'

import { useState } from 'react';
import { Container, Group, Burger, Text, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Navbar.module.css';
import ThemeChanger from '../ThemeChanger/ThemeChanger';

const links = [
  { link: '/about', label: 'Features' },
  { link: '/pricing', label: 'Pricing' },
  { link: '/learn', label: 'Learn' },
  { link: '/community', label: 'Community' },
];

export default function Navbar() {
  const [opened, { toggle }] = useDisclosure(false);
  const [active, setActive] = useState(links[0].link);

  const items = links.map((link) => (
    <Button
      key={link.label}
      component="a"
      href={link.link}
      variant="light"
      onClick={(event) => {
        event.preventDefault();
        setActive(link.link);
      }}
      size="sm"
      style={{ fontWeight: 500 }}
    >
      {link.label}
    </Button>
  ));

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        <Group>
            <Text fw={700} size="xl">Brayan's Portfolio</Text>
        </Group>
        <Group gap={5} visibleFrom="xs">
          {items}
        </Group>
        <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
        <ThemeChanger />
      </Container>
    </header>
  );
}