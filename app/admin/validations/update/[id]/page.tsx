"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Text
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconPlus, IconTrash, IconSettings, IconBulb } from "@tabler/icons-react";
import axios from "axios";
import styles from './AdminValidationUpdatePage.module.css';

interface Column {
  name: string;
  is_validator: boolean;
  type: string;
  values: (string | number)[];
}

const AdminValidationUpdatePage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [name, setName] = useState<string>("");
  const [columns, setColumns] = useState<Column[]>([]);
  const [newValues, setNewValues] = useState<(string | number)[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [currentColumnIndex, setCurrentColumnIndex] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [tooltipContent, setTooltipContent] = useState<string>("");
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchValidation = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validators/id`, {
          params: { id: id }
        });
        const { validator } = response.data;
        setName(validator.name);
        setColumns(validator.columns);
        setNewValues(validator.columns.map(() => ""));
        setShowTooltip(validator.columns.length > 4);
      } catch (error) {
        console.error("Error fetching validation:", error);
      }
    };

    fetchValidation();
  }, [id]);

  useEffect(() => {
  }, [columns]);

  const handleAddColumn = () => {
    const newColumns = [...columns, { name: "", is_validator: false, type: "", values: [] }];
    setColumns(newColumns);
    setNewValues([...newValues, ""]);

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

  const handleChangeValue = (index: number, value: string | number) => {
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

    // Convert values to their respective types before saving
    const columnsToSave = columns.map(column => ({
      ...column,
      values: column.values.map(value => column.type === 'Número' ? Number(value) : String(value))
    }));

    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/validators/update`, {
        id,
        name,
        columns: columnsToSave,
      });
      showNotification({
        title: "Validación actualizada",
        message: "La validación ha sido actualizada exitosamente",
        color: "teal",
      });
      router.push("/admin/validations");
    } catch (error) {
      console.error("Error updating validation:", error);
      let errorMessage = "Hubo un error al actualizar la validación";
      const backendMessage = axios.isAxiosError(error) ? error.response?.data?.status : null;

      if (backendMessage === "Columns name cannot contain '-' character") {
        errorMessage = "El nombre de las columnas no puede tener un guión '-'";
      }
      showNotification({
        title: "Error",
        message: errorMessage,
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
      let hasValidator = false;
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
        if (column.is_validator) {
          hasValidator = true;
        }
        for (const value of column.values) {
          if (value === "" || value === null || value === undefined) {
            setTooltipContent("Todos los valores de las columnas deben estar llenos.");
            setIsFormValid(false);
            return;
          }
        }
      }
      if (!hasValidator) {
        setTooltipContent("Debe marcar al menos una columna como validadora.");
        setIsFormValid(false);
        return;
      }
      setTooltipContent("Correcto");
      setIsFormValid(true);
    };

    validateForm();
  }, [name, columns]);

  return (
    <Container size="xl">
      <Title ta={"center"} order={2} my="lg">Actualizar Validación</Title>
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
          <Text c="dimmed" size="xs" ta={"center"} mt="md" >
            <IconBulb color="#797979" size={20}></IconBulb>
            <br/>
            Para el nombre de las columnas no uses "-", en su lugar usa "_"
          </Text>
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
                            value={String(value)}
                            placeholder="Ingresa un valor"
                            onChange={(event) => {
                              const newColumns = columns.slice();
                              const newValue = column.type === 'Número' ? Number(event.currentTarget.value) : event.currentTarget.value;
                              newColumns[colIndex].values[valIndex] = newValue;
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
                <Button type="submit" disabled={!isFormValid}>
                  Actualizar Validación
                </Button>
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
        {currentColumnIndex !== null && columns[currentColumnIndex] && (
          <>
            <Select
              label="Tipo"
              placeholder="Seleccione el tipo"
              value={columns[currentColumnIndex].type || ""}
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

export default AdminValidationUpdatePage;
