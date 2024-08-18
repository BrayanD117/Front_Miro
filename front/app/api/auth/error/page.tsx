'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Title, Text, Button, Group } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Lottie from 'lottie-react';
import errorAnimation from '@/public/lottie/error.json';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  return (
    <Container style={{ textAlign: 'center', paddingTop: '5rem', maxWidth: '600px' }}>
      <Lottie animationData={errorAnimation} loop={true} style={{ height: 200, marginBottom: '2rem' }} />
      <Title order={1} style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        ¡Ups! Acceso Denegado
      </Title>
      <Text size="lg" color="dimmed" style={{ marginBottom: '1.5rem' }}>
        Parece que no tienes permiso para acceder a esta página.
      </Text>
      <Text size="md" style={{ marginBottom: '2rem' }}>
        {error && `Error: ${error}`}
      </Text>
      <Group justify="center">
        <Button
          size="md"
          onClick={() => router.push('/')}
          leftSection={<IconArrowLeft size={16} />}
        >
          Volver al Inicio
        </Button>
      </Group>
    </Container>
  );
}
