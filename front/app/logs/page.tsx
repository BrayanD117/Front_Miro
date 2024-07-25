"use client"

import { Container, Table, Title, Text } from '@mantine/core';
import { IconBulb } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface ErrorDetail {
  register: number;
  message: string;
}

interface ColumnError {
  column: string;
  errors: ErrorDetail[];
}

const ErrorLogsPage = () => {
  const [columnErrors, setColumnErrors] = useState<ColumnError[]>([]);

  useEffect(() => {
    const errors = localStorage.getItem('errorDetails');
    if (errors) {
      setColumnErrors(JSON.parse(errors));
      console.log("Errores recibidos:", errors);
      localStorage.removeItem('errorDetails');
    }
  }, []);

  return (
    <Container size="xl">
      <Title ta="center" order={1} mb="md">Errores Encontrados</Title>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Columna</Table.Th>
            <Table.Th>Fila</Table.Th>
            <Table.Th>Error</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {columnErrors.flatMap((columnError, index) =>
            columnError.errors.map((detail, subIndex) => (
              <Table.Tr key={`${index}-${subIndex}`}>
                <Table.Td>{columnError.column}</Table.Td>
                <Table.Td>{detail.register + 1}</Table.Td>
                <Table.Td>{detail.message}</Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
      {columnErrors.length === 0 && (
        <>
          <Text c="dimmed" ta="center" mt="md">No se encontraron errores.</Text>
          <Text c="dimmed" size="xs" ta="center" mt="md" >
            <IconBulb color="#797979" size={20}></IconBulb>
            <br/>
            Si quieres ver los errores de una carga anterior, vuelve a subir el archivo.
          </Text>
        </>
      )}
    </Container>
  );
};

export default ErrorLogsPage;
