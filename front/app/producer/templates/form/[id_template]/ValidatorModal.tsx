import { useState, useEffect } from "react";
import { Modal, Text, Group, ScrollArea } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import axios from "axios";

interface ValidatorModalProps {
  opened: boolean;
  onClose: () => void;
  validatorId: string;
}

interface ValidatorData {
  name: string;
  columns: { name: string; values: any[] }[];
}

export const ValidatorModal = ({ opened, onClose, validatorId }: ValidatorModalProps) => {
  const [validatorData, setValidatorData] = useState<ValidatorData | null>(null);

  useEffect(() => {
    const fetchValidatorData = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validators/id?id=${validatorId}`);
        console.log(response.data.validator);
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

  return (
    <Modal opened={opened} onClose={onClose} title="Valores aceptados">
      <ScrollArea style={{ height: 300 }}>
        {validatorData ? (
          validatorData.columns.map((column) => (
            <div key={column.name}>
              <Text w={500}>{column.name}</Text>
              <ul>
                {column.values.map((value, index) => (
                  <li key={index}>{value}</li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <Text ta="center" c="dimmed">Cargando...</Text>
        )}
      </ScrollArea>
    </Modal>
  );
};
