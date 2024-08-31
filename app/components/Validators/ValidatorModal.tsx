import { useState, useEffect } from "react";
import { Modal, Text, Table, ScrollArea, ActionIcon, Center } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import { IconCopy } from "@tabler/icons-react";

interface ValidatorModalProps {
  opened: boolean;
  onClose: () => void;
  validatorId: string;
}

interface ValidatorData {
  name: string;
  columns: { name: string; is_validator: boolean; values: any[] }[];
}

export const ValidatorModal = ({ opened, onClose, validatorId }: ValidatorModalProps) => {
  const [validatorData, setValidatorData] = useState<ValidatorData | null>(null);

  useEffect(() => {
    const fetchValidatorData = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validators/id?id=${validatorId}`);
        setValidatorData(response.data.validator);
      } catch (error) {
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
    <Modal opened={opened} onClose={onClose} title="Valores aceptados">
      <ScrollArea style={{ height: 300 }}>
        {validatorData ? (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Valores aceptados</Table.Th>
                <Table.Th>Descripción</Table.Th>
                <Table.Th>Copiar</Table.Th>
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
        ) : (
          <Text ta="center" c="dimmed">Cargando...</Text>
        )}
      </ScrollArea>
    </Modal>
  );
};
