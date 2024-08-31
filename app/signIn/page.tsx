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
import classes from '../../app/signIn/SignIn.module.css';

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
              transition: 'background-color 0.3s ease-in-out',
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
                fullWidth
                leftSection={<IconArrowLeft size={20} />}
                radius="md"
                size="md"
                mt={10}
              >
                Volver al Inicio
              </Button>
            </Group>
            <Button
              onClick={() => signIn("google")}
              fullWidth
              leftSection={<IconBrandGoogleFilled size={30} />}
              radius="md"
              size="md"
              mt={14}
              variant="gradient"
              gradient={{ from: 'indigo', to: 'blue', deg: 85 }}
              className={classes.gradientButton}
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
