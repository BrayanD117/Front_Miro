import styles from "./page.module.css";
import { BackgroundImage, Center, Container, Text, Title } from "@mantine/core";

const HomePage = () => {
  return (
    <>
      <Container size="xl">
        <BackgroundImage
          src="/assets/panoramica.png"
          radius="md"
        >
          <Center p="md">
            <Title order={1} c="white" mt={40} fw={700} ta="center">
              Bienvenidos a MIRÓ
            </Title>
          </Center>
          <Center p="xs">
            <Title order={4} c="white" mt={20} mb={40} fw={700} ta="center">
              El mecanismo de información y reporte oficial de la Universidad de Ibagué.
            </Title>
          </Center>
        </BackgroundImage>
      </Container>
    </>
  );
};

export default HomePage;
