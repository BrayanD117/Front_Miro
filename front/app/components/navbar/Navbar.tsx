"use client";

import { useState } from "react";
import { Container, Group, Burger, Text, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Avatar } from "@mantine/core";
import { IconStar } from "@tabler/icons-react";

// Components
import ThemeChanger from "../ThemeChanger/ThemeChanger";

// Styles
import classes from "./Navbar.module.css";

const links = [{ link: "/about", label: "Cambiar Rol" }];

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
          <Text fw={700} size="xl">
            MIRÓ
          </Text>
        </Group>
        <Group gap={8} visibleFrom="xs">
          {items}
          <ThemeChanger />
          <Avatar color="blue" radius="xl"/>
        </Group>
        <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
      </Container>
    </header>
  );
}
