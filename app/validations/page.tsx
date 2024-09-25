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
  Stack,
  Table,
  Paper,
} from '@mantine/core';
import axios from 'axios';
import { IconBulb, IconCopy } from '@tabler/icons-react';

interface Validator {
  _id: string;
  name: string;
  description?: string;
  columns: Column[];
}

interface Column {
  name: string;
  is_validator: boolean;
  type: string;
  values: any[];
}

const ValidationsPage = () => {
  const [validators, setValidators] = useState<Validator[]>([]);
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [loading, setLoading] = useState(false);

  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [tableRows, setTableRows] = useState<any[]>([]);

  useEffect(() => {
    const fetchValidators = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validators/allValidators`);
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
      const validator = response.data.validator;

      const columnNames = validator.columns.map((col: Column) => col.name);
      const numRows = validator.columns[0].values.length;

      const rows = [];
      for (let i = 0; i < numRows; i++) {
        const row: any = {};
        validator.columns.forEach((col: Column) => {
          row[col.name] = col.values[i];
        });
        rows.push(row);
      }

      setSelectedValidator(validator);
      setColumnNames(columnNames);
      setTableRows(rows);
    } catch (error) {
      console.error("Error al obtener la validación:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xl">
      <Grid>
        <Grid.Col span={{ base: 12, md: 3}}>
            <Box>
              <Title m={5} ta={"center"}>Validaciones</Title>
              <Text c="dimmed" size="md" ta={"center"} m="md" >
                <IconBulb color="#797979" size={20}></IconBulb>
                <br/>
                Selecciona una validacion para ver sus detalles
              </Text>
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
            {loading ? (
              <Center>
                <Loader />
              </Center>
            ) : selectedValidator ? (
              <div>
                <Title ta={"center"} order={1}>{selectedValidator.name}</Title>
                {selectedValidator.description && (
                  <Text mt="md">{selectedValidator.description}</Text>
                )}
                <Title order={4} mt="lg">Datos de la Validación:</Title>
                <ScrollArea>
                  <Table mt={"md"} striped highlightOnHover withColumnBorders withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        {columnNames.map((name, index) => (
                          <Table.Th key={index}>{name}</Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {tableRows.map((row, rowIndex) => (
                        <Table.Tr key={rowIndex}>
                          {columnNames.map((colName, colIndex) => (
                            <Table.Td key={colIndex}>{row[colName]}</Table.Td>
                          ))}
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                    <Table.Caption>Click sobre la validacion para copiar su valor. <br/> <IconCopy size={20}/> </Table.Caption>
                  </Table>
                </ScrollArea>
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
