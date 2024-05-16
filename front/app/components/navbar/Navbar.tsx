"use client";

import { useState } from "react";
import {
  Container,
  Group,
  Burger,
  Button,
  Menu,
  rem,
  Modal,
  Text,
  Drawer,
  Flex,
  Stack,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Avatar } from "@mantine/core";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

// Components
import ThemeChanger from "../ThemeChanger/ThemeChanger";
import ThemeChangerMobile from "../ThemeChanger/ThemeChangerMobile";

// Styles
import classes from "./Navbar.module.css";
import { IconDoorExit } from "@tabler/icons-react";

const links = [
  { link: "/dashboard", label: "Inicio" },
  { link: "/", label: "Cambiar Rol" },
  { link: "/admin", label: "Admin" },
];

const titles = [{ link: "/", label: "MIRÓ" }];

export default function Navbar() {
  const { data: session } = useSession();

  const [opened, { toggle }] = useDisclosure(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [active, setActive] = useState(links[0].link);

  const items = links.map((link) => (
    <Link href={link.link} key={link.label} passHref>
      <Button variant="light" size="sm" style={{ fontWeight: 500 }}>
        {link.label}
      </Button>
    </Link>
  ));

  const itemsDrawer = links.map((link) => (
    <Link href={link.link} key={link.label} passHref>
    <Button
      fullWidth
      variant="light"
      size="sm"
      style={{ fontWeight: 500, marginBottom: "8px", textDecoration: 'none' }}
    >
      {link.label}
    </Button>
  </Link>
  ));

  const titleButton = titles.map((link) => (
    <Link href={link.link} key={link.label} passHref>
      <Button variant="transparent" size="sm" style={{ fontWeight: 500 }}>
        {link.label}
      </Button>
    </Link>
  ));

  return (
    <>
      <header className={classes.header}>
        <Container size="md" className={classes.inner}>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
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
                      variant="transparent"
                      onClick={() => setModalOpened(true)}
                    >
                      Cerrar Sesión
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

          <Drawer
            opened={opened}
            onClose={() => toggle()}
            title="Menú"
            padding="md"
            size="md"
          >
            <Stack align="stretch" justify="center" gap="md">
              {itemsDrawer}
              <ThemeChangerMobile />
              {session?.user && (
                <>
                <Divider/>
                <Button
                  mt={8}
                  fullWidth
                  color="red"
                  variant="light"
                  onClick={() => {
                    setModalOpened(true);
                    toggle();
                  }}
                >
                  Cerrar Sesión
                </Button>
                </>
              )}
            </Stack>
          </Drawer>
        </Container>
      </header>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Cerrar Sesión"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Text>¿Estás seguro de que deseas cerrar sesión?</Text>
        <Group mt="md">
          <Button variant="default" onClick={() => setModalOpened(false)}>
            Cancelar
          </Button>
          <Button
            color="red"
            onClick={async () => {
              await signOut({ callbackUrl: "/" });
            }}
          >
            Cerrar Sesión
          </Button>
        </Group>
      </Modal>
    </>
  );
}
