"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Button, Group, Text, Table, ActionIcon, ScrollArea, Title, TextInput, NumberInput, Modal, Center } from "@mantine/core";
import { IconPlus, IconTrash, IconEye } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { useSession } from "next-auth/react";
import 'dayjs/locale/es';

interface Field {
  name: string;
  datatype: string;
  required: boolean;
  validate_with?: { id: string, name: string };
  comment?: string;
}

interface Template {
  _id: string;
  name: string;
  fields: Field[];
}

interface PublishedTemplateResponse {
  name: string;
  template: Template;
}

interface ValidatorData {
  name: string;
  columns: { name: string; is_validator: boolean; values: any[] }[];
}

const ProducerTemplateFormPage = ({ params }: { params: { id_template: string } }) => {
  const { id_template } = params;
  const { data: session } = useSession();
  const router = useRouter();
  const [publishedTemplateName, setPublishedTemplateName] = useState<string>("");
  const [template, setTemplate] = useState<Template | null>(null);
  const [rows, setRows] = useState<Record<string, any>[]>([{}]);
  const [validatorModalOpen, setValidatorModalOpen] = useState(false);
  const [validatorData, setValidatorData] = useState<ValidatorData | null>(null);

  const fetchTemplate = async () => {
    try {
      const response = await axios.get<PublishedTemplateResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/pTemplates/template/${id_template}`
      );
      setPublishedTemplateName(response.data.name);
      setTemplate(response.data.template);
    } catch (error) {
      console.error("Error fetching template:", error);
      showNotification({
        title: "Error",
        message: "No se pudo cargar la plantilla",
        color: "red",
      });
    }
  };

  useEffect(() => {
    if (id_template) {
      fetchTemplate();
    }
  }, [id_template]);

  const handleInputChange = (rowIndex: number, fieldName: string, value: any) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex][fieldName] = value;
    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([...rows, {}]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleValidatorOpen = async (validatorId: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validators/id?id=${validatorId}`);
      setValidatorData(response.data.validator);
      setValidatorModalOpen(true);
    } catch (error) {
      showNotification({
        title: "Error",
        message: "No se pudieron cargar los datos de validación",
        color: "red",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/producer/load`, {
        email: session?.user?.email,
        pubTem_id: id_template,
        data: rows,
        edit: false,
      });
      showNotification({
        title: "Éxito",
        message: "Datos enviados exitosamente",
        color: "teal",
      });
      router.push('/producer/templates/uploaded');
    } catch (error) {
      console.error("Error submitting data:", error);
      showNotification({
        title: "Error",
        message: "No se pudo enviar la información",
        color: "red",
      });
    }
  };

  const renderInputField = (field: Field, row: Record<string, any>, rowIndex: number) => {
    const commonProps = {
      value: row[field.name] || "",
      onChange: (e: any) => handleInputChange(rowIndex, field.name, e.currentTarget?.value || e),
      required: field.required,
      placeholder: field.comment,
    };

    switch (field.datatype) {
      case "Entero":
        return (
          <NumberInput
            {...commonProps}
            value={row[field.name] || ""}
            min={0}
            hideControls
          />
        );
      case "Texto Corto":
      case "Texto Largo":
        return <TextInput {...commonProps} />;
      case "Fecha":
        return (
          <DateInput
            {...commonProps}
            locale="es"
            valueFormat="DD/MM/YYYY"
          />
        );
      default:
        return <TextInput {...commonProps} />;
    }
  };

  if (!template) {
    return <Text ta="center" c="dimmed">Cargando Información...</Text>;
  }

  return (
    <Container size="xl">
      <Title ta="center" mb="md">{`Completar Plantilla: ${publishedTemplateName}`}</Title>
      <ScrollArea>
        <Table withTableBorder withColumnBorders withRowBorders>
          <Table.Thead>
            <Table.Tr>
              {template.fields.map((field) => (
                <Table.Th key={field.name}>
                  <Group>
                    {field.name} {field.required && <Text span color="red">*</Text>}
                    {field.validate_with && (
                      <ActionIcon
                        size={"lg"}
                        onClick={() => handleValidatorOpen(field.validate_with?.id!)}
                        title="Ver valores aceptados"
                      >
                        <IconEye />
                      </ActionIcon>
                    )}
                  </Group>
                </Table.Th>
              ))}
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, rowIndex) => (
              <Table.Tr key={rowIndex}>
                {template.fields.map((field) => (
                  <Table.Td key={field.name}>
                    <Group align="center">
                      {renderInputField(field, row, rowIndex)}
                    </Group>
                  </Table.Td>
                ))}
                <Table.Td>
                  <Center>
                    <ActionIcon color="red" onClick={() => removeRow(rowIndex)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Center>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <Group justify="center" mt="md">
        <Button color={"red"} variant="outline" onClick={() => router.push('/producer/templates')}>
          Cancelar
        </Button>
        <Group>
          <Button variant="light" onClick={addRow}>
            <IconPlus size={16} /> Agregar Fila
          </Button>
          <Button onClick={handleSubmit}>Enviar</Button>
        </Group>
      </Group>

      <Modal
        opened={validatorModalOpen}
        onClose={() => setValidatorModalOpen(false)}
        title="Valores aceptados"
      >
        {validatorData ? (
          <ScrollArea style={{ height: 300 }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Valores aceptados</Table.Th>
                  <Table.Th>Descripción</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {validatorData.columns.map((column, columnIndex) => {
                  if (column.is_validator) {
                    return column.values.map((value, valueIndex) => (
                      <Table.Tr key={`${columnIndex}-${valueIndex}`}>
                        <Table.Td>{value}</Table.Td>
                        <Table.Td>
                          {validatorData.columns.find(
                            (col) => !col.is_validator
                          )?.values[valueIndex]}
                        </Table.Td>
                      </Table.Tr>
                    ));
                  }
                  return null;
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        ) : (
          <Text ta="center" c="dimmed">Cargando...</Text>
        )}
      </Modal>
    </Container>
  );
};

export default ProducerTemplateFormPage;
