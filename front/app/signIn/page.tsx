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
  Group,
  useMantineTheme,
} from "@mantine/core";
import { IconBrandGoogleFilled, IconArrowLeft } from "@tabler/icons-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useColorScheme } from '@mantine/hooks';

const SignInPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const theme = useMantineTheme();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status]);

  const paperBackground = colorScheme === 'dark'
    ? 'rgba(30, 30, 30, 0.5)'
    : 'rgba(255, 255, 255, 0.5)';

  return (
    <BackgroundImage src="/assets/CampusAtardecer.webp" style={{ width: '100vw', height: '100vh' }}>
      <Center style={{ width: '100%', height: '100%' }}>
        <Container size={500}>
          <Paper 
            radius="md" 
            p={50} 
            withBorder 
            shadow="xl" 
            style={{ 
              backgroundColor: paperBackground,
              backdropFilter: 'blur(10px)',
              color: colorScheme === 'dark' ? theme.colors.gray[0] : theme.colors.dark[9],
            }}
          >
            <Title ta="center" mb={20}>
              Bienvenido a MIRÓ
            </Title>
            <Text size="sm" ta="center" mb={20}>
              Utiliza tu cuenta institucional para iniciar sesión:
            </Text>
            <Group mb={20}>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                leftSection={<IconArrowLeft size={20} />}
              >
                Volver al Home
              </Button>
            </Group>
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
