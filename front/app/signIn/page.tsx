"use client";

import { useEffect } from "react";
import {
  Button,
  Container,
  Paper,
  Title,
  Text,
  BackgroundImage,
  Center,
} from "@mantine/core";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const SignInPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status]);

  return (
    <BackgroundImage src="/assets/CampusAtardecer.webp" style={{ width: '100vw', height: '100vh' }}>
      <Center style={{ width: '100%', height: '100%' }}>
        <Container size={500}>
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
              leftSection={<IconBrandGoogleFilled size={30} />}
              radius="md"
              size="md"
              mt={14}
            >
              Iniciar sesión con Google
            </Button>
          </Paper>
        </Container>
      </Center>
    </BackgroundImage>
  );
};

export default SignInPage;
