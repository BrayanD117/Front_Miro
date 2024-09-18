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
  Accordion,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import starsAnimation from "@/public/lottie/stars.json";
import ThemeChanger from "./components/ThemeChanger/ThemeChanger";
import styles from "./page.module.css";

const Lottie = dynamic(() => import("lottie-react").then((mod) => mod.default), {
  ssr: false,
}) as React.FC<{ animationData: object; loop: boolean; style: object }>;

const HomePage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showStars, setShowStars] = useState(false);

  const handleMouseEnter = () => setShowStars(true);
  const handleMouseLeave = () => setShowStars(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status]);

  const handleLogin = () => {
    router.push("/signIn");
  };

  return (
    <Container fluid p={0}>
      <div className={styles.imageColumn}>
        <BackgroundImage
          src="/assets/CanchaVertical.webp"
          style={{
            objectFit: "cover",
            height: "100vh",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <Paper
              m={"md"}
              p="xl"
              mt={"35%"}
              bg={"rgba(255, 255, 255, 0.616)"}
              className={styles.blurBackground}
              style={{
                textAlign: "center",
                width: "100%",
                maxWidth: "400px",
                position: "relative",
              }}
              shadow="lg"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Stack align="center" style={{ position: "relative" }}>
                <Title order={1} fw={700}>
                  Bienvenidos a MIRÓ
                </Title>
                <div style={{ position: "relative", width: "20%" }}>
                  <Image
                    src="/assets/Logoojomiro.webp"
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
                  onClick={handleLogin}
                >
                  Iniciar Sesión
                </Button>
              </Stack>
            </Paper>
          </div>
        </BackgroundImage>
      </div>

      <div className={styles.scrollableContent}>
        <Title ta={"center"} mt={30}>
          ¡Conoce MIRÓ!🔎
        </Title>
        <Center mt={10}>
          <ThemeChanger/>
        </Center>
        <Accordion
          m={30}
          mt={30}
          variant="separated"
          defaultValue="que-es-miro"
          classNames={{
            root: styles.root,
            item: styles.item,
            chevron: styles.chevron,
          }}
        >
          <Accordion.Item value="que-es-miro">
            <Accordion.Control>¿Qué es MIRÓ? 👀</Accordion.Control>
            <Accordion.Panel>
              MIRÓ es el Mecanismo de Información y Reporte Oficial de la
              Universidad de Ibagué. Es una herramienta diseñada para mejorar
              la gestión y acceso a la información institucional de manera
              efectiva y centralizada.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="proposito-miro">
            <Accordion.Control>Propósito de MIRÓ 🚀</Accordion.Control>
            <Accordion.Panel>
              El propósito de MIRÓ es consolidar la información de la
              Universidad de Ibagué y proporcionar una plataforma donde los
              usuarios puedan acceder a reportes y datos relevantes de manera
              eficiente y segura.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="beneficios-miro">
            <Accordion.Control>Beneficios de MIRÓ 📖</Accordion.Control>
            <Accordion.Panel>
              Los beneficios de MIRÓ incluyen la centralización de la
              información, reducción de tiempos en la generación de reportes,
              seguridad en el manejo de datos y mejora en la toma de
              decisiones a nivel institucional.
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <Paper p={20} mt={50}>
          <Center>
            <Image m={10} h={100} src="/assets/unibague.webp"></Image>
          </Center>
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
      </div>
    </Container>
  );
};

export default HomePage;
