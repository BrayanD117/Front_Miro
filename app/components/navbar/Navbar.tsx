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
  Badge,
  Avatar,
  Image,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { showNotification } from "@mantine/notifications";
import { useRole } from "@/app/context/RoleContext";

// Components
import ThemeChanger from "../ThemeChanger/ThemeChanger";
import ThemeChangerMobile from "../ThemeChanger/ThemeChangerMobile";

// Styles
import classes from "./Navbar.module.css";
import { IconDoorExit, IconHome, IconSubtask, IconSwitch3 } from "@tabler/icons-react";
import axios from "axios";
import MiroEye from "../MiroEye";

type LinkItem = {
  link: string;
  label: string;
};

type Roles = "Usuario" | "Administrador" | "Responsable" | "Productor";

const linksByRole: Record<Roles, LinkItem[]> = {
  Usuario: [{ link: "/dashboard", label: "Inicio" }],
  Administrador: [
    { link: "/dashboard", label: "Inicio" },
    { link: "/admin/templates", label: "Plantillas" },
    { link: "/templates/published", label: "Plantillas publicadas" },
    { link: "/admin/reports", label: "Reportes" },
    { link: "/admin/reports/uploaded", label: "Reportes publicados" },
    { link: "/admin/periods", label: "Periodos" },
    { link: "/admin/dimensions", label: "Dimensiones" },
    { link: "/admin/dependencies", label: "Dependencias" },
    { link: "/admin/validations", label: "Validaciones" },
    { link: "/admin/users", label: "Usuarios" },
  ],
  Responsable: [
    { link: "/dashboard", label: "Inicio" },
    { link: "/responsible/templates", label: "Plantillas" },
    { link: "/templates/published", label: "Plantillas publicadas" },
    { link: "/responsible/reports", label: "Reportes" },
    { link: "/responsible/dimension", label: "Dimensión" },
  ],
  Productor: [
    { link: "/dashboard", label: "Inicio" },
    { link: "/producer/templates", label: "Plantillas pendientes" },
    { link: "/producer/templates/uploaded", label: "Plantillas cargadas" },
  ],
};

const home = [{ link: "/dashboard", label: "Inicio" }];

export default function Navbar() {
  const { data: session } = useSession();
  const [opened, { toggle }] = useDisclosure(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { userRole, setUserRole } = useRole();
  const [roleMenuOpened, setRoleMenuOpened] = useState(false);
  const [manageMenuOpened, setManageMenuOpened] = useState(false);
  const { colorScheme } = useMantineColorScheme();

  const titles = session
    ? [{ link: "/dashboard", label: "MIRÓ" }]
    : [{ link: "/", label: "MIRÓ" }];

  useEffect(() => {
    if (session?.user?.email) {
      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL}/users/roles`, {
          params: { email: session.user.email },
        })
        .then((response) => {
          const roles = response.data.roles.filter(
            (role: string) => role !== "Usuario"
          );
          setAvailableRoles(roles);
          if (response.data.activeRole) {
            setUserRole(response.data.activeRole as Roles);
          }
        })
        .catch((error) => {
          console.error("Error fetching roles:", error);
        });
    }
  }, [session]);

  const handleRoleChange = async (role: string) => {
    if (!session?.user?.email) return;
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/updateActiveRole`,
        {
          email: session.user.email,
          activeRole: role,
        }
      );
      setUserRole(role as Roles);
      showNotification({
        title: "Rol actualizado",
        message: `Tu nuevo rol es ${role}`,
        autoClose: 5000,
        color: "teal",
      });
      setRoleMenuOpened(false);
    } catch (error) {
      console.error("Error updating active role:", error);
      showNotification({
        title: "Error",
        message: "No se pudo actualizar el rol",
        autoClose: 5000,
        color: "red",
      });
    }
  };

  const links = linksByRole[userRole as Roles] || linksByRole.Usuario;

  const items = links.map((link: LinkItem) => (
    <Link href={link.link} key={link.label} passHref>
      <Button variant="light" size="sm" style={{ fontWeight: 500 }}>
        {link.label}
      </Button>
    </Link>
  ));

  const homeLink = home.map((link: LinkItem) => (
    <Link href={link.link} key={link.label} passHref>
      <Button variant="light" size="sm" fw={700} leftSection={<IconHome size={18}/>}>
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
      <Group gap={"xs"}>
        <MiroEye/>
        <Image
          src={`/assets/textoMiro-${colorScheme}.svg`}
          alt="MIRÓ"
          height={30}
        />
      </Group>
    </Link>
  ));

  const actionItems = links
    .filter((link) => link.link !== "/dashboard")
    .map((link: LinkItem) => (
      <Link href={link.link} key={link.label} passHref>
        <Button
          mt={8}
          fullWidth
          color="blue"
          variant="light"
          onClick={() => setManageMenuOpened(false)}
        >
          {link.label}
        </Button>
      </Link>
    ));

  return (
    <>
      <header className={classes.header}>
        <Container size="xl" className={classes.inner}>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group>{titleButton}</Group>

          {session?.user ? (
            <>
              <Group gap={8} visibleFrom="xs">
                <Badge m={20} variant="light">
                  {userRole}
                </Badge>
                {homeLink}
                {availableRoles.length > 0 && (
                  <Menu
                    shadow="md"
                    width={200}
                    position="bottom-end"
                    opened={roleMenuOpened}
                    onClose={() => setRoleMenuOpened(false)}
                    onOpen={() => setRoleMenuOpened(true)}
                  >
                    <Menu.Target>
                      <Button variant="light" size="sm" fw={700} leftSection={<IconSwitch3 size={18}/>}>
                        Rol
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {availableRoles.map((role) => (
                        <Button
                          key={role}
                          mt={"xs"}
                          fullWidth
                          variant={userRole === role ? "outline" : "light"}
                          onClick={() => handleRoleChange(role)}
                        >
                          {role}
                        </Button>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                )}
                <Menu
                  shadow="md"
                  width={200}
                  opened={manageMenuOpened}
                  onClose={() => setManageMenuOpened(false)}
                  onOpen={() => setManageMenuOpened(true)}
                >
                  <Menu.Target>
                    <Button variant="light" size="sm" fw={700} leftSection={<IconSubtask size={18}/>}>
                      Gestión
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>{actionItems}</Menu.Dropdown>
                </Menu>
                <ThemeChanger />
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <Avatar
                      component="a"
                      src={session?.user?.image || undefined}
                      color="blue"
                      radius="xl"
                      className={classes.avatarClickable}
                    />
                  </Menu.Target>
                  {/* Menu Dropdown */}
                  <Menu.Dropdown>
                    <Menu.Divider />
                    <Menu.Label></Menu.Label>
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
              <Button variant="light" fw={700} onClick={() => signIn()}>
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
            closeOnEscape={false}
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
              await signOut({ 
                callbackUrl: process.env.APP_ENV==="development" ? 
                "/dev" : "/"
              });
            }}
          >
            Cerrar Sesión
          </Button>
        </Group>
      </Modal>
    </>
  );
}
