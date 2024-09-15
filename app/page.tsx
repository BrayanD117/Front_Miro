"use client";

import { useState } from "react";
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
  BackgroundImage,
} from "@mantine/core";
import dynamic from "next/dynamic";
import starsAnimation from "@/public/lottie/stars.json";
import styles from "./page.module.css";

const Lottie = dynamic(() => import("lottie-react").then((mod) => mod.default), {
  ssr: false,
}) as React.FC<{ animationData: object; loop: boolean; style: object }>;

const HomePage = () => {
  const [showStars, setShowStars] = useState(false);

  const handleMouseEnter = () => setShowStars(true);
  const handleMouseLeave = () => setShowStars(false);

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
          <Paper mt={50}>
            <Center>
              <Title order={4} fw={500}>
                El mecanismo de información y reporte oficial de la Universidad de Ibagué.
              </Title>
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
          <div style={{ width: "100%", height: "100vh", overflow: "hidden", position: "relative" }}>
            <BackgroundImage
              src="/assets/CanchaVertical.webp"
              style={{
                objectFit: "cover",
                height: "100vh",
                width: "100%",
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <Paper
                  m={"md"}
                  p="xl"
                  mt={"35%"}
                  className={styles.blurBackground}
                  style={{
                    textAlign: "center",
                    width: "100%",
                    maxWidth: "400px",
                    position: "relative",
                  }}
                  shadow="lg"
                >
                  <Stack align="center" style={{ position: "relative" }}>
                    <Title order={1} fw={700}>
                      Bienvenidos a MIRÓ
                    </Title>
                    <div style={{ position: "relative", width: "20%" }}>
                      <Image
                        src="/assets/LogoOjoMiro.webp"
                        style={{ width: "100%", height: "auto" }}
                        alt="Logo MIRO"
                        className={styles.rotate}
                      />
                      {showStars && (
                        <Lottie
                          animationData={starsAnimation}
                          loop={true}
                          style={{
                            zIndex: -1,
                            position: "absolute",
                            top: 0,
                            left: -30,
                            width: "210%",
                            height: "210%",
                            pointerEvents: "none",
                          }}
                        />
                      )}
                    </div>
                  </Stack>
                  <Stack mt={5} align="center">
                    <Text>Inicia sesión con tu cuenta institucional.</Text>
                    <Button
                      variant="filled"
                      color="blue"
                      size="lg"
                      radius="md"
                    >
                      Iniciar Sesión
                    </Button>
                  </Stack>
                </Paper>
              </div>
            </BackgroundImage>
          </div>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default HomePage;
