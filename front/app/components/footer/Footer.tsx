import { Container, Group, ActionIcon, rem, Text } from '@mantine/core';
import { IconBrandTwitter, IconBrandYoutube, IconBrandInstagram, IconBrandChrome } from '@tabler/icons-react';
import classes from './Footer.module.css';

export default function Footer() {

  const currentYear = new Date().getFullYear();

  return (
    <div className={classes.footer}>
      <Container className={classes.inner}>
        <Group justify="center">
          <Text ta="center">
            © {currentYear} MIRÓ - Universidad de Ibagué.
          </Text>
        </Group>
      </Container>
    </div>
  );
}