"use client";

import { useState } from "react";
import { Container, Group, Burger, Button, Menu, rem } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Avatar } from "@mantine/core";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

// Components
import ThemeChanger from "../ThemeChanger/ThemeChanger";

// Styles
import classes from "./Navbar.module.css";
import { IconDoorExit, IconSettings } from "@tabler/icons-react";

const links = [
  { link: "/dashboard", label: "Inicio" },
  { link: "/", label: "Cambiar Rol" },
];

const titles = [{ link: "/", label: "MIRÓ" }];

export default function Navbar() {
  const { data: session } = useSession();
  console.log(session);

  const [opened, { toggle }] = useDisclosure(false);
  const [active, setActive] = useState(links[0].link);

  const items = links.map((link) => (
    <Link href={link.link} key={link.label} passHref>
      <Button variant="light" size="sm" style={{ fontWeight: 500 }}>
        {link.label}
      </Button>
    </Link>
  ));

  const titleButton = titles.map((link) => (
    <Link href={link.link} key={link.label} passHref>
      <Button variant="transparent" size="xl" style={{ fontWeight: 500 }}>
        {link.label}
      </Button>
    </Link>
  ));

  return (
    <>
      <header className={classes.header}>
        <Container size="md" className={classes.inner}>
          <Group>{titleButton}</Group>
          {session?.user ? (
            <>
              <Group gap={8} visibleFrom="xs">
                {items}
                <ThemeChanger />
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <Avatar
                      component="a"
                      src={session.user.image}
                      color="blue"
                      radius="xl"
                      className={classes.avatarClickable}
                    />
                  </Menu.Target>
                  {/* Menu Dropdown */}
                  <Menu.Dropdown>
                    <Menu.Divider />

                    <Menu.Label>Zona Peligrosa</Menu.Label>

                    <Menu.Item
                      color="red"
                      leftSection={
                        <IconDoorExit
                          style={{ width: rem(14), height: rem(14) }}
                        />
                      }
                    >
                      <Button
                        variant="transparent"
                        color="red"
                        onClick={async () => {
                          await signOut({ callbackUrl: "/" });
                        }}
                      >
                        Cerrar Sesión
                      </Button>
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </>
          ) : (
            <Group>
              <ThemeChanger />
              <Button variant="light" onClick={() => signIn()}>
                Iniciar Sesión
              </Button>
            </Group>
          )}
          <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
        </Container>
      </header>
    </>
  );
}
