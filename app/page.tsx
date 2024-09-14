"use client";

import {
  Container,
  Grid,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Center,
  Image,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

const HomePage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status]);

  const handleLogin = () => {
    router.push("/signIn");
  };

  return (
    <Container fluid p={8}>
      <Grid justify="center" align="center">
        <Grid.Col
          span={{ base: 12, md: 6 }}
          align-items={"center"}
          justify-content={"center"}
          order={{ base: 1, md: 2 }}
          p={0}
        >
          <Paper m={"md"} p="xl" shadow="lg" withBorder>
            <Stack
              align="center"
              style={{ textAlign: "center", borderRadius: "10px" }}
            >
              <Title order={1} fw={700}>
                Bienvenidos a MIRÓ
              </Title>
              <Title order={4} fw={500}>
                El mecanismo de información y reporte oficial de la Universidad
                de Ibagué.
              </Title>
            </Stack>
            <Stack mt={5} align="center">
              <Text>Inicia sesión con tu cuenta institucional.</Text>
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
          <Paper mt={50}>
            <Center>
              <Title order={3}>Universidad de Ibagué</Title>
            </Center>
            <Center>
              <Text>NIT: 890704382-1</Text>
            </Center>
            <Center>
              <Text>Carrera 22 Calle 67, Barrio Ambalá.</Text>
            </Center>
            <Center>
              <Text>Ibagué - Tolima - Colombia</Text>
            </Center>
            <Center>
              <Text>Teléfono: +57 (608) 270 88 88</Text>
            </Center>
          </Paper>
        </Grid.Col>
        <Grid.Col
          p={0}
          span={{ base: 12, md: 6 }}
          align-items={"center"}
          justify-content={"center"}
        >
          <Image
            src="/assets/panoramica.png"
            height={600}
            width="100%"
            fit="cover"
            style={(theme) => ({
              image: {
                [theme.breakpoints.sm]: {
                  height: 200,
                },
                [theme.breakpoints.md]: {
                  height: 300,
                },
              },
            })}
          />
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default HomePage;