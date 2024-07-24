"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
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
  Modal,
  Select,
  Box,
  ScrollArea,
  Stack,
  Tooltip,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconPlus, IconTrash, IconSettings } from "@tabler/icons-react";
import axios from "axios";
import styles from './AdminValidationCreatePage.module.css'; // Importar el módulo CSS

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
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [tooltipContent, setTooltipContent] = useState<string>("");
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const handleAddColumn = () => {
    const newColumns = [...columns, { name: "", is_validator: false, type: "", values: [] }];
    setColumns(newColumns);
    setNewValues([...newValues, ""]);

    // Add empty values to all columns to keep rows synchronized
    newColumns.forEach(column => {
      while (column.values.length < newColumns[0].values.length) {
        column.values.push("");
      }
    });

    setShowTooltip(newColumns.length > 4);
  };

  const handleRemoveColumn = (index: number) => {
    const newColumns = columns.slice();
    newColumns.splice(index, 1);
    setColumns(newColumns);
    const newValuesArray = newValues.slice();
    newValuesArray.splice(index, 1);
    setNewValues(newValuesArray);
    setShowTooltip(newColumns.length > 4);
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

  const handleAddValue = () => {
    const newColumns = columns.map(column => ({
      ...column,
      values: [...column.values, ""],
    }));
    setColumns(newColumns);
    setNewValues(Array(newColumns.length).fill(""));
  };

  const handleRemoveValue = (valIndex: number) => {
    const newColumns = columns.map(column => ({
      ...column,
      values: column.values.filter((_, i) => i !== valIndex),
    }));
    setColumns(newColumns);
  };

  const handleOpenModal = (index: number) => {
    setCurrentColumnIndex(index);
    setModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isFormValid) {
      setShowTooltip(true);
      return;
    }
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

  useEffect(() => {
    const validateForm = () => {
      if (!name) {
        setTooltipContent("El nombre de la validación es obligatorio.");
        setIsFormValid(false);
        return;
      }
      if (columns.length === 0) {
        setTooltipContent("Debe agregar al menos una columna.");
        setIsFormValid(false);
        return;
      }
      for (const column of columns) {
        if (!column.name) {
          setTooltipContent("Todos los nombres de las columnas son obligatorios.");
          setIsFormValid(false);
          return;
        }
        if (!column.type) {
          setTooltipContent("Debe seleccionar un tipo para todas las columnas.");
          setIsFormValid(false);
          return;
        }
        if (column.values.length === 0) {
          setTooltipContent("Cada columna debe tener al menos un valor.");
          setIsFormValid(false);
          return;
        }
      }
      setTooltipContent("Correcto");
      setIsFormValid(true);
    };

    validateForm();
  }, [name, columns]);

  return (
    <Container size="md">
      <Title ta={"center"} order={2} my="lg">Crear Nueva Validación</Title>
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
          <Center mb="md" mt="md">
            <Button onClick={handleAddColumn} leftSection={<IconPlus size={20} />}>
              Agregar Columna
            </Button>
          </Center>
          <Tooltip
            label="Desplázate horizontalmente para ver todas las columnas"
            position="bottom"
            withArrow
            opened={showTooltip}
            transitionProps={{ transition: "slide-up", duration: 300 }}
          >
            <ScrollArea
              style={{ maxWidth: '100%', overflowX: 'auto' }}
              viewportRef={scrollAreaRef}
            >
              <Group wrap="nowrap" align="start">
                {columns.map((column, colIndex) => (
                  <Box
                    mb="md"
                    m={5}
                    key={colIndex}
                    className={column.is_validator ? styles.validatorColumn : ""}
                    style={{ minWidth: 200, maxWidth: 250 }}
                  >
                    <Stack p="xs" gap="xs">
                      <TextInput
                        placeholder="Nombre de la columna"
                        value={column.name}
                        onChange={(event) => handleChangeColumn(colIndex, 'name', event.currentTarget.value)}
                        required
                      />
                      <Center>
                        <Group>
                          <Button variant="outline" onClick={() => handleOpenModal(colIndex)}>
                            <IconSettings size={20} />
                          </Button>
                          <Button color="red" variant="outline" onClick={() => handleRemoveColumn(colIndex)}>
                            <IconTrash size={20} />
                          </Button>
                        </Group>
                      </Center>
                      {column.values.map((value, valIndex) => (
                        <Group grow key={valIndex} mb="xs">
                          <TextInput
                            value={value}
                            placeholder="Ingresa un valor"
                            onChange={(event) => {
                              const newColumns = columns.slice();
                              newColumns[colIndex].values[valIndex] = event.currentTarget.value;
                              setColumns(newColumns);
                            }}
                          />
                        </Group>
                      ))}
                    </Stack>
                  </Box>
                ))}
                <Box mt={107} style={{ minWidth: 50, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {columns.length > 0 && columns[0].values.map((_, valIndex) => (
                    <Center mb={20} key={valIndex}>
                      <Button color="red" variant="outline" onClick={() => handleRemoveValue(valIndex)}>
                        <IconTrash size={20} />
                      </Button>
                    </Center>
                  ))}
                </Box>
              </Group>
            </ScrollArea>
          </Tooltip>
          <Center mt={45}>
            <Button onClick={handleAddValue} leftSection={<IconPlus size={20} />}>
              Agregar Fila
            </Button>
          </Center>
          <Center mt="md">
            <Tooltip
              label={tooltipContent}
              position="right"
              withArrow
              transitionProps={{ transition: "fade-left", duration: 300 }}
            >
              <div>
                <Button type="submit" disabled={!isFormValid}>Crear Validación</Button>
              </div>
            </Tooltip>
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
