"use client";

import { Container, Grid, Card, Image, Text, Button, Group, Title, Center } from "@mantine/core";
import { useRouter } from "next/navigation";

const AdminPage = () => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <Container size="xl">
      <Center>
        <Title mb="xl">Panel de Administración</Title>
      </Center>
      <Grid>
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section>
              <Image src="https://via.placeholder.com/150" height={160} alt="Usuarios" />
            </Card.Section>

            <Group mt="md" mb="xs">
              <Text w={500}>Gestionar Usuarios</Text>
            </Group>

            <Text size="sm" color="dimmed">
              Administra los roles y permisos de los usuarios.
            </Text>

            <Button variant="light" fullWidth mt="md" radius="md" onClick={() => handleNavigation('/admin/users')}>
              Ir a Gestión de Usuarios
            </Button>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section>
              <Image src="https://via.placeholder.com/150" height={160} alt="Dimensiones" />
            </Card.Section>

            <Group mt="md" mb="xs">
              <Text w={500}>Gestionar Dimensiones</Text>
            </Group>

            <Text size="sm" color="dimmed">
              Administra las dimensiones y sus responsables.
            </Text>

            <Button variant="light" fullWidth mt="md" radius="md" onClick={() => handleNavigation('/admin/dimensions')}>
              Ir a Gestión de Dimensiones
            </Button>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default AdminPage;
