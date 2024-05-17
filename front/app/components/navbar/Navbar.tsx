"use client";

import { useEffect, useState } from "react";
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
  Stack,
  Divider,
  Select,
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
import axios from "axios";

type LinkItem = {
  link: string;
  label: string;
};

type Roles = "usuario" | "admin" | "responsable" | "productor";

const linksByRole: Record<Roles, LinkItem[]> = {
  usuario: [{ link: "/dashboard", label: "Inicio" }],
  admin: [
    { link: "/dashboard", label: "Inicio" },
    { link: "/admin", label: "Admin" },
  ],
  responsable: [
    { link: "/dashboard", label: "Inicio" },
    { link: "/responsable", label: "Responsable" },
  ],
  productor: [
    { link: "/dashboard", label: "Inicio" },
    { link: "/productor", label: "Productor" },
  ],
};

const titles = [{ link: "/", label: "MIRÓ" }];

export default function Navbar() {
  const { data: session } = useSession();
  const [opened, { toggle }] = useDisclosure(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [changeRoleModalOpened, setChangeRoleModalOpened] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [userRole, setUserRole] = useState<Roles>("usuario");

  useEffect(() => {
    if (session?.user?.email) {
      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL}/users/roles`, {
          params: { email: session.user.email },
        })
        .then((response) => {
          setAvailableRoles(response.data.roles);
          if (response.data.activeRole) {
            setUserRole(response.data.activeRole.toLowerCase() as Roles);
          }
        })
        .catch((error) => {
          console.error("Error fetching roles:", error);
        });
    }
  }, [session]);

  useEffect(() => {
    if (changeRoleModalOpened && session?.user?.email) {
      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL}/users/roles`, {
          params: { email: session.user.email },
        })
        .then((response) => {
          setAvailableRoles(response.data.roles);
        })
        .catch((error) => {
          console.error("Error fetching roles:", error);
        });
    }
  }, [changeRoleModalOpened]);

  const handleRoleChange = async () => {
    if (!session?.user?.email) return;
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/updateActiveRole`,
        {
          email: session.user.email,
          activeRole: selectedRole,
        }
      );
      console.log("Active role updated:", response.data);
      setUserRole(selectedRole.toLowerCase() as Roles);
      setChangeRoleModalOpened(false);
    } catch (error) {
      console.error("Error updating active role:", error);
    }
  };

  const links = linksByRole[userRole] || linksByRole.usuario;

  const items = links.map((link: LinkItem) => (
    <Link href={link.link} key={link.label} passHref>
      <Button variant="light" size="sm" style={{ fontWeight: 500 }}>
        {link.label}
      </Button>
    </Link>
  ));

  const itemsDrawer = links.map((link: LinkItem) => (
    <Link href={link.link} key={link.label} passHref>
      <Button
        fullWidth
        variant="light"
        size="sm"
        style={{ fontWeight: 500, marginBottom: "8px", textDecoration: "none" }}
      >
        {link.label}
      </Button>
    </Link>
  ));

  const titleButton = titles.map((link: LinkItem) => (
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
                <Button
                  variant="light"
                  size="sm"
                  style={{ fontWeight: 500 }}
                  onClick={() => setChangeRoleModalOpened(true)}
                >
                  Cambiar rol
                </Button>
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
                  <Divider />
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

      {/* Roles modal */}

      <Modal
        opened={changeRoleModalOpened}
        onClose={() => setChangeRoleModalOpened(false)}
        title="Cambiar Rol"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Select
          label="Selecciona un nuevo rol"
          placeholder="Elige un rol"
          data={availableRoles}
          value={selectedRole}
          onChange={(value) => setSelectedRole(value || "")}
        />
        <Group mt="md">
          <Button variant="default" onClick={() => setChangeRoleModalOpened(false)}>
            Cancelar
          </Button>
          <Button color="blue" onClick={handleRoleChange}>
            Cambiar Rol
          </Button>
        </Group>
      </Modal>
    </>
  );
}
