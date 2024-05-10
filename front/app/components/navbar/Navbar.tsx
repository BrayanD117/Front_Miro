"use client";

import { useState } from "react";
import { Container, Group, Burger, Text, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Avatar } from "@mantine/core";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

// Components
import ThemeChanger from "../ThemeChanger/ThemeChanger";

// Styles
import classes from "./Navbar.module.css";

const links = [
  { link: "/dashboard", label: "Inicio" },
  { link: "/about", label: "Cambiar Rol" },
];

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

  return (
    <>
      <header className={classes.header}>
        <Container size="md" className={classes.inner}>
          <Group>
            <Text component="a" href="/" fw={700} size="xl">
              MIRÓ
            </Text>
          </Group>
          {session?.user ? (
            <>
              <Group gap={8} visibleFrom="xs">
                {items}
                <ThemeChanger />
                <Avatar
                  component="a"
                  src={session.user.image}
                  color="blue"
                  radius="xl"
                />
                <Button
                  onClick={async () => {
                    await signOut(
                      { callbackUrl: "/"}
                    );
                  }}
                >Sign Out</Button>
              </Group>
            </>
          ) : (
            <Group>
              <Button onClick={() => signIn()}>Sign In</Button>
            </Group>
          )}
          <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
        </Container>
      </header>
    </>
  );
}
