"use client";

import {
  Button,
  Container,
  Paper,
  Title,
  Text,
  Flex,
} from "@mantine/core";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { signIn } from "next-auth/react";

const SignInPage = () => {
  return (
    <Container size={500} my={40}>
      <Paper radius="md" p="xl" withBorder shadow="xs">
        <Title ta="center" mb={20}>
          Bienvenido a MIRÓ
        </Title>
        <Text size="sm" ta="center" mb={20}>
          Utiliza tu cuenta institucional para iniciar sesión:
        </Text>
        <Button
          onClick={() => signIn("google")}
          fullWidth
          leftSection={<IconBrandGoogleFilled size={30}/>}
          radius="md"
          size="md"
          mt={14}
        >
            Iniciar sesión con Google
        </Button>
      </Paper>
    </Container>
  );
};

export default SignInPage;
