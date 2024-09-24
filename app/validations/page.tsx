"use client";

import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Text,
  ScrollArea,
  NavLink,
  Title,
  Loader,
  Center,
  Divider,
  Box,
  Group,
  Stack,
  Paper,
} from '@mantine/core';
import axios from 'axios';

interface Validator {
  _id: string;
  name: string;
  description: string;
  columns: Column[];
}

interface Column {
  name: string;
  type: string;
  is_validator: boolean;
  values: any[];
}

const ValidationsPage = () => {
  const [validators, setValidators] = useState<Validator[]>([]);
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchValidators = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validators/allValidators`);
        console.log("response.data.validators", response.data.validators);
        setValidators(response.data.validators);
      } catch (error) {
        console.error("Error al obtener las validaciones:", error);
      }
    };
  
    fetchValidators();
  }, []);
  

  const handleSelectValidator = async (id: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validators/id`, {
        params: { id },
      });
      setSelectedValidator(response.data.validator);
    } catch (error) {
      console.error("Error al obtener la validación:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xl">
      <Grid>
        <Grid.Col span={3}>
            <Box>
                <Paper shadow="xl" withBorder>
                    <ScrollArea style={{ height: '100%' }}>
                        <Stack>
                            {validators.map((validator) => (
                            <NavLink
                                key={validator._id}
                                label={validator.name}
                                active={selectedValidator?._id === validator._id}
                                onClick={() => handleSelectValidator(validator._id)}
                            />
                            ))}
                        </Stack>
                    </ScrollArea>
                </Paper>
            </Box>
        </Grid.Col>
        <Grid.Col span={9}>
          <div style={{ padding: '1rem' }}>
          <Divider orientation="vertical" />
            {loading ? (
              <Center>
                <Loader />
              </Center>
            ) : selectedValidator ? (
              <div>
                <Title order={2}>{selectedValidator.name}</Title>
                {selectedValidator.description && (
                  <Text mt="md">{selectedValidator.description}</Text>
                )}
                <Title order={4} mt="lg">Columnas:</Title>
                {selectedValidator.columns.map((column, index) => (
                  <div key={index}>
                    <Text>
                      <strong>Nombre:</strong> {column.name}
                    </Text>
                    <Text>
                      <strong>Tipo:</strong> {column.type}
                    </Text>
                    <Text>
                      <strong>Es validador:</strong> {column.is_validator ? 'Sí' : 'No'}
                    </Text>
                    <Divider my="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <Text>Selecciona una validación de la lista para ver sus detalles.</Text>
            )}
          </div>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default ValidationsPage;
