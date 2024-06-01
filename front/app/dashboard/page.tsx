"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal, Button, Select, Container, Grid, Card, Text, Group, Image, Title, Center } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import { IconEdit, IconClipboardList, IconFileText } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useRole } from "../context/RoleContext";


const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter(); 
  const [opened, setOpened] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const { userRole, setUserRole } = useRole(); 
  const [notificationShown, setNotificationShown] = useState(false);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (session?.user?.email && !notificationShown) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/users/roles`,
            { params: { email: session.user.email } }
          );
          setAvailableRoles(response.data.roles);
          if (!response.data.activeRole) {
            setOpened(true);
          } else {
            if (userRole !== response.data.activeRole) {
              setUserRole(response.data.activeRole);
              showNotification({
                title: "Bienvenido",
                message: `Tu rol actual es ${response.data.activeRole}`,
                autoClose: 5000,
                color: "teal",
              });
              setNotificationShown(true);
            }
          }
        } catch (error) {
          console.error("Error fetching roles:", error);
        }
      }
    };

    if (status === "authenticated") {
      fetchUserRoles();
    }
  }, [session, status, notificationShown, userRole]);

  const handleRoleSelect = async (role: string) => {
    if (!session?.user?.email) return;

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/updateActiveRole`,
        {
          email: session.user.email,
          activeRole: role,
        }
      );
      console.log("Active role updated:", response.data);
      setUserRole(role);
      setOpened(false);
      showNotification({
        title: "Rol actualizado",
        message: `Tu nuevo rol es ${role}`,
        autoClose: 5000,
        color: "teal",
      });
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

  const renderCards = () => {
    switch (userRole) {
      case "Administrador":
        return (
          <>
          <Center>
            <Title mb="sm">Tu rol es Administrador</Title>
          </Center>
          <Grid>
            <Grid.Col span={4}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  <Image src="https://via.placeholder.com/150" height={160} alt="Usuarios" />
                </Card.Section>
                <Group mt="md" mb="xs">
                  <Text w={500}>Gestionar Usuarios</Text>
                  <IconEdit size={24} />
                </Group>
                <Text size="sm" color="dimmed">
                  Administra los roles y permisos de los usuarios.
                </Text>
                <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/admin/users')}>
                  Ir a Gestión de Usuarios
                </Button>
              </Card>
            </Grid.Col>
            <Grid.Col span={4}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  <Image src="https://via.placeholder.com/150" height={160} alt="Dimensiones" />
                </Card.Section>
                <Group mt="md" mb="xs">
                  <Text w={500}>Gestionar Dimensiones</Text>
                  <IconClipboardList size={24} />
                </Group>
                <Text size="sm" color="dimmed">
                  Administra las dimensiones y sus responsables.
                </Text>
                <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/admin/dimensions')}>
                  Ir a Gestión de Dimensiones
                </Button>
              </Card>
            </Grid.Col>
          </Grid>
          </>
        );
      case "Responsable":
        return (
          <>
          <Center>
            <Title mb="sm">Tu rol es Responsable</Title>
          </Center>
          <Grid>
            <Grid.Col span={6}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  <Image src="https://via.placeholder.com/150" height={160} alt="Gestión de Información" />
                </Card.Section>
                <Group mt="md" mb="xs">
                  <Text w={500}>Gestionar Información</Text>
                  <IconFileText size={24} />
                </Group>
                <Text size="sm" color="dimmed">
                  Gestiona la información enviada por los productores.
                </Text>
                <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/responsable/informacion')}>
                  Ir a Gestión de Información
                </Button>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  <Image src="https://via.placeholder.com/150" height={160} alt="Plantillas" />
                </Card.Section>
                <Group mt="md" mb="xs">
                  <Text w={500}>Crear Plantillas</Text>
                  <IconClipboardList size={24} />
                </Group>
                <Text size="sm" color="dimmed">
                  Crea y gestiona las plantillas que llenarán los usuarios.
                </Text>
                <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/responsable/plantillas')}>
                  Ir a Gestión de Plantillas
                </Button>
              </Card>
            </Grid.Col>
          </Grid>
          </>
        );
      case "Productor":
        return (
          <>
          <Center>
            <Title mb="sm">Tu rol es Responsable</Title>
          </Center>
          <Grid>
            <Grid.Col span={12}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  <Image src="https://via.placeholder.com/150" height={160} alt="Enviar Información" />
                </Card.Section>
                <Group mt="md" mb="xs">
                  <Text w={500}>Enviar Información</Text>
                  <IconFileText size={24} />
                </Group>
                <Text size="sm" color="dimmed">
                  Envía información a los responsables para su gestión.
                </Text>
                <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/productor/enviar')}>
                  Ir a Enviar Información
                </Button>
              </Card>
            </Grid.Col>
          </Grid>
          </>
        );
      case "Usuario":
      default:
        return (
          <Container>
            <Text>Bienvenido al sistema. Por favor selecciona un rol desde el menú superior.</Text>
          </Container>
        );
    }
  };

  return (
    <>
      <Container>
        <Center>
          <Title mb="md">Inicio</Title>
        </Center>
        {renderCards()}
      </Container>
      <Modal
        opened={opened}
        onClose={() => {}}
        title="Selecciona un rol"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        withCloseButton={false}
      >
        <Select
          label="Selecciona uno de tus roles"
          placeholder="Elige un rol"
          data={availableRoles}
          value={selectedRole}
          onChange={(value) => setSelectedRole(value || "")}
        />
        <Button
          mt="md"
          onClick={() => handleRoleSelect(selectedRole)}
          disabled={!selectedRole}
        >
          Guardar
        </Button>
      </Modal>
    </>
  );
};

export default DashboardPage;