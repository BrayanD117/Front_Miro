import { useState, useEffect } from "react";
import {
  ScrollArea,
  Text,
  Button,
  Table,
  Title,
  Paper,
  ActionIcon,
  Center,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import { IconCopy } from "@tabler/icons-react";

interface ValidatorPanelProps {
  validatorId: string;
  onClose: () => void;
}

interface ValidatorData {
  name: string;
  columns: { name: string; is_validator: boolean; values: any[] }[];
}

export const ValidatorPanel = ({
  validatorId,
  onClose,
}: ValidatorPanelProps) => {
  const [validatorData, setValidatorData] = useState<ValidatorData | null>(
    null
  );

  useEffect(() => {
    const fetchValidatorData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/validators/id?id=${validatorId}`
        );
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

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    showNotification({
      title: "Valor copiado",
      message: `"${value}" ha sido copiado al portapapeles`,
      color: "teal",
    });
  };

  return (
    <Paper withBorder shadow="sm" p="md" m="md">
      <Button
        onClick={onClose}
        variant="outline"
        style={{ marginBottom: "10px" }}
      >
        Cerrar
      </Button>
      <ScrollArea style={{ height: "85vh" }}>
        {validatorData ? (
          <>
            <Title order={3}>{`${validatorData.name} - Código`}</Title>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Valores aceptados</Table.Th>
                  <Table.Th>Descripción</Table.Th>
                  <Table.Th>Copiar valor aceptado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {validatorData.columns.map((column, columnIndex) => {
                  if (column.is_validator) {
                    return column.values.map((value, valueIndex) => (
                      <Table.Tr key={`${columnIndex}-${valueIndex}`}>
                        <Table.Td>{value}</Table.Td>
                        <Table.Td>
                          {
                            validatorData.columns.find(
                              (col) => !col.is_validator
                            )?.values[valueIndex]
                          }
                        </Table.Td>
                        <Table.Td>
                          <Center>
                            <ActionIcon onClick={() => handleCopy(value)}>
                              <IconCopy size={16} />
                            </ActionIcon>
                          </Center>
                        </Table.Td>
                      </Table.Tr>
                    ));
                  }
                  return null;
                })}
              </Table.Tbody>
            </Table>
          </>
        ) : (
          <Text ta="center" c="dimmed">
            Cargando...
          </Text>
        )}
      </ScrollArea>
    </Paper>
  );
};
