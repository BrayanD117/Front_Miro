import { useState, useEffect } from "react";
import { ScrollArea, Text, Button, Table, Title, Paper } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import axios from "axios";

interface ValidatorPanelProps {
  validatorId: string;
  onClose: () => void;
}

interface ValidatorData {
  name: string;
  columns: { name: string; values: any[] }[];
}

export const ValidatorPanel = ({ validatorId, onClose }: ValidatorPanelProps) => {
  const [validatorData, setValidatorData] = useState<ValidatorData | null>(null);

  useEffect(() => {
    const fetchValidatorData = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validators/id?id=${validatorId}`);
        console.log("Validator data:", response.data.validator);
        setValidatorData(response.data.validator);
      } catch (error) {
        console.error("Error fetching validator data:", error);
        showNotification({
          title: "Error",
          message: "No se pudieron cargar los datos de validación",
          color: "red",
        });
      }
    };

    if (validatorId) {
      fetchValidatorData();
    }
  }, [validatorId]);

  return (
    <Paper withBorder shadow="sm" p="md" m="md">
      <Button onClick={onClose} variant="outline" style={{ marginBottom: '10px' }}>
        Cerrar
      </Button>
      <ScrollArea style={{ height: '85vh' }}>
        {validatorData ? (
          <>
            <Title order={3}>{validatorData.name}</Title>
            {validatorData.columns.map((column) => (
                <>
                    <Text w={500}>{column.name}</Text>
                    <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                        <Table.Th>Index</Table.Th>
                        <Table.Th>Value</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {column.values.map((value, index) => (
                        <Table.Tr key={index}>
                            <Table.Td>{index + 1}</Table.Td>
                            <Table.Td>{value}</Table.Td>
                        </Table.Tr>
                        ))}
                    </Table.Tbody>
                    </Table>
                </>
            ))}
          </>
        ) : (
          <Text ta="center" c="dimmed">Cargando...</Text>
        )}
      </ScrollArea>
    </Paper>
  );
};
