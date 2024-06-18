'use client'

import { Container, Grid, BackgroundImage, Title, Text, Button, Stack, Paper, Box } from "@mantine/core";
import { useRouter } from "next/navigation";

const HomePage = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/signIn');
  };

  return (
    <Container size={"xl"} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <BackgroundImage
        src="/assets/panoramica.png"
        radius={"md"}
        style={{ width: '100%', height: '30vh', backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <Grid style={{ width: '100%', margin: 0, marginTop: '20px' }}>
        <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper p="xl" shadow="lg" withBorder style={{ width: '90%', maxWidth: '450px', textAlign: 'center' }}>
            <Stack align="center" style={{ padding: '20px', textAlign: 'center', borderRadius: '10px' }}>
              <Title order={1} fw={700}>
                Bienvenidos a MIRÓ
              </Title>
              <Title order={4} fw={500}>
                El mecanismo de información y reporte oficial de la Universidad de Ibagué.
              </Title>
            </Stack>
            </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper p="xl" shadow="lg" withBorder style={{ width: '90%', maxWidth: '450px', textAlign: 'center' }}>
            <Stack align="center">
              <Title order={2}>
                ¡Bienvenido!
              </Title>
              <Text>
                Inicia sesión con tu cuenta institucional.
              </Text>
              <Button
                variant="filled"
                color="blue"
                size="lg"
                radius="md"
                onClick={handleLogin}
              >
                Iniciar Sesión
              </Button>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default HomePage;
