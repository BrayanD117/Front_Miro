'use client'

import { Container, Grid, BackgroundImage, Title, Text, Button, Stack, Paper } from "@mantine/core";
import { useRouter } from "next/navigation";

const HomePage = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/signIn');
  };

  return (
    <Container size="xl" p={0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Grid grow style={{ width: '100%', margin: 0 }}>
        <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BackgroundImage
            src="/assets/panoramica.png"
            style={{ height: '50vh', width: '80%', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Stack align="center" style={{ color: 'white', padding: '20px', textAlign: 'center' }}>
              <Title order={1} fw={700}>
                Bienvenidos a MIRÓ
              </Title>
              <Title order={4} fw={500}>
                El mecanismo de información y reporte oficial de la Universidad de Ibagué.
              </Title>
            </Stack>
          </BackgroundImage>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper p="xl" shadow="lg" withBorder style={{ width: '80%', maxWidth: '400px', textAlign: 'center' }}>
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
