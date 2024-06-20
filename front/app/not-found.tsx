"use client";

import {
  Container,
  Grid,
  Title,
  Text,
  Button,
  Stack,
  Paper,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import animationData from "../public/lottie/404.json";
import { useSession } from "next-auth/react";

const NotFound = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleReturnHome = () => {
    if (status === "authenticated") {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  };

  return (
    <Container
      size="xl"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
      }}
    >
      <Grid grow style={{ width: "100%", margin: 0 }}>
        <Grid.Col
          span={{ base: 12, md: 6 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lottie
            animationData={animationData}
            className="flex justify-center items-center"
            loop={false}
          />
        </Grid.Col>
        <Grid.Col
          span={{ base: 12, md: 6 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper
            p="xl"
            shadow="lg"
            withBorder
            style={{ width: "80%", maxWidth: "400px", textAlign: "center" }}
          >
            <Stack align="center">
              <Title order={2}>Oops! Página no encontrada.</Title>
              <Text>
                Lo sentimos, pero la página que estás buscando no existe.
              </Text>
              <Button
                variant="filled"
                color="blue"
                size="lg"
                radius="md"
                onClick={handleReturnHome}
              >
                Volver a la página principal
              </Button>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default NotFound;
