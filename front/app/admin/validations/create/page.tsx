"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  TextInput,
  Button,
  Group,
  Title,
  Paper,
  Center,
  Checkbox,
  Table,
  ScrollArea,
  Modal,
  Select,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconPlus, IconTrash, IconSettings } from "@tabler/icons-react";
import axios from "axios";

interface Column {
  name: string;
  is_validator: boolean;
  type: string;
  values: string[];
}

const AdminValidationCreatePage = () => {
  const [name, setName] = useState<string>("");
  const [columns, setColumns] = useState<Column[]>([]);
  const [newValues, setNewValues] = useState<string[]>(Array(columns.length).fill(""));
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [currentColumnIndex, setCurrentColumnIndex] = useState<number | null>(null);
  const router = useRouter();

  const handleAddColumn = () => {
    setColumns([...columns, { name: "", is_validator: false, type: "", values: [] }]);
    setNewValues([...newValues, ""]);
  };

  const handleRemoveColumn = (index: number) => {
    const newColumns = columns.slice();
    newColumns.splice(index, 1);
    setColumns(newColumns);
    const newValuesArray = newValues.slice();
    newValuesArray.splice(index, 1);
    setNewValues(newValuesArray);
  };

  const handleChangeColumn = (index: number, field: string, value: string | boolean) => {
    const newColumns = columns.slice();
    newColumns[index] = { ...newColumns[index], [field]: value };
    setColumns(newColumns);
  };

  const handleChangeValue = (index: number, value: string) => {
    const newValuesArray = newValues.slice();
    newValuesArray[index] = value;
    setNewValues(newValuesArray);
  };

  const handleAddValue = (index: number) => {
    const newColumns = columns.slice();
    newColumns[index].values.push(newValues[index]);
    setColumns(newColumns);
    const newValuesArray = newValues.slice();
    newValuesArray[index] = "";
    setNewValues(newValuesArray);
  };

  const handleRemoveValue = (colIndex: number, valIndex: number) => {
    const newColumns = columns.slice();
    newColumns[colIndex].values.splice(valIndex, 1);
    setColumns(newColumns);
  };

  const handleOpenModal = (index: number) => {
    setCurrentColumnIndex(index);
    setModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/validators/create`, {
        name,
        columns,
      });
      showNotification({
        title: "Validación creada",
        message: "La validación ha sido creada exitosamente",
        color: "teal",
      });
      router.push("/admin/validations");
    } catch (error) {
      console.error("Error creating validation:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al crear la validación",
        color: "red",
      });
    }
  };

  return (
    <Container size="md">
      <Title order={2} my="lg">Crear Nueva Validación</Title>
      <Paper radius="md" p="xl" withBorder shadow="xs">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Nombre de la Validación"
            placeholder="Ingrese el nombre de la validación"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            required
            mb="md"
          />
          <ScrollArea style={{ maxWidth: '100%', overflowX: columns.length > 3 ? 'auto' : 'hidden' }}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  {columns.map((column, colIndex) => (
                    <Table.Th key={colIndex}>
                      <TextInput
                        placeholder="Nombre de la columna"
                        value={column.name}
                        onChange={(event) => handleChangeColumn(colIndex, 'name', event.currentTarget.value)}
                        required
                      />
                      <Center>
                        <Group mt="xs">
                          <Button onClick={() => handleOpenModal(colIndex)}>
                            <IconSettings size={20} />
                          </Button>
                          <Button color="red" variant="outline" onClick={() => handleRemoveColumn(colIndex)}>
                            <IconTrash size={20} />
                          </Button>
                        </Group>
                      </Center>
                      <Button onClick={() => handleAddValue(colIndex)} leftSection={<IconPlus size={20} />} fullWidth mt="xs">
                        Agregar Valor
                      </Button>
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {[...Array(Math.max(...columns.map(column => column.values.length), 0))].map((_, rowIndex) => (
                  <Table.Tr key={rowIndex}>
                    {columns.map((column, colIndex) => (
                      <Table.Td key={colIndex}>
                        {column.values[rowIndex] ? (
                          <Group mb="xs">
                            <TextInput
                              value={column.values[rowIndex]}
                              readOnly
                            />
                            <Button color="red" variant="outline" onClick={() => handleRemoveValue(colIndex, rowIndex)}>
                              <IconTrash size={20} />
                            </Button>
                          </Group>
                        ) : (
                          <Table.Td>
                            <Group mb="xs">
                              <TextInput
                                placeholder="Ingrese un valor"
                                value={newValues[colIndex]}
                                onChange={(event) => handleChangeValue(colIndex, event.currentTarget.value)}
                              />
                              <Button onClick={() => handleAddValue(colIndex)}>
                                Agregar Valor
                              </Button>
                            </Group>
                          </Table.Td>
                        )}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          <Center mt="md">
            <Button onClick={handleAddColumn} leftSection={<IconPlus size={20} />}>
              Agregar Columna
            </Button>
          </Center>
          <Center mt="md">
            <Button type="submit">Crear Validación</Button>
          </Center>
        </form>
      </Paper>
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Configuración de Columna"
      >
        {currentColumnIndex !== null && (
          <>
            <Select
              label="Tipo"
              placeholder="Seleccione el tipo"
              value={columns[currentColumnIndex].type}
              onChange={(value) => handleChangeColumn(currentColumnIndex, 'type', value || '')}
              data={[
                { value: 'Texto', label: 'Texto' },
                { value: 'Número', label: 'Número' },
              ]}
              required
            />
            <Checkbox
              label="Es Validador"
              checked={columns[currentColumnIndex].is_validator}
              onChange={(event) => handleChangeColumn(currentColumnIndex, 'is_validator', event.currentTarget.checked)}
              mt="md"
            />
          </>
        )}
      </Modal>
    </Container>
  );
};

export default AdminValidationCreatePage;
